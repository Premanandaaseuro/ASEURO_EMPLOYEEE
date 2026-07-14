import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('emp_token');
      localStorage.removeItem('emp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login:        (data) => api.post('/auth/login', data),
  register:     (data) => api.post('/auth/register', data),
  registerFace: (data) => api.post('/auth/register-face', data),
  faceLogin:    (data) => api.post('/auth/face-login', data),
};

// ── Employees ─────────────────────────────────────────
export const employeeApi = {
  getAll:    (params) => api.get('/employees', { params }),
  getById:   (id)     => api.get(`/employees/${id}`),
  create:    (data)   => api.post('/employees', data),
  update:    (id, data) => api.put(`/employees/${id}`, data),
  delete:    (id)     => api.delete(`/employees/${id}`),
  search:    (keyword, params) => api.get('/employees/search', { params: { keyword, ...params } }),
  getStats:  ()       => api.get('/employees/stats'),
  getDepts:  ()       => api.get('/employees/departments'),
};

// ── Licenses ──────────────────────────────────────────
export const licenseApi = {
  getAll:         () => api.get('/licenses'),
  generate:       (data) => api.post('/licenses/generate', data),
  revoke:         (id) => api.post(`/licenses/${id}/revoke`),
  getPublicKey:   () => api.get('/licenses/keys/public'),
  regenerateKeys: () => api.post('/licenses/keys/regenerate'),
  verify:         (licenseKey) => api.post('/licenses/verify', { licenseKey }),
};

export default api;
