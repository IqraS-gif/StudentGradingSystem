import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import CodeGradingModule from './components/CodeGradingModule';
import DoubtBoardModule from './components/DoubtBoardModule';
import SecurityAdminModule from './components/SecurityAdminModule';
import AnalyticsModule from './components/AnalyticsModule';
import { problemsAPI, doubtsAPI, analyticsAPI } from './services/api';

function AppContent() {
  const { user, loading, logout, updateMem0 } = useAuth();
  const [currentTab, setCurrentTab] = useState('grading');

  // App-level state — from backend
  const [problems, setProblems] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  // Role-based tab routing
  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentTab('security');
    } else if (currentTab === 'security') {
      setCurrentTab('grading');
    }
  }, [user]);

  // Fetch problems on mount
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    problemsAPI.getAll()
      .then(data => setProblems(data.problems || []))
      .catch(err => setError(err.message))
      .finally(() => setDataLoading(false));
  }, [user]);

  // Fetch doubts when tab changes
  useEffect(() => {
    if (!user || currentTab !== 'doubts') return;
    doubtsAPI.getAll()
      .then(data => setDoubts(data.doubts || []))
      .catch(err => console.error('[App] Doubts fetch error:', err.message));
  }, [user, currentTab]);

  // Fetch analytics data
  useEffect(() => {
    if (!user) return;
    const fn = user.role === 'teacher' ? analyticsAPI.teacher : analyticsAPI.student;
    fn()
      .then(data => setAnalyticsData(data.analytics))
      .catch(err => console.error('[App] Analytics fetch error:', err.message));
  }, [user, currentTab]);

  const pendingCount = doubts.filter(d => d.workflowState === 'PENDING_REVIEW' || d.status === 'PENDING_REVIEW').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Authenticating CodeShield AI...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeRole={user.role}
        pendingCount={pendingCount}
        user={user}
        onLogout={logout}
      />

      <main className="main-content">
        {error && (
          <div className="alert-box alert-danger" style={{ marginBottom: '1rem' }}>
            Backend error: {error} — Is the backend server running on port 5000?
          </div>
        )}

        {dataLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
            Loading CodeShield AI workspace...
          </div>
        )}

        {currentTab === 'grading' && !dataLoading && (
          <CodeGradingModule
            problems={problems}
            setProblems={setProblems}
            activeRole={user.role}
          />
        )}

        {currentTab === 'doubts' && (
          <DoubtBoardModule
            doubts={doubts}
            setDoubts={setDoubts}
            mem0Profile={user.mem0Profile}
            activeRole={user.role}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
          />
        )}

        {currentTab === 'security' && (
          <SecurityAdminModule
            activeRole={user.role}
            user={user}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsModule
            analyticsData={analyticsData}
            activeRole={user.role}
            auditLogs={auditLogs}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
