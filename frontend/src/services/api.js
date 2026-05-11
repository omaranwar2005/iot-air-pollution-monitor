import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Sensor API
export const sensorAPI = {
  getLatest: () => api.get('/sensors/latest'),
  getHistory: (params) => api.get('/sensors/history', { params }),
  getHourlyAnalytics: (params) => api.get('/sensors/analytics/hourly', { params }),
  getDailyAnalytics: (params) => api.get('/sensors/analytics/daily', { params }),
  getAQI: () => api.get('/sensors/aqi'),
  simulate: () => api.post('/sensors/simulate'),
  exportCSV: (params) => api.get('/sensors/export', { params, responseType: 'blob' }),
};

// Alert API
export const alertAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  getStats: () => api.get('/alerts/stats'),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  acknowledgeAll: () => api.put('/alerts/acknowledge-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Device API
export const deviceAPI = {
  getDevices: () => api.get('/devices'),
  getDevice: (id) => api.get(`/devices/${id}`),
  register: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  sendCommand: (id, data) => api.post(`/devices/${id}/command`, data),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  cleanupData: (days) => api.delete('/admin/data/cleanup', { data: { days } }),
};

export default api;
