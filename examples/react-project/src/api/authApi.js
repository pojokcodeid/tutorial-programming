import api from './client.js';

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);

export const register = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

/* memulihkan sesi dari token yang tersimpan; 401 ditangani interceptor */
export const me = () => api.get('/auth/me').then((r) => r.data.user);

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken }).then((r) => r.data);
