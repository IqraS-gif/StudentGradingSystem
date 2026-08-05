import React, { useState } from 'react';
import { MessageSquare, Plus, CheckCircle, XCircle, Edit3, ShieldAlert, Cpu, User, Sparkles, Filter, Pin, Code2, CheckCircle2, ArrowLeft, Copy, Clock, Layers, Award, AlertTriangle, Lightbulb, Maximize2, Minimize2, Lock, GitFork, MoreVertical, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { doubtsAPI } from '../services/api';

// Intelligent code formatter helper: un-escapes newlines & formats single-line code blocks safely
function prettyFormatCode(codeStr) {
  if (!codeStr) return '';
  let clean = codeStr.replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\\"/g, '"');
  
  // If it already has multiple real lines (> 2), return clean lines
  const lines = clean.split('\n');
  if (lines.length >= 3) {
    return clean;
  }

  // Auto-format single-line code blocks
  let result = '';
  let indent = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if ((char === '"' || char === "'") && clean[i - 1] !== '\\') {
      if (!inString) { inString = true; stringChar = char; }
      else if (char === stringChar) { inString = false; }
      result += char;
      continue;
    }

    if (inString) {
      result += char;
      continue;
    }

    // Safely isolate single-line comments so they don't comment out subsequent code statements
    if (char === '/' && nextChar === '/') {
      result += '//';
      i++;
      let commentBuf = '';
      while (i + 1 < clean.length && clean[i + 1] !== '\n' && clean[i + 1] !== ';' && clean[i + 1] !== '{' && clean[i + 1] !== '}') {
        i++;
        commentBuf += clean[i];
      }
      result += commentBuf + '\n' + '  '.repeat(indent);
      continue;
    }

    if (char === '{') {
      indent++;
      result += ' {\n' + '  '.repeat(indent);
    } else if (char === '}') {
      indent = Math.max(0, indent - 1);
      result += '\n' + '  '.repeat(indent) + '}';
      if (nextChar !== ';' && nextChar !== '\n') {
        result += '\n' + '  '.repeat(indent);
      }
    } else if (char === ';') {
      result += ';';
      if (nextChar !== '}' && nextChar !== '\n') {
        result += '\n' + '  '.repeat(indent);
      }
    } else {
      result += char;
    }
  }

  return result.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}


export default function DoubtBoardModule({ doubts, setDoubts, mem0Profile, activeRole, auditLogs, setAuditLogs }) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterTag, setFilterTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Selected Doubt for Detail View (Level 2)
  const [selectedDoubt, setSelectedDoubt] = useState(null);

  // Teacher inline-edit state (right column)
  const [editRootCause, setEditRootCause] = useState('');
  const [editSuggestedFix, setEditSuggestedFix] = useState('');
  const [editCodeFix, setEditCodeFix] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');

  // Per-box edit toggle states
  const [isEditingRootCause, setIsEditingRootCause] = useState(false);
  const [isEditingSuggested, setIsEditingSuggested] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  // Copy state feedback
  const [copied, setCopied] = useState(false);

  // Auto-resize handler for textareas
  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Helper to render Suggested Approach as a clean numbered list
  const renderSuggestedSteps = (text) => {
    if (!text) return null;
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let items = [];
    if (rawLines.length > 1 && rawLines.some(l => /^(Step\s*\d+|\d+[\.\)])/i.test(l))) {
      items = rawLines.map(l => l.replace(/^(Step\s*\d+:\s*|\d+[\.\)]\s*)/i, ''));
    } else {
      items = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])|\n+/).map(s => s.trim()).filter(s => s.length > 4);
    }
    
    return (
      <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#14532d', fontSize: '0.84rem', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ paddingLeft: '0.2rem' }}>
            {item.replace(/^(Step\s*\d+:\s*|\d+[\.\)]\s*)/i, '')}
          </li>
        ))}
      </ol>
    );
  };

  // New doubt form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState('Java');
  const [newTags, setNewTags] = useState('');
  const [newCode, setNewCode] = useState('');

  // Post new doubt via real backend pipeline
  const handlePostDoubt = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await doubtsAPI.create({
        title: newTitle,
        description: newDesc,
        language: newLang,
        tags: newTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        codeSnippet: newCode
      });
      if (data.accountBlocked || data.message?.includes('BLACKISTED') || data.message?.includes('blacklisted')) {
        localStorage.removeItem('gp_token');
        localStorage.removeItem('gp_user');
        alert(data.message || '⛔ ACCOUNT PERMANENTLY BLACKLISTED due to prompt injection security violations.');
        window.location.reload();
        return;
      }
      setDoubts(prev => [data.doubt, ...prev]);
      setShowNewModal(false);
      setNewTitle(''); setNewDesc(''); setNewCode('');
      openDetailView(data.doubt);
    } catch (err) {
      if (err.data?.detectedPatterns) {
        alert(`Security Guardrail Alert!\n\nBlocked by Prompt Injection Classifier.\nRisk Score: ${(err.data.injectionRiskScore * 100).toFixed(0)}%\nPatterns: ${err.data.detectedPatterns.join(', ')}`);
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher actions via real backend
  const handleTeacherApprove = async (doubtId, editedAnswer = null) => {
    try {
      const data = await doubtsAPI.approve(doubtId, {
        teacherComment: 'Approved by instructor.',
        ...(editedAnswer ? { editedAnswer } : {})
      });
      setDoubts(prev => prev.map(d => (d._id === doubtId || d.id === doubtId) ? data.doubt : d));
      if (selectedDoubt && (selectedDoubt._id === doubtId || selectedDoubt.id === doubtId)) {
        setSelectedDoubt(data.doubt);
      }
    } catch (err) {
      alert(`Approve failed: ${err.message}`);
    }
  };

  const handleTeacherReject = async (doubtId) => {
    try {
      const data = await doubtsAPI.reject(doubtId, {
        teacherComment: 'Rejected. Please refine your query and check course prerequisites.'
      });
      setDoubts(prev => prev.map(d => (d._id === doubtId || d.id === doubtId) ? data.doubt : d));
      if (selectedDoubt && (selectedDoubt._id === doubtId || selectedDoubt.id === doubtId)) {
        setSelectedDoubt(data.doubt);
      }
    } catch (err) {
      alert(`Reject failed: ${err.message}`);
    }
  };

  // Filtered lists with MongoDB fallback compatibility
  const getDoubtStatus = (d) => d.workflowState || d.status;
  const getDoubtId = (d) => d._id || d.id;
  const getStudentName = (d) => typeof d.student === 'object' ? d.student?.name : (d.studentName || 'Student');
  const getInitials = (name) => {
    const parts = (name || 'Student').split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (name ? name.substring(0, 2).toUpperCase() : 'ST');
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const pendingDoubts = doubts.filter(d => getDoubtStatus(d) === 'PENDING_REVIEW');
  const visibleDoubts = activeRole === 'teacher' 
    ? doubts 
    : doubts.filter(d => getDoubtStatus(d) === 'APPROVED' || d.student === 'std-001' || typeof d.student === 'object');

  const filteredDoubts = visibleDoubts.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'ALL' || (d.tags && d.tags.includes(filterTag));
    return matchesSearch && matchesTag;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTag]);

  const totalCount = filteredDoubts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalCount);

  const paginatedDoubts = filteredDoubts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openDetailView = (doubt) => {
    setSelectedDoubt(doubt);
    const rawCause = (doubt.aiDraft?.possibleCause || '').replace(/\\n/g, '\n').replace(/\\t/g, '  ');
    const rawSuggested = (doubt.aiDraft?.suggestedFix || '').replace(/\\n/g, '\n').replace(/\\t/g, '  ');
    const formattedCode = prettyFormatCode(doubt.aiDraft?.codeFix || '');

    setEditRootCause(rawCause);
    setEditSuggestedFix(rawSuggested);
    setEditCodeFix(formattedCode);
    setTeacherNotes('');
    setIsEditingRootCause(false);
    setIsEditingSuggested(false);
    setIsEditingCode(false);
    setIsCodeExpanded(false);
  };

  // ============================================================
  // LEVEL 2: DETAIL INSPECTION DASHBOARD
  // ============================================================
  if (selectedDoubt) {
    const d = selectedDoubt;
    const dStatus = getDoubtStatus(d);
    const dId = getDoubtId(d);
    const sName = getStudentName(d);
    const sInitials = getInitials(sName);

    const isTeacher = activeRole === 'teacher';
    const isPending = dStatus === 'PENDING_REVIEW';
    const isEditable = isTeacher && isPending;

    const studentCodeText = d.codeSnippet || `public int fib(int n) {\n    if (n <= 1) return n;\n    return fib(n - 1) + fib(n - 2);\n}`;
    const studentLineCount = Math.max(1, (studentCodeText.match(/\n/g) || []).length + 1);

    const displayCodeFix = isEditable ? editCodeFix : (d.aiDraft?.codeFix || '');
    const aiLineCount = Math.max(1, (displayCodeFix.match(/\n/g) || []).length + 1);

    const handleApproveWithEdits = async () => {
      await handleTeacherApprove(dId, editSuggestedFix);
    };

    const handleRegenerate = async () => {
      setIsRegenerating(true);
      try {
        const data = await doubtsAPI.regenerate(dId, teacherNotes);
        setDoubts(prev => prev.map(x => (x._id === dId || x.id === dId) ? data.doubt : x));
        openDetailView(data.doubt);
      } catch (err) {
        alert(`Regenerate failed: ${err.message}`);
      } finally {
        setIsRegenerating(false);
      }
    };

    return (
      <div className="doubt-board-module" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Detail View Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            className="btn-secondary"
            style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setSelectedDoubt(null)}
          >
            <ArrowLeft size={16} /> Back to Questions
          </button>

          <span className={`status-badge ${dStatus === 'APPROVED' ? 'badge-approved' : dStatus === 'PENDING_REVIEW' ? 'badge-pending' : 'badge-rejected'}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem', fontWeight: 700 }}>
            {dStatus === 'PENDING_REVIEW' ? 'DRAFT: PENDING TEACHER APPROVAL' : dStatus}
          </span>
        </div>

        {/* 2-Column Split Grid */}
        <div className="detail-split-grid">

          {/* LEFT COLUMN: Question & Student Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Card 1: QUESTION */}
            <div className="detail-card">
              <div className="doubt-section-header" style={{ color: '#2563eb', marginBottom: '0.75rem' }}>
                <MessageSquare size={14} /> QUESTION
              </div>

              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                {d.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span className="avatar-badge">{sInitials}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sName}</span>
                <span style={{ color: 'var(--text-subtle)' }}>•</span>
                <span style={{ fontWeight: 600, color: '#1e40af' }}>{d.language}</span>
                <span style={{ color: 'var(--text-subtle)' }}>•</span>
                <span style={{ color: 'var(--text-subtle)' }}>{formatDate(d.createdAt)}</span>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {(d.tags || ['Recursion', 'Dynamic Programming', 'Java']).map((t, i) => (
                  <span key={`t-${i}`} className="doubt-tag-pill">#{t}</span>
                ))}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.65, margin: 0 }}>
                {d.description}
              </p>
            </div>

            {/* Card 2: STUDENT CODE */}
            {d.codeSnippet && (
              <div className="detail-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="doubt-section-header" style={{ color: '#2563eb', margin: 0 }}>
                    <Code2 size={14} /> STUDENT CODE
                  </div>

                  <select className="form-select" style={{ width: 'auto', padding: '0.15rem 0.45rem', fontSize: '0.78rem', fontWeight: 600 }} value={d.language} readOnly>
                    <option>{d.language}</option>
                  </select>
                </div>

                {/* Dark Code Block */}
                <div className="leetcode-editor-container" style={{ borderRadius: '8px', minHeight: '140px' }}>
                  <div className="leetcode-line-numbers">
                    {Array.from({ length: studentLineCount }, (_, i) => i + 1).map(n => (
                      <div key={`sl-${n}`}>{n}</div>
                    ))}
                  </div>
                  <pre className="font-mono" style={{ padding: '0.85rem', margin: 0, fontSize: '0.82rem', color: '#f8fafc', overflowX: 'auto', lineHeight: 1.5 }}>
                    <code>{studentCodeText}</code>
                  </pre>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: AI Analysis & Solution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Student sees PENDING doubt → show waiting panel, not the AI draft */}
            {!isTeacher && isPending ? (
              <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '1.25rem', textAlign: 'center', backgroundColor: '#f8faff', border: '2px dashed #93c5fd' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={28} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e40af', marginBottom: '0.5rem' }}>
                    🔒 Awaiting Teacher Approval
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', lineHeight: 1.65, margin: 0, maxWidth: '320px' }}>
                    Your doubt has been received and the AI has generated a draft solution. 
                    Your instructor is reviewing it before publishing the verified answer.
                  </p>
                </div>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>
                  ⏳ You'll be notified once the instructor approves and publishes the answer.
                </div>
              </div>
            ) : (
              <>
                {/* Card 3: ROOT CAUSE ANALYSIS */}
                <div className="detail-card" style={{ backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isPending ? '#2563eb' : '#16a34a', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Sparkles size={16} /> {isPending ? 'AI ANALYSIS (Teacher Review Mode)' : 'VERIFIED & INSTRUCTOR APPROVED SOLUTION'}
                    </div>

                    {isPending && (
                      <div className="meta-badge-group">
                        <span className="meta-badge meta-badge-confidence">
                          <Sparkles size={11} /> {((d.aiDraft?.confidenceScore || 0.92) * 100).toFixed(0)}% Confidence
                        </span>
                        <span className="meta-badge meta-badge-risk">
                          <ShieldAlert size={11} /> {d.aiDraft?.promptInjectionRisk || 'Low'} Risk
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amber Callout: Root Cause */}
                  <div className="callout-amber" style={{ gap: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangle size={14} /> Root Cause Analysis
                      </div>
                      {isEditable && (
                        <button
                          type="button"
                          style={{
                            padding: '0.15rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            color: '#92400e',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}
                          onClick={() => setIsEditingRootCause(!isEditingRootCause)}
                        >
                          {isEditingRootCause ? '✓ Save' : '✏️ Edit'}
                        </button>
                      )}
                    </div>

                    {isEditingRootCause ? (
                      <textarea
                        className="form-textarea"
                        style={{ width: '100%', minHeight: '80px', fontSize: '0.82rem', lineHeight: 1.6, backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '8px', padding: '0.5rem', resize: 'vertical' }}
                        value={editRootCause}
                        onInput={handleAutoResize}
                        onChange={e => setEditRootCause(e.target.value)}
                      />
                    ) : (
                      renderSuggestedSteps(editRootCause || d.aiDraft?.possibleCause)
                    )}
                  </div>
                </div>

                {/* Card 4: AI SUGGESTED SOLUTION */}
                <div className="detail-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="doubt-section-header" style={{ color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} /> {isPending ? 'AI SUGGESTED SOLUTION' : 'APPROVED SOLUTION CODE'}
                      {isPending && <span style={{ fontSize: '0.65rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>✎ EDITABLE</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select className="form-select" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }} value={d.language} readOnly>
                        <option>{d.language}</option>
                      </select>

                      {isEditable && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: 600 }}
                          onClick={() => setIsEditingCode(!isEditingCode)}
                        >
                          {isEditingCode ? '✓ Done Editing' : '✏️ Edit Code'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() => setIsCodeExpanded(true)}
                        title="Expand Code Window"
                      >
                        <Maximize2 size={13} />
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() => handleCopyCode(displayCodeFix)}
                      >
                        <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    if (isEditingCode) {
                      const editLines = (editCodeFix || '').split('\n');
                      return (
                        <div className="leetcode-editor-container" style={{ borderRadius: '8px' }}>
                          <div className="leetcode-line-numbers">
                            {editLines.map((_, i) => <div key={`ail-${i}`}>{i + 1}</div>)}
                          </div>
                          <textarea
                            className="font-mono leetcode-textarea"
                            style={{ padding: '0.85rem', margin: 0, fontSize: '0.82rem', backgroundColor: 'transparent', color: '#f8fafc', lineHeight: 1.6, border: 'none', outline: 'none', resize: 'none', overflow: 'hidden', width: '100%', whiteSpace: 'pre' }}
                            value={editCodeFix}
                            onInput={handleAutoResize}
                            onChange={e => setEditCodeFix(e.target.value)}
                          />
                        </div>
                      );
                    }

                    const formattedCode = prettyFormatCode(displayCodeFix);
                    const lines = formattedCode.split('\n');
                    return (
                      <div className="leetcode-editor-container" style={{ borderRadius: '8px' }}>
                        <div className="leetcode-line-numbers">
                          {lines.map((_, i) => <div key={`ail-${i}`}>{i + 1}</div>)}
                        </div>
                        <pre className="font-mono" style={{ padding: '0.85rem', margin: 0, fontSize: '0.82rem', color: '#f8fafc', overflow: 'visible', lineHeight: 1.6, whiteSpace: 'pre', flex: 1 }}>
                          <code>{formattedCode}</code>
                        </pre>
                      </div>
                    );
                  })()}
                </div>

                {/* Suggested Approach Card (below Code Box) */}
                <div className="detail-card" style={{ backgroundColor: '#ffffff' }}>
                  <div className="callout-green" style={{ gap: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Lightbulb size={14} /> Suggested Approach & Step-by-Step Fix
                      </div>
                      {isEditable && (
                        <button
                          type="button"
                          style={{
                            padding: '0.15rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            color: '#15803d',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}
                          onClick={() => setIsEditingSuggested(!isEditingSuggested)}
                        >
                          {isEditingSuggested ? '✓ Save' : '✏️ Edit'}
                        </button>
                      )}
                    </div>

                    {isEditingSuggested ? (
                      <textarea
                        className="form-textarea"
                        style={{ width: '100%', minHeight: '80px', fontSize: '0.82rem', lineHeight: 1.6, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d', borderRadius: '8px', padding: '0.5rem', resize: 'vertical' }}
                        value={editSuggestedFix}
                        onInput={handleAutoResize}
                        onChange={e => setEditSuggestedFix(e.target.value)}
                      />
                    ) : (
                      renderSuggestedSteps(editSuggestedFix || d.aiDraft?.suggestedFix)
                    )}
                  </div>
                </div>

                {/* Card 5: Why this works & Complexity Comparison */}
                {(() => {
                  const text = `${d.title} ${d.description} ${(d.tags || []).join(' ')}`.toLowerCase();

                  let whyWorks = d.aiDraft?.whyWorks;
                  let comp = d.aiDraft?.complexity;

                  if (!whyWorks) {
                    if (text.includes('binary') || text.includes('search')) {
                      whyWorks = 'Binary Search repeatedly divides search space in half (mid = low + (high - low) / 2). Using low <= high condition ensures the last element is inspected before returning -1.';
                    } else if (text.includes('dfs') || text.includes('graph') || text.includes('tle')) {
                      whyWorks = 'Introducing a boolean visited[] array or HashSet tracks visited nodes, preventing cyclic infinite loops and eliminating TLE on large graph inputs.';
                    } else if (text.includes('fibonacci') || text.includes('recursion') || text.includes('dp') || text.includes('overflow')) {
                      whyWorks = 'We build the sequence iteratively using two state variables, eliminating redundant recursive function calls and preventing stack overflow.';
                    } else {
                      whyWorks = 'Adding defensive boundary guard checks before array indexing prevents null pointer and out-of-bounds exceptions.';
                    }
                  }

                  if (!comp || !comp.naiveName) {
                    if (text.includes('binary') || text.includes('search')) {
                      comp = { naiveName: 'Linear Search', naiveTime: 'O(N)', naiveSpace: 'O(1)', optName: 'Binary Search', optTime: 'O(log N)', optSpace: 'O(1)' };
                    } else if (text.includes('dfs') || text.includes('graph') || text.includes('tle')) {
                      comp = { naiveName: 'Unvisited DFS', naiveTime: 'O(V!)', naiveSpace: 'O(V)', optName: 'Visited DFS', optTime: 'O(V + E)', optSpace: 'O(V)' };
                    } else if (text.includes('fibonacci') || text.includes('recursion') || text.includes('dp') || text.includes('overflow')) {
                      comp = { naiveName: 'Recursive', naiveTime: 'O(2^N)', naiveSpace: 'O(N)', optName: 'DP (Iterative)', optTime: 'O(N)', optSpace: 'O(1)' };
                    } else {
                      comp = { naiveName: 'Naive Approach', naiveTime: 'O(N^2)', naiveSpace: 'O(N)', optName: 'Optimized', optTime: 'O(N)', optSpace: 'O(1)' };
                    }
                  }

                  return (
                    <div className="detail-card">
                      <div className="grid-2" style={{ gap: '0.75rem' }}>
                        <div className="callout-green" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={15} /> Why this works
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#14532d', fontSize: '0.8rem', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {whyWorks
                              .split(/(?<=[.!?])\s+(?=[A-Z0-9])|\n+/)
                              .map(s => s.trim())
                              .filter(s => s.length > 8)
                              .map((point, i) => (
                                <li key={i}>{point}</li>
                              ))
                            }
                          </ul>
                        </div>

                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <div className="doubt-section-header" style={{ color: '#64748b', marginBottom: '0.4rem' }}>
                            <Layers size={13} /> Complexity Comparison
                          </div>
                          <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-subtle)' }}>
                                <th style={{ padding: '0.2rem' }}>Approach</th>
                                <th style={{ padding: '0.2rem' }}>Time</th>
                                <th style={{ padding: '0.2rem' }}>Space</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '0.3rem 0.2rem', fontWeight: 600 }}>{comp.naiveName}</td>
                                <td style={{ padding: '0.3rem 0.2rem', color: '#dc2626', fontWeight: 700 }} className="font-mono">{comp.naiveTime}</td>
                                <td style={{ padding: '0.3rem 0.2rem', color: '#dc2626', fontWeight: 700 }} className="font-mono">{comp.naiveSpace}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.3rem 0.2rem', fontWeight: 600 }}>{comp.optName}</td>
                                <td style={{ padding: '0.3rem 0.2rem', color: '#16a34a', fontWeight: 700 }} className="font-mono">{comp.optTime}</td>
                                <td style={{ padding: '0.3rem 0.2rem', color: '#16a34a', fontWeight: 700 }} className="font-mono">{comp.optSpace}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Action Bar ONLY for PENDING_REVIEW Doubts when activeRole === 'teacher' */}
                {isEditable ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Teacher Notes for Regenerate */}
                    <div className="detail-card" style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                        <Cpu size={14} /> INSTRUCTOR NOTES FOR AI REGENERATION
                        <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#94a3b8', marginLeft: '0.25rem' }}>Optional — injected into the prompt when you click Regenerate AI</span>
                      </div>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: '60px', fontSize: '0.82rem', resize: 'vertical', borderColor: isRegenerating ? '#cbd5e1' : '#bfdbfe', backgroundColor: '#f0f7ff' }}
                        placeholder="e.g. Focus on time complexity only. Avoid recursion-based fixes. Show the iterative approach with clear comments."
                        value={teacherNotes}
                        onChange={e => setTeacherNotes(e.target.value)}
                        disabled={isRegenerating}
                      />
                    </div>

                    {/* Buttons Row */}
                    <div className="detail-card" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', padding: '0.85rem 1rem' }}>
                      <button
                        className="btn-primary"
                        style={{ flex: '2 1 auto', justifyContent: 'center', backgroundColor: '#2563eb' }}
                        onClick={handleApproveWithEdits}
                      >
                        <CheckCircle size={16} /> Approve &amp; Publish
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ flex: '1 1 auto', justifyContent: 'center' }}
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                      >
                        <Cpu size={16} /> {isRegenerating ? 'Regenerating...' : 'Regenerate AI'}
                      </button>

                      <button
                        className="btn-danger"
                        style={{ flex: '1 1 auto', justifyContent: 'center' }}
                        onClick={() => handleTeacherReject(dId)}
                      >
                        <XCircle size={16} /> Reject Draft
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert-box alert-success" style={{ margin: 0, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} color="#16a34a" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#15803d' }}>
                      This solution has been reviewed and approved by the course instructor.
                    </span>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Expanded Code Popup Window Modal */}
        {isCodeExpanded && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.5rem'
            }}
            onClick={() => setIsCodeExpanded(false)}
          >
            <div
              className="card-panel"
              style={{
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                backgroundColor: '#ffffff'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.05rem', color: '#1e40af' }}>
                    <Code2 size={20} color="#2563eb" /> Expanded Code View ({d?.language || 'Java'})
                  </h3>
                  {isPending && <span style={{ fontSize: '0.65rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>✎ EDITABLE</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isEditable && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setIsEditingCode(!isEditingCode)}
                    >
                      {isEditingCode ? '✓ Done Editing' : '✏️ Edit Code'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                    onClick={() => handleCopyCode(editCodeFix || d?.aiDraft?.codeFix)}
                  >
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem', fontWeight: 700, backgroundColor: '#f1f5f9' }}
                    onClick={() => setIsCodeExpanded(false)}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className="leetcode-editor-container" style={{ flex: 1, maxHeight: 'calc(90vh - 120px)', overflow: 'auto', borderRadius: '8px' }}>
                {(() => {
                  if (isEditingCode) {
                    const editLines = (editCodeFix || '').split('\n');
                    return (
                      <>
                        <div className="leetcode-line-numbers">
                          {editLines.map((_, i) => <div key={`exp-edit-${i}`}>{i + 1}</div>)}
                        </div>
                        <textarea
                          className="font-mono leetcode-textarea"
                          style={{ padding: '1rem', margin: 0, fontSize: '0.88rem', backgroundColor: 'transparent', color: '#f8fafc', lineHeight: 1.6, border: 'none', outline: 'none', resize: 'none', overflow: 'hidden', width: '100%', whiteSpace: 'pre' }}
                          value={editCodeFix}
                          onInput={handleAutoResize}
                          onChange={e => setEditCodeFix(e.target.value)}
                        />
                      </>
                    );
                  }

                  const codeToDisplay = editCodeFix || d?.aiDraft?.codeFix || '';
                  const formattedCode = prettyFormatCode(codeToDisplay);
                  const lines = formattedCode.split('\n');
                  return (
                    <>
                      <div className="leetcode-line-numbers">
                        {lines.map((_, i) => <div key={`exp-${i}`}>{i + 1}</div>)}
                      </div>
                      <pre className="font-mono" style={{ padding: '1rem', margin: 0, fontSize: '0.88rem', color: '#f8fafc', overflow: 'visible', lineHeight: 1.6, whiteSpace: 'pre', flex: 1 }}>
                        <code>{formattedCode}</code>
                      </pre>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // LEVEL 1: MASTER QUESTIONS ROSTER (List View)
  // ============================================================
  // ============================================================
  // LEVEL 1: MASTER QUESTIONS ROSTER (List View)
  // ============================================================
  return (
    <div className="doubt-board-module">
      {/* Top Banner & Stepper Action Header */}
      <div className="card-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Soft Blue Square Message Icon Box */}
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                AI Doubt Resolution Board &amp; Human Approval Portal
              </h2>
              {/* Horizontal Pipeline Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>State Machine:</span>
                
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700 }}>1</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Student Submission</span>
                
                <span style={{ color: '#cbd5e1' }}>&rarr;</span>

                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #2563eb', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700 }}>2</span>
                <span>6-Layer Security &amp; Mem0 Processing</span>
                
                <span style={{ color: '#cbd5e1' }}>&rarr;</span>

                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #2563eb', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700 }}>3</span>
                <span>Draft Pending</span>

                <span style={{ color: '#cbd5e1' }}>&rarr;</span>

                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #94a3b8', color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>4</span>
                <span>Teacher Review</span>

                <span style={{ color: '#cbd5e1' }}>&rarr;</span>

                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #94a3b8', color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>5</span>
                <span>Approved &amp; Published</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {activeRole === 'student' && (
              <button
                className="btn-primary"
                style={{ backgroundColor: '#2563eb', padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowNewModal(true)}
              >
                <Plus size={16} /> Post Doubt to AI Engine
              </button>
            )}

            {activeRole === 'teacher' && (
              <div className="alert-box alert-warning" style={{ margin: 0, padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                <Cpu size={16} /> <strong>{pendingDoubts.length} Pending AI Drafts</strong> require instructor review
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-panel" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', borderRadius: '8px' }}
              placeholder="Search doubts by keyword or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-subtle)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Topic Tag:</span>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.82rem', padding: '0.3rem 0.75rem', borderRadius: '8px' }}
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="ALL">All Topics</option>
              <option value="Graphs">Graphs &amp; Traversal</option>
              <option value="Recursion">Recursion &amp; DP</option>
              <option value="Arrays">Arrays &amp; Pointers</option>
              <option value="DFS">DFS / BFS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Questions Roster List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {paginatedDoubts.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
            <MessageSquare size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No doubts match your search query or role visibility filter.</p>
          </div>
        ) : (
          paginatedDoubts.map((doubt) => {
            const dStatus = getDoubtStatus(doubt);
            const dId = getDoubtId(doubt);
            const sName = getStudentName(doubt);
            const sInitials = getInitials(sName);

            return (() => {
              const isStudentPending = activeRole === 'student' && dStatus === 'PENDING_REVIEW';

              return (
                <div
                  key={dId}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: dStatus === 'APPROVED' ? '4px solid #16a34a' : '4px solid #2563eb',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => openDetailView(doubt)}
                >
                  {/* Left Icon Circle */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: dStatus === 'APPROVED' ? '#dcfce7' : '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {dStatus === 'APPROVED' ? (
                      (doubt.tags || []).some(t => /graph|dfs/i.test(t)) || /DFS|Graph/i.test(doubt.title) ? (
                        <GitFork size={22} color="#16a34a" />
                      ) : (
                        <CheckCircle2 size={22} color="#16a34a" />
                      )
                    ) : (
                      <Lock size={20} color="#2563eb" />
                    )}
                  </div>

                  {/* Center Info Section */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                      {doubt.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
                      {/* Student Initials Avatar */}
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sInitials}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{sName}</span>
                      <span>•</span>
                      <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.74rem', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>{doubt.language}</span>
                      <span>•</span>
                      <span>{formatDate(doubt.createdAt)}</span>

                      {(doubt.tags || []).map((t, i) => (
                        <span key={`rt-${i}`} style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.74rem', fontWeight: 600, padding: '0.1rem 0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Pending Sub-Notice */}
                    {isStudentPending && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>⏳</span> AI draft generated — awaiting instructor review &amp; approval before answer is published.
                      </div>
                    )}
                  </div>

                  {/* Right Status & Action Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {dStatus === 'APPROVED' ? (
                      <>
                        <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          ✓ APPROVED
                        </span>
                        <button
                          style={{ backgroundColor: '#e6f4ea', color: '#15803d', border: '1px solid #86efac', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailView(doubt);
                          }}
                        >
                          Inspect Question &amp; AI Solution &rarr;
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          ⏳ DRAFT: PENDING TEACHER APPROVAL
                        </span>
                        <button
                          style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailView(doubt);
                          }}
                        >
                          👨‍🏫 Track Status
                        </button>
                      </>
                    )}

                    <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              );
            })();
          })
        )}
      </div>

      {/* Dynamic Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
          Showing {startIndex} to {endIndex} of {totalCount} doubts
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: safePage === 1 ? '#cbd5e1' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: safePage === 1 ? 'not-allowed' : 'pointer'
            }}
            disabled={safePage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} style={{ color: '#94a3b8', fontSize: '0.82rem', padding: '0 0.2rem' }}>...</span>
            ) : (
              <button
                key={`page-${p}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: p === safePage ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: p === safePage ? '#2563eb' : '#ffffff',
                  color: p === safePage ? '#ffffff' : '#475569',
                  fontWeight: p === safePage ? 700 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          ))}

          <button
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: safePage === totalPages ? '#cbd5e1' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: safePage === totalPages ? 'not-allowed' : 'pointer'
            }}
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '8px' }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* New Doubt Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header-flex">
              <h3 className="card-title">Ask Question / Post Doubt to AI Engine</h3>
              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowNewModal(false)}>✕</button>
            </div>

            <form onSubmit={handlePostDoubt}>
              <div className="form-group">
                <label className="form-label">Doubt Title / Question:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Why does my recursive DFS give TLE on large graphs?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description:</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain the problem, expected output, and what you have tried so far..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Language:</label>
                  <select className="form-select" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                    <option value="Java">Java</option>
                    <option value="Python">Python</option>
                    <option value="C++">C++</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic Tags <span style={{ fontWeight: 400, color: 'var(--text-subtle)' }}>(optional, comma separated)</span>:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Graphs, DFS, Recursion"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Code Snippet (Optional):</label>
                <textarea
                  className="form-textarea font-mono"
                  style={{ minHeight: '120px', fontSize: '0.8rem' }}
                  placeholder="Paste your source code snippet here..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  <Sparkles size={16} /> {isSubmitting ? 'Submitting...' : 'Submit to 6-Layer AI Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Expanded / Fullscreen Modal */}
      {isCodeExpanded && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1.5rem' }}>
          <div className="card-panel" style={{ maxWidth: '920px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem' }}>
                <Code2 size={18} color="#2563eb" /> Full Code View ({selectedDoubt?.language || 'Java'})
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={() => handleCopyCode(editCodeFix || selectedDoubt?.aiDraft?.codeFix)}>
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={() => setIsCodeExpanded(false)}>✕ Close</button>
              </div>
            </div>
            <div className="leetcode-editor-container" style={{ flex: 1, overflowY: 'auto', borderRadius: '8px' }}>
              {(() => {
                const formattedCode = prettyFormatCode(editCodeFix || selectedDoubt?.aiDraft?.codeFix);
                const lines = formattedCode.split('\n');
                return (
                  <>
                    <div className="leetcode-line-numbers">
                      {lines.map((_, i) => <div key={`exp-${i}`}>{i + 1}</div>)}
                    </div>
                    <pre className="font-mono" style={{ padding: '1rem', margin: 0, fontSize: '0.86rem', color: '#f8fafc', overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre' }}>
                      <code>{formattedCode}</code>
                    </pre>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
