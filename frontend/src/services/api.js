import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (employeeId, password) =>
    api.post('/auth/login', { employeeId, password }),
  
  logout: (refreshToken) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),
  
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// Workers API
export const workersAPI = {
  getWorkers: (params = {}) =>
    api.get('/workers', { params }),
  
  getWorker: (id) =>
    api.get(`/workers/${id}`),
  
  createWorker: (data) =>
    api.post('/workers', data),
  
  updateWorker: (id, data) =>
    api.put(`/workers/${id}`, data),
  
  deleteWorker: (id) =>
    api.delete(`/workers/${id}`),
};

// Programs API
export const programsAPI = {
  getPrograms: (params = {}) =>
    api.get('/programs', { params }),
  
  getProgram: (id) =>
    api.get(`/programs/${id}`),
  
  createProgram: (data) =>
    api.post('/programs', data),
  
  updateProgram: (id, data) =>
    api.put(`/programs/${id}`, data),
  
  deleteProgram: (id) =>
    api.delete(`/programs/${id}`),
};

export default api;