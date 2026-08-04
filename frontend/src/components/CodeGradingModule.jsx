import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, Cpu, History, Award, Code2, ShieldAlert, Sparkles, BookOpen, FileText, Lightbulb, Check, UserCheck, Search, Filter, Edit3, Save, X, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { submissionsAPI } from '../services/api';

export default function CodeGradingModule({ problems, activeRole }) {
  const isTeacher = activeRole === 'teacher';
  
  // Teacher mode views: 'roster' | 'studentPreview'
  const [teacherView, setTeacherView] = useState(isTeacher ? 'roster' : 'studentPreview');

  const [mode, setMode] = useState('assessment'); // 'assessment' | 'practice'
  const [selectedProblemId, setSelectedProblemId] = useState(problems?.[0]?._id || problems?.[0]?.id || '');
  const [language, setLanguage] = useState('python');
  const [userCode, setUserCode] = useState(problems?.[0]?.starterCode?.python || '');
  const [practiceCode, setPracticeCode] = useState(`def solve(arr):\n    # Type or paste any practice code here...\n    arr.sort()\n    return arr`);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Left Panel Tab: 'description' | 'aiReview' | 'submissions'
  const [leftTab, setLeftTab] = useState('description');
  
  // Right Bottom Panel Tab: 'testcase' | 'result'
  const [rightBottomTab, setRightBottomTab] = useState('testcase');
  const [showConsole, setShowConsole] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Teacher Inspection Modal State
  const [inspectingSubmission, setInspectingSubmission] = useState(null);
  const [overrideScore, setOverrideScore] = useState(8.5);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Filters for Teacher Roster
  const [rosterFilterProblem, setRosterFilterProblem] = useState('ALL');
  const [rosterSearchStudent, setRosterSearchStudent] = useState('');

  // Load submissions
  const loadSubmissions = () => {
    setSubmissionsLoading(true);
    const query = isTeacher ? '' : `?problemId=${selectedProblemId}&mode=assessment`;
    submissionsAPI.getAll(query)
      .then(data => setSubmissions(data.submissions || []))
      .catch(err => console.error('[CodeGrading] Submissions fetch:', err.message))
      .finally(() => setSubmissionsLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, [selectedProblemId, isTeacher]);

  // Sync state when problems list arrives
  useEffect(() => {
    if (problems && problems.length > 0 && !selectedProblemId) {
      const first = problems[0];
      const pId = first._id || first.id;
      setSelectedProblemId(pId);
      if (mode === 'assessment') {
        setUserCode(first.starterCode?.[language] || first.starterCode?.python || '');
      }
    }
  }, [problems]);

  const currentProblem = problems?.find(p => (p._id || p.id) === selectedProblemId) || problems?.[0];

  const handleProblemChange = (probId) => {
    setSelectedProblemId(probId);
    const prob = problems?.find(p => (p._id || p.id) === probId);
    if (prob) {
      setUserCode(prob.starterCode?.[language] || prob.starterCode?.python || '');
      setCurrentExecution(null);
      setRightBottomTab('testcase');
    }
  };

  const PRACTICE_STARTER_CODE = {
    python: `def solve(arr):\n    # Type or paste any Python practice code here...\n    arr.sort()\n    return arr`,
    java: `public class Solution {\n    public static void main(String[] args) {\n        // Type or paste any Java practice code here...\n        System.out.println("Hello Enterprise LMS!");\n    }\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Type or paste any C++ practice code here...\n    cout << "Hello Enterprise LMS!" << endl;\n    return 0;\n}`
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (mode === 'assessment' && currentProblem) {
      setUserCode(currentProblem.starterCode?.[newLang] || currentProblem.starterCode?.python || '');
    } else {
      setPracticeCode(PRACTICE_STARTER_CODE[newLang] || PRACTICE_STARTER_CODE.python);
    }
  };

  const handleRunCode = async (isSubmission = false) => {
    setApiError('');
    setIsExecuting(true);
    setShowConsole(true);
    setRightBottomTab('result');
    try {
      const probId = currentProblem?._id || currentProblem?.id;
      const payload = mode === 'practice'
        ? { mode: 'practice', sourceCode: practiceCode, language }
        : { mode: 'assessment', problemId: probId, sourceCode: userCode, language };

      const data = await submissionsAPI.submit(payload);
      const sub = data.submission;

      setCurrentExecution({
        mode: sub.mode || mode,
        status: sub.sandboxStatus,
        score: sub.score,
        passRate: sub.passRate,
        executionTime: sub.executionTime,
        memoryUsed: sub.memoryUsed,
        testCaseResults: sub.testCaseResults || [],
        errorMessage: sub.errorMessage,
        aiReview: sub.aiReview || {}
      });

      if (isSubmission && mode === 'assessment') {
        setSubmissions(prev => [sub, ...prev]);
      }
      setLeftTab('aiReview');
      setRightBottomTab('result');
    } catch (err) {
      setApiError(err.message || 'Submission failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInspect = (sub) => {
    setInspectingSubmission(sub);
    setOverrideScore(sub.score !== null ? sub.score : 8.0);
    setTeacherNotes(sub.aiReview?.teacherNotes || '');
  };

  const handleSaveGradeOverride = async () => {
    if (!inspectingSubmission) return;
    setIsSavingGrade(true);
    try {
      const sId = inspectingSubmission._id || inspectingSubmission.id;
      const data = await submissionsAPI.updateGrade(sId, {
        score: overrideScore,
        teacherNotes
      });
      
      // Update local roster list
      setSubmissions(prev => prev.map(s => (s._id === sId || s.id === sId) ? data.submission : s));
      setInspectingSubmission(null);
    } catch (err) {
      alert(`Failed to save grade override: ${err.message}`);
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleTestInfiniteLoop = () => {
    const tleCode = language === 'python'
      ? `import time\n\ndef solve():\n    # Test TLE / Infinite loop\n    while True:\n        time.sleep(1)\n`
      : language === 'java'
      ? `public class Solution {\n    public static void main(String[] args) {\n        while (true) {\n            try { Thread.sleep(1000); } catch (Exception e) {}\n        }\n    }\n}`
      : `#include <iostream>\n#include <thread>\n#include <chrono>\nusing namespace std;\n\nint main() {\n    while(true) {\n        this_thread::sleep_for(chrono::seconds(1));\n    }\n    return 0;\n}`;

    if (mode === 'assessment') {
      setUserCode(tleCode);
    } else {
      setPracticeCode(tleCode);
    }
  };

  const handleTestSecurityViolation = () => {
    const sysCode = language === 'python'
      ? `import os\n\ndef solve():\n    # Security Violation Test\n    os.system("rm -rf /")\n    return "blocked"\n`
      : language === 'java'
      ? `public class Solution {\n    public static void main(String[] args) {\n        try {\n            Runtime.getRuntime().exec("rm -rf /");\n        } catch (Exception e) {}\n    }\n}`
      : `#include <cstdlib>\nusing namespace std;\n\nint main() {\n    system("rm -rf /");\n    return 0;\n}`;

    if (mode === 'assessment') {
      setUserCode(sysCode);
    } else {
      setPracticeCode(sysCode);
    }
  };


  if (!problems || problems.length === 0 || !currentProblem) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
        <Cpu size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading curriculum database...</p>
      </div>
    );
  }

  // Filtered roster submissions for Teacher
  const filteredRoster = submissions.filter(sub => {
    const pMatch = rosterFilterProblem === 'ALL' || (sub.problem?._id === rosterFilterProblem || sub.problem?.id === rosterFilterProblem);
    const sName = typeof sub.student === 'object' ? sub.student?.name : (sub.studentName || '');
    const sMatch = !rosterSearchStudent || sName.toLowerCase().includes(rosterSearchStudent.toLowerCase());
    return pMatch && sMatch;
  });

  const codeText = mode === 'assessment' ? userCode : practiceCode;
  const lineCount = Math.max(1, (codeText.match(/\n/g) || []).length + 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // ============================================================
  // TEACHER COMMAND CENTER VIEW (Professor Role View)
  // ============================================================
  if (isTeacher && teacherView === 'roster') {
    return (
      <div className="leetcode-workspace">
        {/* Teacher Header Bar */}
        <div className="leetcode-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="status-badge badge-approved" style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0.3rem 0.6rem' }}>
              <UserCheck size={15} /> PROFESSOR COMMAND CENTER
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
              Class Submissions & Grade Management Hub
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="leetcode-tab-btn active"
              onClick={() => setTeacherView('roster')}
            >
              <FileText size={14} /> Class Submissions Roster ({submissions.length})
            </button>
            <button
              className="leetcode-tab-btn"
              onClick={() => setTeacherView('studentPreview')}
            >
              <Code2 size={14} /> Student IDE Preview
            </button>
          </div>
        </div>

        {/* Teacher Roster Dashboard */}
        <div className="card-panel">
          {/* Roster Metrics Banner */}
          <div className="grid-3" style={{ marginBottom: '1.25rem', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1.1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL SUBMISSIONS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.1rem' }}>
                {submissions.length}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>PASSED EVALUATIONS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.1rem' }}>
                {submissions.filter(s => s.sandboxStatus === 'ALL_PASSED').length}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <span style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>SECURITY VIOLATIONS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.1rem' }}>
                {submissions.filter(s => s.sandboxStatus === 'SECURITY_VIOLATION').length}
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search student name..."
                  style={{ paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                  value={rosterSearchStudent}
                  onChange={(e) => setRosterSearchStudent(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                value={rosterFilterProblem}
                onChange={(e) => setRosterFilterProblem(e.target.value)}
              >
                <option value="ALL">All Problems ({problems.length})</option>
                {problems.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={loadSubmissions}>
              Refresh Roster
            </button>
          </div>

          {/* Submissions Table */}
          {submissionsLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>Loading submissions roster...</p>
          ) : filteredRoster.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No submissions found for selected filter.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Problem</th>
                    <th>Mode / Lang</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Runtime</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((sub, idx) => {
                    const sName = typeof sub.student === 'object' ? sub.student?.name : (sub.studentName || 'Alex Chen');
                    const pTitle = typeof sub.problem === 'object' ? sub.problem?.title : 'Algorithm Problem';
                    const dateStr = sub.createdAt
                      ? new Date(sub.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Just now';

                    return (
                      <tr key={`r-sub-${sub._id || sub.id || idx}`}>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sName}</td>
                        <td style={{ fontWeight: 600 }}>{pTitle}</td>
                        <td style={{ fontSize: '0.78rem' }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-subtle)' }}>{sub.mode}</span> • {sub.language}
                        </td>
                        <td>
                          <span className={`status-badge ${sub.sandboxStatus === 'ALL_PASSED' ? 'badge-approved' : 'badge-rejected'}`}>
                            {sub.sandboxStatus}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: sub.score >= 8.0 ? '#15803d' : '#b45309' }}>
                          {sub.score !== null ? `${sub.score} / 10` : 'Ungraded'}
                          {sub.aiReview?.teacherNotes && (
                            <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', color: '#2563eb' }} title="Teacher notes added">✏️</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>{sub.executionTime}</td>
                        <td style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>{dateStr}</td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleInspect(sub)}
                          >
                            <Edit3 size={13} /> Inspect & Grade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Teacher Grade Inspection Drawer Modal */}
        {inspectingSubmission && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Inspecting Submission: {typeof inspectingSubmission.student === 'object' ? inspectingSubmission.student?.name : 'Student'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    Problem: {typeof inspectingSubmission.problem === 'object' ? inspectingSubmission.problem?.title : 'Problem'} • Mode: {inspectingSubmission.mode}
                  </span>
                </div>
                <button onClick={() => setInspectingSubmission(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content Scroll */}
              <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                
                {/* Code Preview */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Submitted Code ({inspectingSubmission.language}):</strong>
                  <pre className="font-mono" style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '0.85rem', borderRadius: '6px', fontSize: '0.82rem', overflowX: 'auto', maxHeight: '200px' }}>
                    {inspectingSubmission.sourceCode}
                  </pre>
                </div>

                {/* AI Review Details */}
                {inspectingSubmission.aiReview && (
                  <div style={{ marginBottom: '1.25rem', padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1d4ed8' }}>
                      AI Qualitative Review & Complexity
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      <div><strong>Complexity:</strong> Time: {inspectingSubmission.aiReview.complexity?.time} | Space: {inspectingSubmission.aiReview.complexity?.space}</div>
                      
                      {inspectingSubmission.aiReview.weaknesses?.length > 0 && (
                        <div style={{ marginTop: '0.4rem', color: '#dc2626' }}>
                          <strong>Weaknesses / Security Alerts:</strong> {inspectingSubmission.aiReview.weaknesses.join('; ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher Grade Override Input Form */}
                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.75rem' }}>
                    Teacher Grade Override & Feedback
                  </h4>

                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Grade Score (0.0 - 10.0):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        className="form-input"
                        style={{ fontSize: '0.9rem', fontWeight: 700 }}
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Teacher Feedback Notes:</label>
                      <textarea
                        className="form-textarea"
                        style={{ height: '60px', fontSize: '0.8rem' }}
                        placeholder="Add custom notes for student..."
                        value={teacherNotes}
                        onChange={(e) => setTeacherNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="leetcode-btn-submit"
                    onClick={handleSaveGradeOverride}
                    disabled={isSavingGrade}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Save size={15} /> {isSavingGrade ? 'Saving Override...' : 'Save Grade Override & Publish'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // STUDENT IDE SOLVER VIEW (Or Teacher Preview View)
  // ============================================================
  return (
    <div className="leetcode-workspace">
      {/* LeetCode IDE Top Toolbar */}
      <div className="leetcode-toolbar">
        {/* Problem List Dropdown & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isTeacher && (
            <button
              className="leetcode-tab-btn"
              style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}
              onClick={() => setTeacherView('roster')}
            >
              ← Back to Professor Roster
            </button>
          )}

          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={15} color="#2563eb" /> Problem:
          </span>

          <select
            className="form-select"
            style={{ width: 'auto', fontWeight: 700, fontSize: '0.88rem', padding: '0.3rem 0.6rem' }}
            value={selectedProblemId}
            onChange={(e) => handleProblemChange(e.target.value)}
          >
            {problems.map(p => {
              const pId = p._id || p.id;
              return (
                <option key={pId} value={pId}>
                  {p.title} ({p.difficulty})
                </option>
              );
            })}
          </select>

          <span className={currentProblem.difficulty === 'Easy' ? 'leetcode-pill-easy' : 'leetcode-pill-medium'}>
            {currentProblem.difficulty}
          </span>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Check size={14} /> Solved
          </span>
        </div>

        {/* Execution Mode Selector */}
        <div className="leetcode-tab-group" style={{ backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
          <button
            className={`leetcode-tab-btn ${mode === 'assessment' ? 'active' : ''}`}
            onClick={() => { setMode('assessment'); setCurrentExecution(null); }}
          >
            <Award size={14} /> Assessment Mode
          </button>

          <button
            className={`leetcode-tab-btn ${mode === 'practice' ? 'active' : ''}`}
            onClick={() => { setMode('practice'); setCurrentExecution(null); }}
          >
            <BookOpen size={14} /> Practice Sandbox
          </button>
        </div>

        {/* Security Injection Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={handleTestInfiniteLoop}
            title="Inject while True loop"
          >
            <AlertTriangle size={12} color="#d97706" /> Inject TLE
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={handleTestSecurityViolation}
            title="Inject os.system call"
          >
            <ShieldAlert size={12} color="#dc2626" /> Inject Syscall
          </button>
        </div>
      </div>

      {/* LeetCode Main Split Grid (Left Panel & Right Panel) */}
      <div className="leetcode-split-grid">

        {/* LEFT PANEL: Description, AI Qualitative Review, Submissions */}
        <div className="leetcode-panel">
          <div className="leetcode-panel-header">
            <div className="leetcode-tab-group">
              <button
                className={`leetcode-tab-btn ${leftTab === 'description' ? 'active' : ''}`}
                onClick={() => setLeftTab('description')}
              >
                <FileText size={14} /> Description
              </button>

              <button
                className={`leetcode-tab-btn ${leftTab === 'aiReview' ? 'active' : ''}`}
                onClick={() => setLeftTab('aiReview')}
              >
                <Award size={14} color="#2563eb" /> AI Qualitative Review
              </button>

              {mode === 'assessment' && (
                <button
                  className={`leetcode-tab-btn ${leftTab === 'submissions' ? 'active' : ''}`}
                  onClick={() => setLeftTab('submissions')}
                >
                  <History size={14} /> Submissions ({submissions.length})
                </button>
              )}
            </div>
          </div>

          {/* Left Panel Body */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            {leftTab === 'description' ? (
              <div>
                {/* Title & Badges */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  {mode === 'assessment' ? currentProblem.title : 'Free Code Practice Sandbox'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {mode === 'assessment' ? (
                    <>
                      <span className={currentProblem.difficulty === 'Easy' ? 'leetcode-pill-easy' : 'leetcode-pill-medium'}>
                        {currentProblem.difficulty}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', backgroundColor: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        {currentProblem.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={13} /> Solved
                      </span>
                    </>
                  ) : (
                    <span className="status-badge badge-approved" style={{ fontSize: '0.78rem' }}>
                      <Sparkles size={13} /> Custom Code Sandbox • Safety Guardrails Active
                    </span>
                  )}
                </div>

                {/* Problem Text */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {mode === 'assessment'
                    ? currentProblem.description
                    : 'Paste or write any custom algorithm in Python 3, Java 17, or C++ 20 to receive instant AI qualitative review, Big-O complexity analysis, and optimization suggestions without affecting your grade score.'}
                </p>

                {/* LeetCode Style Examples */}
                {mode === 'assessment' && currentProblem.testCases && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    {currentProblem.testCases.slice(0, 2).map((tc, idx) => (
                      <div key={`example-${idx}`} className="leetcode-example-card">
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                          Example {idx + 1}:
                        </div>
                        <div style={{ marginBottom: '0.2rem' }}>
                          <strong>Input:</strong> <code>{tc.input}</code>
                        </div>
                        <div style={{ marginBottom: '0.2rem' }}>
                          <strong>Output:</strong> <code>{tc.expectedOutput}</code>
                        </div>
                        <div>
                          <strong>Explanation:</strong> Syntactically evaluate inputs matching base case conditions.
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints Section */}
                {mode === 'assessment' && currentProblem.constraints && (
                  <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <strong style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Constraints:</strong>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                      {currentProblem.constraints.map((c, i) => (
                        <li key={`constraint-${i}`}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : leftTab === 'aiReview' ? (
              /* AI Qualitative Review Tab (In Left Main Panel) */
              isExecuting ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                  <Sparkles size={36} color="#2563eb" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Analyzing Code & Security Guardrails...
                  </h4>
                  <p style={{ fontSize: '0.82rem' }}>
                    Executing 6-layer security pipeline, Big-O complexity estimation, and Gemini AI qualitative review.
                  </p>
                </div>
              ) : apiError ? (
                <div className="alert-box alert-danger" style={{ marginBottom: '1rem' }}>
                  <AlertTriangle size={20} color="#dc2626" />
                  <div>
                    <strong>Execution Error</strong>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.84rem' }}>{apiError}</p>
                  </div>
                </div>
              ) : !currentExecution ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                  <Award size={36} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    No AI Qualitative Review Generated Yet
                  </h4>
                  <p style={{ fontSize: '0.82rem' }}>
                    Click "Run" or "Submit" to execute code and generate Big-O complexity & qualitative feedback.
                  </p>
                </div>
              ) : currentExecution.status === 'SECURITY_VIOLATION' ? (
                <div style={{ padding: '1.25rem', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid #fecaca', paddingBottom: '0.5rem' }}>
                    <ShieldAlert size={24} color="#dc2626" /> Request Blocked for Security
                  </div>
                  
                  <p style={{ fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.5, marginBottom: '1rem', fontWeight: 500 }}>
                    We couldn't process your submission because it contains instructions that appear to modify or bypass the evaluation process.
                  </p>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.84rem', color: '#991b1b', display: 'block', marginBottom: '0.4rem' }}>
                      Why was it blocked?
                    </strong>
                    <p style={{ fontSize: '0.82rem', color: '#7f1d1d', marginBottom: '0.4rem' }}>
                      Our security system detected content that may attempt to:
                    </p>
                    <ul style={{ fontSize: '0.82rem', color: '#7f1d1d', paddingLeft: '1.2rem', lineHeight: 1.6, margin: 0 }}>
                      <li>Override system instructions</li>
                      <li>Manipulate the evaluator or grading logic</li>
                      <li>Execute restricted operations</li>
                      <li>Perform prompt injection attacks</li>
                    </ul>
                  </div>

                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '0.8rem', color: '#991b1b', fontWeight: 600, textAlign: 'center' }}>
                    🔒 To ensure fair and secure evaluation, your submission was not executed.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={20} color="#2563eb" /> AI Qualitative Code Review
                    </h3>

                    {mode === 'assessment' && currentExecution.score !== null ? (
                      <span className="status-badge badge-approved" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        Score: {currentExecution.score} / 10
                      </span>
                    ) : (
                      <span className="status-badge badge-approved" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        Ungraded Practice Review
                      </span>
                    )}
                  </div>

                  {/* Big-O Complexity Cards */}
                  <div className="grid-2" style={{ marginBottom: '1.25rem', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1.5px solid #3b82f6' }}>
                      <span style={{ fontSize: '0.72rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 700 }}>ESTIMATED TIME COMPLEXITY</span>
                      <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.1rem' }}>
                        {currentExecution.aiReview?.complexity?.time || 'O(N)'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1.5px solid #3b82f6' }}>
                      <span style={{ fontSize: '0.72rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 700 }}>ESTIMATED SPACE COMPLEXITY</span>
                      <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.1rem' }}>
                        {currentExecution.aiReview?.complexity?.space || 'O(1)'}
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {currentExecution.aiReview?.strengths?.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.85rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1.5px solid #22c55e' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                        <CheckCircle2 size={16} /> Strengths:
                      </strong>
                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                        {currentExecution.aiReview.strengths.map((s, i) => <li key={`str-${i}`}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses & Security Alerts */}
                  {currentExecution.aiReview?.weaknesses?.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.85rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1.5px solid #ef4444' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                        <XCircle size={16} /> Weaknesses & Security Alerts:
                      </strong>
                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                        {currentExecution.aiReview.weaknesses.map((w, i) => <li key={`weak-${i}`}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {currentExecution.aiReview?.suggestions?.length > 0 && (
                    <div style={{ padding: '0.85rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1.5px solid #f59e0b' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                        <AlertTriangle size={16} /> Actionable AI Suggestions:
                      </strong>
                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                        {currentExecution.aiReview.suggestions.map((s, i) => <li key={`sug-${i}`}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Submissions History Tab */
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                  Submissions History for "{currentProblem.title}"
                </h3>
                {submissions.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>No past assessment submissions recorded for this problem yet.</p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Score</th>
                          <th>Time</th>
                          <th>Memory</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub, idx) => {
                          const dateStr = sub.createdAt
                            ? new Date(sub.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Just now';
                          return (
                            <tr key={`subhist-${sub._id || sub.id || idx}`}>
                              <td>
                                <span className={`status-badge ${sub.sandboxStatus === 'ALL_PASSED' ? 'badge-approved' : 'badge-rejected'}`}>
                                  {sub.sandboxStatus}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: sub.score >= 8.0 ? '#15803d' : '#b45309' }}>
                                {sub.score !== null ? `${sub.score} / 10` : 'Ungraded'}
                              </td>
                              <td style={{ fontSize: '0.78rem' }}>{sub.executionTime}</td>
                              <td style={{ fontSize: '0.78rem' }}>{sub.memoryUsed}</td>
                              <td style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>{dateStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Code Editor & Resizable/Collapsible LeetCode Console */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>

          {/* Upper Code Editor Panel */}
          <div className="leetcode-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: showConsole ? '320px' : '580px' }}>
            <div className="leetcode-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
                <Code2 size={16} />
                <span>Code</span>
              </div>

              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Language:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java 17</option>
                  <option value="cpp">C++ 20</option>
                </select>
              </div>
            </div>

            {/* Dark Code Editor - Fills vertical height */}
            <div className="leetcode-editor-container" style={{ flex: 1, maxHeight: 'none', height: '100%', minHeight: showConsole ? '240px' : '520px' }}>
              <div className="leetcode-line-numbers">
                {lineNumbers.map(n => (
                  <div key={`line-${n}`}>{n}</div>
                ))}
              </div>
              <textarea
                className="leetcode-textarea"
                style={{ flex: 1, height: '100%', minHeight: '100%' }}
                value={codeText}
                onChange={(e) => mode === 'assessment' ? setUserCode(e.target.value) : setPracticeCode(e.target.value)}
                placeholder="Write your solution code here..."
              />
            </div>

            {/* Code Editor Footer Bar with LeetCode Console Push Slider Button */}
            <div className="leetcode-panel-header" style={{ backgroundColor: '#ffffff', borderTop: '1px solid var(--border-light)', borderBottom: 'none', padding: '0.5rem 0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, borderRadius: '6px' }}
                  onClick={() => setShowConsole(!showConsole)}
                  title={showConsole ? "Collapse Testcase Panel" : "Expand Testcase Panel"}
                >
                  <Terminal size={13} />
                  <span>Console</span>
                  {showConsole ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                  Ln {lineCount}, Col 1 • Saved
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {mode === 'assessment' ? (
                  <>
                    <button
                      className="leetcode-btn-run"
                      onClick={() => handleRunCode(false)}
                      disabled={isExecuting}
                    >
                      <Play size={14} /> Run
                    </button>

                    <button
                      className="leetcode-btn-submit"
                      onClick={() => handleRunCode(true)}
                      disabled={isExecuting}
                    >
                      <Award size={14} /> {isExecuting ? 'Submitting...' : 'Submit'}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleRunCode(false)}
                    disabled={isExecuting}
                    style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    <Sparkles size={14} /> {isExecuting ? 'Analyzing...' : 'Analyze & Review Code'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lower Console / Test Results Panel (Only visible when open or code executed) */}
          {showConsole && (
            <div className="leetcode-panel" style={{ height: '260px', transition: 'all 0.25s ease' }}>
              <div className="leetcode-panel-header">
                <div className="leetcode-tab-group">
                  <button
                    className={`leetcode-tab-btn ${rightBottomTab === 'testcase' ? 'active' : ''}`}
                    onClick={() => setRightBottomTab('testcase')}
                  >
                    Testcase
                  </button>

                  <button
                    className={`leetcode-tab-btn ${rightBottomTab === 'result' ? 'active' : ''}`}
                    onClick={() => setRightBottomTab('result')}
                  >
                    Test Result {currentExecution && `(${currentExecution.status})`}
                  </button>
                </div>

                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => setShowConsole(false)}
                >
                  <ChevronDown size={14} /> Collapse
                </button>
              </div>

              {/* Panel Body */}
              <div style={{ padding: '0.85rem 1rem', overflowY: 'auto', flex: 1, maxHeight: '210px' }}>
                {rightBottomTab === 'testcase' ? (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>
                      Sample Test Cases:
                    </h4>
                    {currentProblem.testCases?.map((tc, idx) => (
                      <div key={`tc-input-${idx}`} style={{ marginBottom: '0.5rem', padding: '0.45rem 0.65rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Case {idx + 1}:</span>
                        <div className="font-mono" style={{ fontSize: '0.78rem', color: '#1e293b', marginTop: '0.1rem' }}>
                          Input: {tc.input}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  isExecuting ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1.5rem 0' }}>
                      Executing code & analyzing security pipeline...
                    </p>
                  ) : apiError ? (
                    <div className="alert-box alert-danger">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Submission Error</strong>
                        <p style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>{apiError}</p>
                      </div>
                    </div>
                  ) : !currentExecution ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1.5rem 0' }}>
                      You must run or submit your code first.
                    </p>
                  ) : currentExecution.status === 'SECURITY_VIOLATION' ? (
                    <div className="alert-box alert-danger">
                      <ShieldAlert size={18} />
                      <div>
                        <strong>🚫 Request Blocked for Security</strong>
                        <p style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>
                          We couldn't process your submission because it contains instructions that appear to modify or bypass the evaluation process.
                        </p>
                      </div>
                    </div>
                  ) : currentExecution.status === 'TIME_LIMIT_EXCEEDED' ? (
                    <div className="alert-box alert-warning">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Time Limit Exceeded (Timeout)</strong>
                        <p style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>{currentExecution.errorMessage}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: currentExecution.score >= 8.0 ? '#15803d' : '#b45309' }}>
                            {currentExecution.status}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginLeft: '0.75rem' }}>
                            Runtime: {currentExecution.executionTime} • Memory: {currentExecution.memoryUsed}
                          </span>
                        </div>
                        {currentExecution.score !== null && (
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb' }}>
                            Score: {currentExecution.score} / 10
                          </span>
                        )}
                      </div>

                      {currentExecution.testCaseResults?.length > 0 && (
                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Case</th>
                                <th>Input</th>
                                <th>Expected</th>
                                <th>Actual</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentExecution.testCaseResults.map((tc, idx) => (
                                <tr key={`tc-res-${idx}`}>
                                  <td style={{ fontWeight: 600, fontSize: '0.76rem' }}>#{idx + 1}</td>
                                  <td className="font-mono" style={{ fontSize: '0.75rem' }}>{tc.input}</td>
                                  <td className="font-mono" style={{ fontSize: '0.75rem' }}>{tc.expectedOutput}</td>
                                  <td className="font-mono" style={{ fontSize: '0.75rem' }}>{tc.actualOutput}</td>
                                  <td>
                                    <span className={`status-badge ${tc.status === 'PASSED' ? 'badge-approved' : 'badge-rejected'}`}>
                                      {tc.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
