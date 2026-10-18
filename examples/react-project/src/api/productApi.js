import api from './client.js';

export const list = () => api.get('/products').then((r) => r.data);

export const get = (id) => api.get(`/products/${id}`).then((r) => r.data);

export const create = (payload) => api.post('/products', payload).then((r) => r.data);

export const update = (id, payload) => api.patch(`/products/${id}`, payload).then((r) => r.data);

export const remove = (id) => api.delete(`/products/${id}`).then((r) => r.data);
