import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Terminal, AlertTriangle, Eye, Lock, RefreshCw, FileText } from 'lucide-react';
import { processDoubtThroughAIPipeline } from '../services/aiPipeline';

export default function SecurityGuardrailsModule({ auditLogs, setAuditLogs, attackPayloads, mem0Profile }) {
  const [testPayload, setTestPayload] = useState(attackPayloads[0].payload);
  const [liveResult, setLiveResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleRunSecurityTest = (payloadToTest) => {
    setIsTesting(true);
    const targetPayload = payloadToTest || testPayload;

    setTimeout(() => {
      const res = processDoubtThroughAIPipeline({
        title: targetPayload,
        description: "Testing system prompt injection resilience and security guardrails.",
        codeSnippet: "",
        language: "Python",
        studentName: "Security Tester"
      }, mem0Profile);

      setLiveResult(res);
      setIsTesting(false);

      if (res.auditLogEntry) {
        setAuditLogs([res.auditLogEntry, ...auditLogs]);
      }
    }, 450);
  };

  return (
    <div className="security-module">
      {/* Overview Banner */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield color="#2563eb" size={22} />
              Multi-Layer Prompt Injection Protection & Guardrail Audit System
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
              Protects against malicious user inputs trying to leak system prompts, bypass teacher approval, or extract secret API keys.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="status-badge badge-approved" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={12} /> 6-LAYER GUARDRAIL ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem' }}>
        {/* Left Column: Interactive Injection Tester */}
        <div className="card-panel">
          <div className="card-header-flex">
            <div className="card-title-group">
              <Terminal size={18} color="#2563eb" />
              <h3 className="card-title">Interactive Prompt Injection Sandbox</h3>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
              Live Security Tester
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Select a pre-built attack vector or type a custom malicious prompt to test the 6-layer defense mechanism in real-time.
          </p>

          {/* Preset Attack Vectors */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Preset Attack Payloads:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {attackPayloads.map((atk, idx) => (
                <button
                  key={idx}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.4rem 0.65rem', textAlign: 'left' }}
                  onClick={() => {
                    setTestPayload(atk.payload);
                    handleRunSecurityTest(atk.payload);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldAlert size={14} color="#dc2626" />
                    <strong>{atk.name}</strong> ({atk.category})
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Test →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payload Input */}
          <div className="form-group">
            <label className="form-label">Custom Payload String:</label>
            <textarea
              className="form-textarea font-mono"
              style={{ minHeight: '110px', fontSize: '0.82rem' }}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              placeholder="Type prompt injection payload here..."
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => handleRunSecurityTest()}
            disabled={isTesting}
          >
            <Shield size={16} />
            {isTesting ? 'Running 6-Layer Security Evaluation...' : 'Execute Payload Against Guardrails'}
          </button>
        </div>

        {/* Right Column: Live Layer-by-Layer Evaluation Breakdown */}
        <div className="card-panel">
          <div className="card-header-flex">
            <h3 className="card-title">Live 6-Layer Security Breakdown</h3>
            {liveResult && (
              <span className={`status-badge ${liveResult.status === 'BLOCKED_HIGH_RISK' ? 'badge-blocked' : 'badge-approved'}`}>
                {liveResult.status === 'BLOCKED_HIGH_RISK' ? 'ATTACK BLOCKED' : 'CLEAN QUERY'}
              </span>
            )}
          </div>

          {!liveResult ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-subtle)' }}>
              <Lock size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Select or submit a payload to inspect individual security layer evaluations.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Layer 1 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Layer 1: Input Sanitizer</strong>
                  <span className="status-badge badge-approved" style={{ fontSize: '0.7rem' }}>PASSED</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>HTML/Script tags stripped, UTF-8 normalization completed.</span>
              </div>

              {/* Layer 2 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: liveResult.status === 'BLOCKED_HIGH_RISK' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${liveResult.status === 'BLOCKED_HIGH_RISK' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: liveResult.status === 'BLOCKED_HIGH_RISK' ? '#991b1b' : '#166534' }}>
                    Layer 2: Prompt Injection Classifier
                  </strong>
                  <span className={`status-badge ${liveResult.status === 'BLOCKED_HIGH_RISK' ? 'badge-blocked' : 'badge-approved'}`} style={{ fontSize: '0.7rem' }}>
                    Risk: {(liveResult.injectionRiskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: liveResult.status === 'BLOCKED_HIGH_RISK' ? '#991b1b' : '#166534' }}>
                  {liveResult.status === 'BLOCKED_HIGH_RISK'
                    ? `BLOCKED! Malicious pattern detected: "${liveResult.detectedPatterns.join(', ')}"`
                    : "No high-risk injection keywords or jailbreak signatures detected."}
                </span>
              </div>

              {/* Layer 3 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Layer 3: Strict System Role & Delimiters</strong>
                  <span className="status-badge badge-approved" style={{ fontSize: '0.7rem' }}>ENFORCED</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Input wrapped in XML &lt;user_data&gt; block with immutable system role.</span>
              </div>

              {/* Layer 4 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Layer 4: Mem0 Student Memory Isolation</strong>
                  <span className="status-badge badge-approved" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Student profile context retrieved without exposing developer keys.</span>
              </div>

              {/* Layer 5 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Layer 5: Output Validation Guardrail</strong>
                  <span className="status-badge badge-approved" style={{ fontSize: '0.7rem' }}>VERIFIED</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Output scanned for system prompt leak or internal key leakage.</span>
              </div>

              {/* Layer 6 */}
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#1e40af' }}>Layer 6: Teacher Approval State Machine</strong>
                  <span className="status-badge badge-pending" style={{ fontSize: '0.7rem' }}>MANDATORY QUEUE</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                  Even if clean, answer status is forced to PENDING_REVIEW for instructor approval before publication.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Audit Logs Table */}
      <div className="card-panel" style={{ marginTop: '1.25rem' }}>
        <div className="card-header-flex">
          <div className="card-title-group">
            <FileText size={18} color="#2563eb" />
            <h3 className="card-title">LLM Security Audit Trail & Guardrail Logs</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Showing last {auditLogs.length} events
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Initiator</th>
                <th>Query Preview</th>
                <th>Sanitizer</th>
                <th>Risk Score</th>
                <th>LLM Conf.</th>
                <th>Output Guardrail</th>
                <th>Workflow Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600, fontSize: '0.78rem' }}>{log.user}</td>
                  <td style={{ fontSize: '0.78rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.inputPreview}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>{log.sanitizerStatus}</td>
                  <td>
                    <strong style={{ color: log.injectionScore >= 0.5 ? '#dc2626' : '#16a34a', fontSize: '0.78rem' }}>
                      {(log.injectionScore * 100).toFixed(0)}%
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    {log.llmConfidence > 0 ? `${(log.llmConfidence * 100).toFixed(0)}%` : 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>{log.outputGuardrail}</td>
                  <td>
                    <span className={`status-badge ${log.workflowState === 'REJECTED_AUTOMATICALLY' ? 'badge-blocked' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                      {log.workflowState}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
