import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock, User, Mail, Eye, EyeOff, BookOpen, ShieldAlert } from 'lucide-react';

export default function LoginPage({ onBackToHome }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoRole) => {
    if (demoRole === 'student') {
      setEmail('student@kpmg.com');
      setPassword('student123');
    } else if (demoRole === 'teacher') {
      setEmail('teacher@kpmg.com');
      setPassword('teacher123');
    } else if (demoRole === 'admin') {
      setEmail('admin@codeshield.ai');
      setPassword('admin123');
    }
    setMode('login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
      {onBackToHome && (
        <button
          type="button"
          onClick={onBackToHome}
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.45rem 0.9rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={16} /> Back to Overview
        </button>
      )}

      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '52px', height: '52px', backgroundColor: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#ffffff', fontWeight: 800, fontSize: '1.3rem' }}>
            CS
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>CodeShield AI</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Enterprise LMS — Safety Guardrail &amp; AI Portal</p>
        </div>

        {/* Login Card */}
        <div className="card-panel" style={{ padding: '2rem' }}>
          {/* Mode Toggle */}
          <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
            <button className={`nav-tab-btn ${mode === 'login' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('login')}>
              Sign In
            </button>
            <button className={`nav-tab-btn ${mode === 'register' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          {error && (
            <div className="alert-box alert-danger" style={{ marginBottom: '1rem' }}>
              <Lock size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Alex Chen" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@kpmg.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Instructor</option>
                  <option value="admin">Security Admin</option>
                </select>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
              QUICK DEMO ACCESSIBILITY
            </p>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '0.35rem 0.4rem' }} onClick={() => fillDemo('student')}>
                <User size={13} /> Student
              </button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '0.35rem 0.4rem' }} onClick={() => fillDemo('teacher')}>
                <BookOpen size={13} /> Teacher
              </button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '0.35rem 0.4rem', color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2' }} onClick={() => fillDemo('admin')}>
                <ShieldAlert size={13} color="#dc2626" /> Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
