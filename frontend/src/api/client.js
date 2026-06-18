import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('officer');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  getOfficers: () => api.get('/auth/officers'),
  createOfficer: (data) => api.post('/auth/officers', data),
};

export const complaintsApi = {
  list: (params) => api.get('/complaints', { params }),
  stats: () => api.get('/complaints/stats'),
  get: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, status, rejection_reason) =>
    api.patch(`/complaints/${id}/status`, { status, rejection_reason }),
  assign: (id, officer_id) => api.patch(`/complaints/${id}/assign`, { officer_id }),
  addNote: (id, note) => api.post(`/complaints/${id}/notes`, { note }),
};

export default api;
