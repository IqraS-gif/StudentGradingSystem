import React from 'react';
import { ArrowRight, ShieldCheck, Code2, Cpu, CheckCircle2, Sparkles, Lock, Terminal } from 'lucide-react';
import TypingKeyboard from '../components/ui/TypingKeyboard';

export default function HomePage({ onStartNow }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#0f172a', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{ height: '70px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>
            CS
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em' }}>CodeShield</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginLeft: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>KPMG LMS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onStartNow}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Start Now <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '3rem 2.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%', gap: '3rem' }}>
        
        {/* Left Side: Brand, Slogan, Prominent Start Now Button */}
        <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '620px' }}>
          
          {/* Security Badge Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', color: '#1e40af', fontSize: '0.8rem', fontWeight: 700, width: 'fit-content' }}>
            <ShieldCheck size={14} color="#2563eb" /> Enterprise LMS &amp; AI Security Portal
          </div>

          {/* Main Headline */}
          <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.1, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Next-Gen Code Grading &amp; Real-Time AI Security
          </h1>

          {/* One-Liner Slogan */}
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            Enterprise code evaluation, interactive doubt resolution, and multi-layer prompt injection defense built specifically for computer science education at KPMG.
          </p>

          {/* Prominent Start Now Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={onStartNow}
              style={{
                padding: '0.95rem 2.2rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Now <ArrowRight size={20} />
            </button>

            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} color="#16a34a" /> Free Instant Demo Access
            </span>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Code2 size={15} color="#2563eb" /> LeetCode IDE
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>Sandbox test cases &amp; AST analysis</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={15} color="#2563eb" /> 6-Layer Guardrail
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>Obfuscation &amp; injection defense</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Cpu size={15} color="#2563eb" /> Multi-LLM Rotation
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>Gemini &amp; Groq zero-downtime pool</span>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive 3D TypingKeyboard Graphic */}
        <div style={{ flex: '1 1 50%', height: '520px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            {/* Dark IDE Header bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '36px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                codeshield-live-execution.py
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>
                ● ACTIVE
              </div>
            </div>

            {/* TypingKeyboard 3D component */}
            <div style={{ width: '100%', height: '100%', paddingTop: '36px' }}>
              <TypingKeyboard
                autoTypeText="CodeShield AI. Enterprise LMS & Security Auditor for KPMG. Real-time AST sandboxing & prompt injection guardrails.       "
                typingSpeed={[40, 110]}
                scale={0.72}
                accentColor="#2563eb"
                secondaryAccent="#0284c7"
              />
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '1.25rem 2.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
        CodeShield AI Enterprise LMS — Built for KPMG Academic Program • Powered by Gemini &amp; Groq Multi-Model Pipelines
      </footer>

    </div>
  );
}
