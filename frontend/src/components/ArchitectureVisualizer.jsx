import React, { useState } from 'react';
import { Cpu, Layers, Database, Sparkles, CheckCircle, ArrowRight, UserCheck, RefreshCw, Zap } from 'lucide-react';

export default function ArchitectureVisualizer({ mem0Profile, onUpdateMem0 }) {
  const [activeNode, setActiveNode] = useState('langgraph');
  const [newWeakTopic, setNewWeakTopic] = useState('');

  const currentWeakTopics = mem0Profile?.weakTopics || ['Graph Traversal (DFS/BFS)', 'Dynamic Programming Memoization'];

  const handleAddWeakTopic = async (e) => {
    e.preventDefault();
    if (!newWeakTopic.trim()) return;
    const updated = [...currentWeakTopics, newWeakTopic.trim()];
    if (onUpdateMem0) {
      await onUpdateMem0({ weakTopics: updated });
    }
    setNewWeakTopic('');
  };

  const handleRemoveWeakTopic = async (index) => {
    const updated = currentWeakTopics.filter((_, i) => i !== index);
    if (onUpdateMem0) {
      await onUpdateMem0({ weakTopics: updated });
    }
  };

  return (
    <div className="architecture-visualizer">
      {/* Overview Banner */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu color="#2563eb" size={22} />
              AI Pipeline Stack: LangGraph, LangChain, Mem0 & AI SDK
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
              Interactive visualization showing how the GenAI architecture powers safe automated grading and personalized doubt resolution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="status-badge badge-pending" style={{ fontSize: '0.75rem' }}>
              ENTERPRISE AI ARCHITECTURE
            </span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div
          className="card-panel"
          style={{ cursor: 'pointer', border: activeNode === 'langgraph' ? '2px solid #2563eb' : '1px solid var(--border-light)', padding: '1rem' }}
          onClick={() => setActiveNode('langgraph')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Layers color="#2563eb" size={18} />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>1. LangGraph</strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
            State machine workflow managing multi-step execution, retries, and teacher approval transitions.
          </p>
        </div>

        <div
          className="card-panel"
          style={{ cursor: 'pointer', border: activeNode === 'langchain' ? '2px solid #2563eb' : '1px solid var(--border-light)', padding: '1rem' }}
          onClick={() => setActiveNode('langchain')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Sparkles color="#2563eb" size={18} />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>2. LangChain</strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
            Prompt engineering templates, XML delimiter wrapping, and structured JSON output parsers.
          </p>
        </div>

        <div
          className="card-panel"
          style={{ cursor: 'pointer', border: activeNode === 'mem0' ? '2px solid #2563eb' : '1px solid var(--border-light)', padding: '1rem' }}
          onClick={() => setActiveNode('mem0')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Database color="#2563eb" size={18} />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>3. Mem0 Memory</strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
            Persistent student learning profile memory (weak topics, past mistakes, preference context).
          </p>
        </div>

        <div
          className="card-panel"
          style={{ cursor: 'pointer', border: activeNode === 'aisdk' ? '2px solid #2563eb' : '1px solid var(--border-light)', padding: '1rem' }}
          onClick={() => setActiveNode('aisdk')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Zap color="#2563eb" size={18} />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>4. AI SDK</strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
            Unified LLM provider abstraction, streaming responses, tool calls, and model fallbacks.
          </p>
        </div>
      </div>

      {/* LangGraph State Diagram & Node Details */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
        {/* LangGraph Workflow Flowchart */}
        <div className="card-panel">
          <div className="card-header-flex">
            <h3 className="card-title">LangGraph State Machine Flowchart</h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>Live Node Transition Diagram</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Step 1 */}
            <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                <div>
                  <strong style={{ fontSize: '0.82rem' }}>Input Guardrail Node</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Strips unsafe tags and validates payload schema</div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            {/* Step 2 */}
            <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                <div>
                  <strong style={{ fontSize: '0.82rem' }}>Prompt Injection Detector Node</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Scans for jailbreaks & system prompt extraction attacks</div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            {/* Step 3 */}
            <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                <div>
                  <strong style={{ fontSize: '0.82rem' }}>Mem0 Profile Retriever Node</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Retrieves student weak topics and learning preferences</div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            {/* Step 4 */}
            <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div>
                <div>
                  <strong style={{ fontSize: '0.82rem' }}>LangChain Assembly & AI SDK Call</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Formats system prompt with &lt;user_data&gt; & invokes LLM</div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            {/* Step 5 */}
            <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1d4ed8', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#1e40af' }}>Teacher Review Queue State</strong>
                  <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>State = PENDING_REVIEW (Human-in-the-Loop Gate)</div>
                </div>
              </div>
              <CheckCircle size={16} color="#1d4ed8" />
            </div>
          </div>
        </div>

        {/* Mem0 Student Profile Inspector & Customizer */}
        <div className="card-panel">
          <div className="card-header-flex">
            <div className="card-title-group">
              <Database size={18} color="#2563eb" />
              <h3 className="card-title">Mem0 Student Memory Inspector</h3>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem', padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Active Student: {mem0Profile?.studentName || 'Alex Chen'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
              Skill Level: <strong>{mem0Profile?.level || 'Intermediate'}</strong> • Preferred: <strong>{mem0Profile?.preferredLanguage || 'Python 3'}</strong>
            </div>
          </div>

          {/* Identified Weak Topics */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Identified Weak Topics (Auto-Injected into AI Prompts):</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {currentWeakTopics.map((topic, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '0.78rem', color: '#b45309' }}>
                  <span>• {topic}</span>
                  <button style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }} onClick={() => handleRemoveWeakTopic(i)}>✕</button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddWeakTopic} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                placeholder="Add new weak topic (e.g. Dynamic Programming)"
                value={newWeakTopic}
                onChange={(e) => setNewWeakTopic(e.target.value)}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>Add</button>
            </form>
          </div>

          <div style={{ padding: '0.65rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            <strong>How Mem0 Improves Doubt Resolution:</strong> When Alex Chen posts a doubt, Mem0 automatically inserts his historical weakness in Graph Traversal into the system prompt context, instructing the AI to provide explicit step-by-step visual graph walk-throughs.
          </div>
        </div>
      </div>
    </div>
  );
}
