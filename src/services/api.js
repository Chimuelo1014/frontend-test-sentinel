import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/api/auth/password/forgot', { email }),
  resetPassword: (data) => api.post('/api/auth/password/reset', data),
  setup2FA: () => api.post('/api/auth/2fa/setup'),
  enable2FA: (data) => api.post('/api/auth/2fa/enable', data),
  disable2FA: (password) => api.post('/api/auth/2fa/disable', { password }),
  verify2FA: (code) => api.post('/api/auth/2fa/verify', { code }),
};

// Tenant endpoints (ahora recibe userId directamente)
export const tenantAPI = {
  getMyTenants: (userId) => {
    return axios.get('http://localhost:8082/api/tenants/me', {
      headers: {
        'X-User-Id': userId,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getTenantById: (id) => axios.get(`http://localhost:8082/api/tenants/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }),

  createTenant: (data, userId) => {
    return axios.post('http://localhost:8082/api/tenants', data, {
      headers: {
        'X-User-Id': userId,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
};

export default api;
