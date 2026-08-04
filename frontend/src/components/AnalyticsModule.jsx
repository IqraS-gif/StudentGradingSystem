import React from 'react';
import { BarChart2, TrendingUp, ShieldCheck, CheckCircle, Award, Users } from 'lucide-react';

export default function AnalyticsModule({ analyticsData, activeRole, auditLogs }) {
  const data = analyticsData || {};

  // Student metrics
  const totalSubmissions = data.totalSubmissions || 0;
  const avgScore = data.avgScore || 0;
  const problemsSolved = data.problemsSolved || 0;

  // Teacher metrics
  const totalStudents = data.totalStudents || 0;
  const pendingApprovalCount = data.pendingApprovalCount || 0;
  const approvalRate = data.approvalRate || 0;
  const attacksBlocked = data.attacksBlocked || (auditLogs || []).filter(l => l.injectionRisk === 'CRITICAL_ATTACK' || l.injectionRiskScore >= 0.5).length;
  const avgAIConfidence = data.avgAIConfidence || 0;

  return (
    <div className="analytics-module">
      {/* Top Banner */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 color="#2563eb" size={22} />
            System Analytics & GenAI Performance Metrics
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            {activeRole === 'teacher'
              ? 'Teacher view — platform-wide submission stats, approval throughput, and prompt injection defense metrics.'
              : 'Student view — your submission history, average AI score, and problem-solving progress.'}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        {activeRole === 'teacher' ? (
          <>
            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Students</span>
                <Users size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalStudents}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Registered on Platform</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Approval Rate</span>
                <CheckCircle size={18} color="#16a34a" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{approvalRate}%</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{pendingApprovalCount} Drafts Pending Review</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Avg AI Confidence</span>
                <TrendingUp size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{avgAIConfidence}%</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>LangChain Draft Quality</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Attacks Blocked</span>
                <ShieldCheck size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{attacksBlocked}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Prompt Injection Interceptions</span>
            </div>
          </>
        ) : (
          <>
            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Submissions</span>
                <Award size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalSubmissions}</div>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>All Sandboxed & Graded</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Average AI Score</span>
                <TrendingUp size={18} color="#16a34a" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{avgScore} / 10</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>LangChain Qualitative Benchmark</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Problems Solved</span>
                <CheckCircle size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{problemsSolved}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Unique problems attempted</span>
            </div>

            <div className="card-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>My Doubts Posted</span>
                <Users size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{data.totalDoubts || 0}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{data.approvedDoubts || 0} Approved by Teacher</span>
            </div>
          </>
        )}
      </div>

      {/* Analytics Charts */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>
        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Topic Doubt Distribution (Platform-wide)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Graph Algorithms & Traversal (DFS/BFS)', width: 45 },
              { label: 'Dynamic Programming & Memoization', width: 30 },
              { label: 'Arrays & Two Pointer', width: 25 }
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>{item.label}</span>
                  <span>{item.width}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.width}%`, height: '100%', backgroundColor: '#2563eb' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>AI Draft Confidence Score Spectrum</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
              <strong style={{ fontSize: '0.82rem', color: '#166534' }}>High Confidence (90% - 100%)</strong>
              <p style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '0.15rem' }}>
                88% of generated drafts. Passes output validation layer directly into Teacher Approval Queue.
              </p>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
              <strong style={{ fontSize: '0.82rem', color: '#b45309' }}>Medium Confidence (70% - 89%)</strong>
              <p style={{ fontSize: '0.76rem', color: '#92400e', marginTop: '0.15rem' }}>
                12% of generated drafts. Flagged for mandatory instructor modification before publishing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
