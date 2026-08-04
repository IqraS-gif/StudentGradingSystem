import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import CodeGradingModule from './components/CodeGradingModule';
import DoubtBoardModule from './components/DoubtBoardModule';
import SecurityGuardrailsModule from './components/SecurityGuardrailsModule';
import ArchitectureVisualizer from './components/ArchitectureVisualizer';
import AnalyticsModule from './components/AnalyticsModule';
import { problemsAPI, doubtsAPI, analyticsAPI } from './services/api';
import { TEST_ATTACK_PAYLOADS } from './data/initialData';

function AppContent() {
  const { user, loading, logout, updateMem0 } = useAuth();
  const [currentTab, setCurrentTab] = useState('grading');

  // App-level state — now from real backend
  const [problems, setProblems] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Fetch audit logs when on security tab
  useEffect(() => {
    if (!user || user.role !== 'teacher' || currentTab !== 'security') return;
    analyticsAPI.auditLogs()
      .then(data => setAuditLogs(data.logs || []))
      .catch(err => console.error('[App] Audit logs fetch error:', err.message));
  }, [user, currentTab]);

  // Fetch analytics when on analytics tab
  useEffect(() => {
    if (!user || currentTab !== 'analytics') return;
    const fn = user.role === 'teacher' ? analyticsAPI.teacher : analyticsAPI.student;
    fn()
      .then(data => setAnalyticsData(data.analytics))
      .catch(err => console.error('[App] Analytics fetch error:', err.message));
  }, [user, currentTab]);

  const pendingCount = doubts.filter(d => d.workflowState === 'PENDING_REVIEW').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Authenticating...</p>
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
            Backend error: {error} — Is the backend running on port 5000?
          </div>
        )}

        {dataLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
            Loading data from backend...
          </div>
        )}

        {currentTab === 'grading' && !dataLoading && (
          <CodeGradingModule
            problems={problems}
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
          <SecurityGuardrailsModule
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            attackPayloads={TEST_ATTACK_PAYLOADS}
            mem0Profile={user.mem0Profile}
            activeRole={user.role}
          />
        )}

        {currentTab === 'architecture' && (
          <ArchitectureVisualizer
            mem0Profile={user.mem0Profile}
            onUpdateMem0={updateMem0}
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
