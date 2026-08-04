import React from 'react';
import { BookOpen, MessageSquare, BarChart2, LogOut } from 'lucide-react';

export default function Header({ currentTab, setCurrentTab, activeRole, pendingCount, user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon-box">
            GP
          </div>
          <div>
            <h1 className="brand-title">GradingPulse AI</h1>
            <p className="brand-subtitle">Enterprise LMS Module • Code Grading & AI Doubt Portal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
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
            Doubt Board & Approval
            {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
          </button>

          <button
            className={`nav-tab-btn ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentTab('analytics')}
          >
            <BarChart2 size={16} />
            Analytics
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="user-profile-widget">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name}</span>
            <span className={`user-role-badge ${activeRole === 'student' ? 'role-student' : 'role-teacher'}`} style={{ marginTop: '0.1rem', fontSize: '0.68rem' }}>
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
