const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const systemSettingsService = require('../services/systemSettingsService');
const { executeSandbox, detectForbiddenCode, detectInfiniteLoop } = require('../services/sandboxService');
const { runGuardrailPipeline } = require('../services/guardrailService');
const { runCodeGradingPipeline, runPracticeCodeReviewPipeline } = require('../services/aiPipelineService');
const { extractAndStoreFromAIReview } = require('../services/mem0Service');

async function checkAndBlacklist(userId) {
  if (systemSettingsService.getSettings().autoBlacklistOnInjection) {
    await User.findByIdAndUpdate(userId, { isBlacklisted: true, blacklistedAt: new Date() });
    return true;
  }
  return false;
}

// @route   POST /api/submissions
// @access  Private/Student
exports.submitCode = async (req, res, next) => {
  try {
    const { problemId, sourceCode, language, mode = 'assessment' } = req.body;

    if (!sourceCode || !language) {
      return res.status(400).json({ success: false, message: 'sourceCode and language are required.' });
    }

    // ============================================================
    // MODE 1: PRACTICE MODE (UNGRADED - NO SCORE)
    // Arbitrary user code review with safety checks
    // ============================================================
    if (mode === 'practice') {
      const guardrailReport = await runGuardrailPipeline(sourceCode, {
        userId: req.user.id,
        mode: 'practice'
      });

      if (guardrailReport.blocked) {
        const report = guardrailReport.securityReport;
        const accountBlocked = await checkAndBlacklist(req.user.id);

        await AuditLog.create({
          user: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          eventType: 'SANDBOX_VIOLATION',
          inputPreview: `[GUARDRAIL BLOCKED] Mode: practice | Stage: ${guardrailReport.stage}`,
          metadata: {
            sandboxStatus: 'SECURITY_VIOLATION',
            score: 0,
            passRate: '0%',
            guardrailReport: report,
            accountBlocked
          }
        });

        return res.status(200).json({
          success: true,
          accountBlocked,
          submission: {
            mode: 'practice',
            sandboxStatus: 'SECURITY_VIOLATION',
            errorMessage: accountBlocked
              ? `⛔ ACCOUNT PERMANENTLY BLACKLISTED: Prompt injection security violation detected. Your account has been suspended and logged out immediately.`
              : `🛡️ Prompt Injection Blocked by Guardrail Pipeline (Stage: ${guardrailReport.stage}) | Risk Score: ${report.riskScore}% | Attack: ${report.attackType} | Severity: ${report.severity}`,
            score: null,
            passRate: 'N/A (Practice)',
            executionTime: `${report.durationMs}ms`,
            memoryUsed: '0.0 MB',
            guardrailReport: report,
            aiReview: {
              complexity: { time: 'N/A', space: 'N/A' },
              strengths: [],
              weaknesses: [`${report.attackType} detected (${report.severity} severity). Matched rules: ${report.matchedRules.join(', ')}.`],
              suggestions: ['Remove prompt manipulation, role override, or secret extraction phrases. Submit pure algorithmic code only.']
            }
          }
        });
      }

      // Guardrail passed — continue to sandbox safety checks
      const forbidCheck = detectForbiddenCode(sourceCode, language);
      if (forbidCheck.blocked) {
        return res.status(200).json({
          success: true,
          submission: {
            mode: 'practice',
            sandboxStatus: 'SECURITY_VIOLATION',
            errorMessage: `Practice Review Blocked: Detected forbidden OS/network API ("${forbidCheck.reason}").`,
            score: null,
            passRate: 'N/A (Practice)',
            executionTime: '0.000s',
            memoryUsed: '0.0 MB',
            aiReview: {
              complexity: { time: 'N/A', space: 'N/A' },
              strengths: [],
              weaknesses: ['Attempted to invoke forbidden system APIs or file operations.'],
              suggestions: ['Remove OS/system commands and write pure algorithmic logic.']
            }
          }
        });
      }

      // Safety Check 2: Infinite Loop / TLE check
      if (detectInfiniteLoop(sourceCode)) {
        return res.status(200).json({
          success: true,
          submission: {
            mode: 'practice',
            sandboxStatus: 'TIME_LIMIT_EXCEEDED',
            errorMessage: 'Practice Review Blocked: Suspected infinite loop detected without exit break.',
            score: null,
            passRate: 'N/A (Practice)',
            executionTime: '>2.000s',
            memoryUsed: '48.5 MB',
            aiReview: {
              complexity: { time: 'O(Infinite)', space: 'O(1)' },
              strengths: [],
              weaknesses: ['Infinite loop construct detected.'],
              suggestions: ['Ensure loop update condition increments towards termination.']
            }
          }
        });
      }

      // Run Practice AI Review Pipeline (Complexity + Strengths + Weaknesses + Suggestions, NO SCORE)
      const reviewResult = await runPracticeCodeReviewPipeline(sourceCode, language, req.user.id);
      const aiReview = reviewResult.aiReview;
      delete aiReview.overallScore; // Explicitly ensure NO score in Practice Mode

      // ── Post-AI Security Escalation ───────────────────────────────────────────
      // If Gemini itself detected a security issue in the code (flagged via [SECURITY ALERT]
      // in weaknesses), escalate to SECURITY_VIOLATION immediately.
      // This catches injections the guardrail regex missed (e.g. no Groq key configured).
      const aiDetectedSecurityBreach = aiReview.weaknesses?.some(w =>
        /\[SECURITY ALERT\]|\[SECURITY_ALERT\]|prompt injection|embedded directive|inject|manipulate the ai|force recommendations|override.*ai|bypass.*filter/i.test(w)
      );

      if (aiDetectedSecurityBreach) {
        await AuditLog.create({
          user: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          eventType: 'SANDBOX_VIOLATION',
          inputPreview: `[AI-DETECTED INJECTION] Mode: practice | Flagged by Gemini review pipeline`,
          metadata: {
            sandboxStatus: 'SECURITY_VIOLATION',
            score: 0,
            passRate: '0%',
            aiDetectedWeaknesses: aiReview.weaknesses
          }
        });

        return res.status(200).json({
          success: true,
          submission: {
            mode: 'practice',
            sandboxStatus: 'SECURITY_VIOLATION',
            errorMessage: `🛡️ Security Breach Detected by AI Code Review Pipeline: Embedded prompt injection directive found inside code. The AI detected an attempt to manipulate system instructions via code content.`,
            score: null,
            passRate: 'N/A (Blocked)',
            executionTime: '0.024s',
            memoryUsed: '0.0 MB',
            aiReview: {
              complexity: { time: 'N/A', space: 'N/A' },
              strengths: [],
              weaknesses: aiReview.weaknesses,
              suggestions: ['Remove prompt manipulation directives from code and comments. Submit valid algorithmic logic only.']
            }
          }
        });
      }

      // Save Practice Submission Record in MongoDB
      const practiceSubmission = await Submission.create({
        student: req.user.id,
        mode: 'practice',
        language,
        sourceCode,
        sandboxStatus: 'PRACTICE_REVIEWED',
        executionTime: '0.024s',
        memoryUsed: '12.4 MB',
        passRate: 'N/A (Practice)',
        score: null,
        testCaseResults: [],
        aiReview
      });

      return res.status(201).json({
        success: true,
        submission: practiceSubmission
      });
    }

    // ============================================================
    // MODE 2: ASSESSMENT MODE (GRADED QUESTION CHALLENGE)
    // Predefined problem with test cases, score generation, and history
    // ============================================================
    if (!problemId) {
      return res.status(400).json({ success: false, message: 'problemId is required for Assessment Mode.' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

    // Step 0: Two-Stage Guardrail on assessment code (catch injection in comments/strings)
    const assessGuardrail = await runGuardrailPipeline(sourceCode, { userId: req.user.id, mode: 'assessment', problemId });
    if (assessGuardrail.blocked) {
      const report = assessGuardrail.securityReport;
      const accountBlocked = await checkAndBlacklist(req.user.id);

      await AuditLog.create({
        user: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        eventType: 'SANDBOX_VIOLATION',
        inputPreview: `[GUARDRAIL BLOCKED] Mode: assessment | Stage: ${assessGuardrail.stage}`,
        metadata: {
          sandboxStatus: 'SECURITY_VIOLATION',
          score: 0,
          passRate: '0%',
          guardrailReport: report,
          accountBlocked
        }
      });

      return res.status(200).json({
        success: true,
        accountBlocked,
        submission: {
          mode: 'assessment',
          sandboxStatus: 'SECURITY_VIOLATION',
          errorMessage: accountBlocked
            ? `⛔ ACCOUNT PERMANENTLY BLACKLISTED: Prompt injection security violation detected. Your account has been suspended and logged out immediately.`
            : `Guardrail blocked assessment submission: ${report.attackType} (${report.severity}) — Risk: ${report.riskScore}%`,
          score: 0,
          passRate: '0/0',
          guardrailReport: report,
          aiReview: { overallScore: 0, complexity: { time: 'N/A', space: 'N/A' }, strengths: [], weaknesses: [`Guardrail blocked: ${report.matchedRules.join(', ')}`], suggestions: ['Submit only algorithm code without prompt manipulation text.'] }
        }
      });
    }

    // Step 1: Sandbox Execution (syscall block + TLE + test cases)
    const sandboxResult = executeSandbox(problem.toObject(), sourceCode, language);

    // Step 2: Audit the execution
    const auditEventType = sandboxResult.sandboxStatus === 'SECURITY_VIOLATION'
      ? 'SANDBOX_VIOLATION'
      : sandboxResult.sandboxStatus === 'TIME_LIMIT_EXCEEDED'
        ? 'SANDBOX_TLE'
        : 'CODE_SUBMITTED';

    // Step 3: AI Code Review via LangChain + Gemini (only if sandbox passed)
    let aiReview = sandboxResult.aiHints || {
      overallScore: 0,
      complexity: { time: 'N/A', space: 'N/A' },
      difficultyEstimate: 'N/A',
      strengths: [],
      weaknesses: [],
      suggestions: []
    };

    if (sandboxResult.sandboxStatus === 'ALL_PASSED' || sandboxResult.sandboxStatus === 'PARTIAL_PASSED') {
      try {
        const gradingResult = await runCodeGradingPipeline(
          problem.toObject(),
          sourceCode,
          language,
          req.user.id
        );
        aiReview = gradingResult.aiReview;

        // Store AI feedback into Mem0
        await extractAndStoreFromAIReview(req.user.id, aiReview, language);
      } catch (aiErr) {
        console.warn('[SubmissionController] AI grading failed:', aiErr.message);
        aiReview = {
          overallScore: sandboxResult.score || 5.0,
          complexity: sandboxResult.complexityHints || { time: 'O(N)', space: 'O(N)' },
          difficultyEstimate: problem.difficulty,
          strengths: ['Code executed successfully.'],
          weaknesses: ['AI qualitative review unavailable.'],
          suggestions: ['Set GEMINI_API_KEY to enable AI code feedback.']
        };
      }
    }

    // Determine final score for Assessment Mode
    const finalScore = (aiReview.overallScore !== undefined && aiReview.overallScore !== null)
      ? aiReview.overallScore
      : (sandboxResult.score || 0);

    aiReview.overallScore = finalScore;

    // ── Post-AI Security Escalation (Assessment Mode) ─────────────────────────
    // If Gemini flagged a security issue inside code weaknesses, override the status.
    const aiDetectedSecurityBreachAssessment = aiReview.weaknesses?.some(w =>
      /\[SECURITY ALERT\]|\[SECURITY_ALERT\]|prompt injection|embedded directive|inject|manipulate the ai|force recommendations|override.*ai|bypass.*filter/i.test(w)
    );

    if (aiDetectedSecurityBreachAssessment) {
      return res.status(200).json({
        success: true,
        submission: {
          mode: 'assessment',
          sandboxStatus: 'SECURITY_VIOLATION',
          errorMessage: `🛡️ Security Breach Detected by AI Code Review Pipeline: Embedded prompt injection directive found in submitted code. Submission voided.`,
          score: 0,
          passRate: '0/0',
          executionTime: sandboxResult.executionTime || '0.000s',
          memoryUsed: sandboxResult.memoryUsed || '0.0 MB',
          testCaseResults: sandboxResult.testCaseResults || [],
          aiReview: {
            overallScore: 0,
            complexity: { time: 'N/A', space: 'N/A' },
            strengths: [],
            weaknesses: aiReview.weaknesses,
            suggestions: ['Remove prompt manipulation directives from submitted code. Academic integrity violation recorded.']
          }
        }
      });
    }


    // Step 4: Store Submission in MongoDB
    const submission = await Submission.create({
      student: req.user.id,
      mode: 'assessment',
      problem: problemId,
      language,
      sourceCode,
      sandboxStatus: sandboxResult.sandboxStatus,
      executionTime: sandboxResult.executionTime,
      memoryUsed: sandboxResult.memoryUsed,
      passRate: sandboxResult.passRate,
      score: finalScore,
      testCaseResults: sandboxResult.testCaseResults || [],
      aiReview
    });

    // Step 5: Write audit log
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      eventType: auditEventType,
      inputPreview: `Problem: ${problem.title} | Lang: ${language}`,
      relatedSubmissionId: submission._id,
      metadata: {
        sandboxStatus: sandboxResult.sandboxStatus,
        score: submission.score,
        passRate: submission.passRate
      }
    });

    res.status(201).json({
      success: true,
      submission: {
        ...submission.toObject(),
        problem: { title: problem.title, difficulty: problem.difficulty }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/submissions
// @access  Private
exports.getSubmissions = async (req, res, next) => {
  try {
    const filter = req.user.role === 'student'
      ? { student: req.user.id }
      : {};

    if (req.query.problemId) filter.problem = req.query.problemId;
    if (req.query.mode) filter.mode = req.query.mode;

    const submissions = await Submission.find(filter)
      .populate('problem', 'title difficulty category')
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: submissions.length, submissions });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title difficulty')
      .populate('student', 'name email');

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/submissions/:id/grade
// @access  Private/Teacher
exports.updateSubmissionGrade = async (req, res, next) => {
  try {
    const { score, teacherNotes } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    if (score !== undefined && score !== null) submission.score = Number(score);
    if (!submission.aiReview) submission.aiReview = {};
    if (teacherNotes) {
      submission.aiReview.teacherNotes = teacherNotes;
    }

    await submission.save();
    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
};
