import api from './client.js';

/* hanya admin yang boleh memanggil ini — dijaga oleh backend */
export const list = () => api.get('/users').then((r) => r.data);

export const remove = (id) => api.delete(`/users/${id}`).then((r) => r.data);
