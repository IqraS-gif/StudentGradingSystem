import React from 'react';
import { BookOpen, MessageSquare, BarChart2, ShieldAlert, LogOut } from 'lucide-react';

export default function Header({ currentTab, setCurrentTab, activeRole, pendingCount, user, onLogout }) {
  const isAdmin = activeRole === 'admin';

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon-box" style={{ backgroundColor: '#2563eb', fontWeight: 800 }}>
            CS
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              CodeShield AI
            </h1>
            <p className="brand-subtitle" style={{ fontSize: '0.73rem', color: '#64748b' }}>
              Enterprise LMS Guardrail &amp; AI Doubt Portal
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {!isAdmin ? (
            <>
              <button
                className={`nav-tab-btn ${currentTab === 'grading' ? 'active' : ''}`}
                onClick={() => setCurrentTab('grading')}
              >
                <BookOpen size={16} />
                Code Grading
              </button>

              <button
                className={`nav-tab-btn ${currentTab === 'doubts' ? 'active' : ''}`}
                onClick={() => setCurrentTab('doubts')}
              >
                <MessageSquare size={16} />
                Doubt Board &amp; Approval
                {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
              </button>

              <button
                className={`nav-tab-btn ${currentTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setCurrentTab('analytics')}
              >
                <BarChart2 size={16} />
                Analytics
              </button>
            </>
          ) : (
            <button
              className={`nav-tab-btn ${currentTab === 'security' ? 'active' : ''}`}
              onClick={() => setCurrentTab('security')}
              style={{
                color: '#dc2626',
                borderColor: '#fecaca',
                backgroundColor: '#fef2f2'
              }}
            >
              <ShieldAlert size={16} color="#dc2626" />
              Security &amp; Attack Logs
            </button>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="user-profile-widget">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name}</span>
            <span className={`user-role-badge ${activeRole === 'student' ? 'role-student' : activeRole === 'admin' ? 'badge-rejected' : 'role-teacher'}`} style={{ marginTop: '0.1rem', fontSize: '0.68rem', backgroundColor: isAdmin ? '#fef2f2' : undefined, color: isAdmin ? '#dc2626' : undefined, border: isAdmin ? '1px solid #fecaca' : undefined }}>
              {activeRole?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.5rem', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
            title="Log out"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
