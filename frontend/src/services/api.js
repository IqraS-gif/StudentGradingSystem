/**
 * Axios API client configured with JWT bearer token auth
 * All requests automatically include the stored auth token
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Auth
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateMem0: (body) => request('/auth/me/mem0', { method: 'PATCH', body: JSON.stringify(body) })
};

// Problems
export const problemsAPI = {
  getAll: () => request('/problems'),
  getById: (id) => request(`/problems/${id}`)
};

// Submissions
export const submissionsAPI = {
  submit: (body) => request('/submissions', { method: 'POST', body: JSON.stringify(body) }),
  getAll: (params = '') => request(`/submissions${params}`),
  getById: (id) => request(`/submissions/${id}`),
  updateGrade: (id, body) => request(`/submissions/${id}/grade`, { method: 'PATCH', body: JSON.stringify(body) })
};

// Doubts
export const doubtsAPI = {
  create: (body) => request('/doubts', { method: 'POST', body: JSON.stringify(body) }),
  getAll: (params = '') => request(`/doubts${params}`),
  getById: (id) => request(`/doubts/${id}`),
  approve: (id, body = {}) => request(`/doubts/${id}/approve`, { method: 'PATCH', body: JSON.stringify(body) }),
  reject: (id, body = {}) => request(`/doubts/${id}/reject`, { method: 'PATCH', body: JSON.stringify(body) }),
  regenerate: (id, teacherNotes = '') => request(`/doubts/${id}/regenerate`, { method: 'PATCH', body: JSON.stringify({ teacherNotes }) })
};

// Analytics
export const analyticsAPI = {
  student: () => request('/analytics/student'),
  teacher: () => request('/analytics/teacher'),
  auditLogs: (params = '') => request(`/analytics/audit-logs${params}`)
};
