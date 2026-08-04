const Doubt = require('../models/Doubt');
const AuditLog = require('../models/AuditLog');
const { runDoubtResolutionPipeline } = require('../services/aiPipelineService');
const { storeMemory } = require('../services/mem0Service');
const { runGuardrailPipeline } = require('../services/guardrailService');

// @route   POST /api/doubts
// @access  Private/Student
exports.createDoubt = async (req, res, next) => {
  try {
    const { title, description, language, tags, codeSnippet } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    // ── Two-Stage Guardrail on doubt title + description + code ──────────
    const combinedInput = [title, description, codeSnippet || ''].join('\n');
    const guardrailReport = await runGuardrailPipeline(combinedInput, { userId: req.user.id, mode: 'doubt' });

    if (guardrailReport.blocked) {
      const report = guardrailReport.securityReport;

      await AuditLog.create({
        user: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        eventType: 'PROMPT_INJECTION_BLOCKED',
        inputPreview: title.substring(0, 200),
        sanitizerStatus: `BLOCKED — Stage: ${guardrailReport.stage} | Attack: ${report.attackType}`,
        injectionRiskScore: report.riskScore,
        injectionRisk: report.severity,
        injectionPatterns: report.matchedRules,
        workflowState: 'INJECTION_BLOCKED'
      });

      return res.status(200).json({
        success: false,
        blocked: true,
        message: `Prompt injection blocked by guardrail (${guardrailReport.stage}): ${report.attackType} — Risk ${report.riskScore}%`,
        securityReport: report
      });
    }

    // Guardrail passed — Run the full 6-node LangGraph AI pipeline
    const pipelineResult = await runDoubtResolutionPipeline(
      { title, description, language, codeSnippet },
      req.user.id
    );

    // Log every pipeline run
    const auditEventType = pipelineResult.blocked
      ? 'PROMPT_INJECTION_BLOCKED'
      : 'AI_DRAFT_GENERATED';

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      eventType: auditEventType,
      inputPreview: title.substring(0, 200),
      sanitizerStatus: pipelineResult.blocked
        ? `FLAGGED (Patterns: ${pipelineResult.injectionDetectedPatterns.join(', ')})`
        : 'PASSED',
      injectionRiskScore: pipelineResult.injectionRiskScore,
      injectionRisk: pipelineResult.blocked ? 'CRITICAL_ATTACK' : 'LOW',
      injectionPatterns: pipelineResult.injectionDetectedPatterns || [],
      mem0Augmented: !pipelineResult.blocked,
      langchainPromptUsed: pipelineResult.langchainPrompt?.substring(0, 500),
      llmConfidence: pipelineResult.aiDraft?.confidenceScore || 0,
      outputGuardrailStatus: pipelineResult.outputValidationPassed ? 'PASSED' : 'FLAGGED',
      workflowState: pipelineResult.blocked ? 'INJECTION_BLOCKED' : 'PENDING_REVIEW'
    });

    if (pipelineResult.blocked) {
      // Track injection attempt in Mem0 (for monitoring patterns)
      await storeMemory(
        req.user.id,
        'MISTAKE_PATTERN',
        `Prompt injection attempt detected: ${pipelineResult.injectionDetectedPatterns.join(', ')}`,
        'AI_FEEDBACK',
        0.5
      );

      return res.status(400).json({
        success: false,
        message: 'Your post was blocked by the Prompt Injection Security Guardrail.',
        injectionRiskScore: pipelineResult.injectionRiskScore,
        detectedPatterns: pipelineResult.injectionDetectedPatterns
      });
    }

    // Save doubt to MongoDB with AI draft in PENDING_REVIEW state
    const doubt = await Doubt.create({
      student: req.user.id,
      title,
      description,
      language: language || 'General',
      tags: tags || [],
      codeSnippet: codeSnippet || '',
      workflowState: 'PENDING_REVIEW',
      injectionRiskScore: pipelineResult.injectionRiskScore,
      injectionDetectedPatterns: pipelineResult.injectionDetectedPatterns,
      aiDraft: pipelineResult.aiDraft
    });

    res.status(201).json({ success: true, doubt });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/doubts
// @access  Private
exports.getDoubts = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      // Students see: approved answers + their own pending doubts
      filter = {
        $or: [
          { workflowState: 'APPROVED' },
          { student: req.user.id }
        ]
      };
    }

    if (req.query.workflowState) filter.workflowState = req.query.workflowState;
    if (req.query.tag) filter.tags = { $in: [req.query.tag] };

    const doubts = await Doubt.find(filter)
      .populate('student', 'name email')
      .populate('teacherReview.reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    // Strip aiDraft from student's own PENDING_REVIEW doubts — not approved yet
    const sanitized = doubts.map(d => {
      if (req.user.role === 'student' && d.workflowState !== 'APPROVED') {
        const obj = d.toObject();
        obj.aiDraft = null;
        return obj;
      }
      return d;
    });

    res.json({ success: true, count: sanitized.length, doubts: sanitized });
  } catch (err) {
    next(err);
  }
};


// @route   GET /api/doubts/:id
// @access  Private
exports.getDoubt = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email')
      .populate('teacherReview.reviewedBy', 'name');

    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    // Students can only see approved or their own
    if (req.user.role === 'student') {
      const isOwner = doubt.student._id.toString() === req.user.id;
      if (!isOwner && doubt.workflowState !== 'APPROVED') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      // Strip aiDraft if not yet approved
      if (doubt.workflowState !== 'APPROVED') {
        const obj = doubt.toObject();
        obj.aiDraft = null;
        return res.json({ success: true, doubt: obj });
      }
    }

    res.json({ success: true, doubt });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/doubts/:id/approve
// @access  Private/Teacher
exports.approveDoubt = async (req, res, next) => {
  try {
    const { teacherComment, editedAnswer, pinned } = req.body;

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });
    if (doubt.workflowState === 'INJECTION_BLOCKED') {
      return res.status(400).json({ success: false, message: 'Cannot approve a doubt that was blocked by security guardrails.' });
    }

    doubt.workflowState = 'APPROVED';
    doubt.updatedAt = new Date();
    if (editedAnswer && doubt.aiDraft) {
      doubt.aiDraft.suggestedFix = editedAnswer;
    }
    doubt.teacherReview = {
      status: 'APPROVED',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      teacherComment: teacherComment || 'Approved by instructor.',
      pinned: pinned || false
    };

    await doubt.save();

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: 'teacher',
      eventType: editedAnswer ? 'TEACHER_EDITED' : 'TEACHER_APPROVED',
      inputPreview: doubt.title.substring(0, 200),
      workflowState: 'APPROVED',
      relatedDoubtId: doubt._id
    });

    res.json({ success: true, doubt });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/doubts/:id/reject
// @access  Private/Teacher
exports.rejectDoubt = async (req, res, next) => {
  try {
    const { teacherComment } = req.body;

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    doubt.workflowState = 'REJECTED';
    doubt.updatedAt = new Date();
    doubt.teacherReview = {
      status: 'REJECTED',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      teacherComment: teacherComment || 'Rejected by instructor. Please refine your query.',
      pinned: false
    };

    await doubt.save();

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: 'teacher',
      eventType: 'TEACHER_REJECTED',
      inputPreview: doubt.title.substring(0, 200),
      workflowState: 'REJECTED',
      relatedDoubtId: doubt._id
    });

    res.json({ success: true, doubt });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/doubts/:id/regenerate
// @access  Private/Teacher
exports.regenerateAIDraft = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    const { teacherNotes } = req.body;

    // Re-run the LangGraph pipeline, injecting optional teacher notes into the prompt
    const pipelineResult = await runDoubtResolutionPipeline(
      {
        title: doubt.title,
        description: doubt.description,
        codeSnippet: doubt.codeSnippet,
        language: doubt.language
      },
      doubt.student.toString(),
      teacherNotes || ''
    );


    if (pipelineResult.blocked) {
      return res.status(400).json({ success: false, message: 'Regeneration blocked by guardrail.' });
    }

    doubt.aiDraft = pipelineResult.aiDraft;
    doubt.workflowState = 'PENDING_REVIEW';
    doubt.teacherReview = null;
    doubt.updatedAt = new Date();
    await doubt.save();

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: 'teacher',
      eventType: 'AI_REGENERATED',
      workflowState: 'PENDING_REVIEW',
      relatedDoubtId: doubt._id,
      llmConfidence: pipelineResult.aiDraft?.confidenceScore || 0
    });

    res.json({ success: true, doubt });
  } catch (err) {
    next(err);
  }
};
