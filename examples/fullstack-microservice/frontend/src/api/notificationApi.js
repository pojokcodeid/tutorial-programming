/* API notifikasi — semua bicara ke notification-service lewat proxy. */
import api from './client.js';

export function list() {
  return api.get('/notifications').then((r) => ({
    items: r.data,
    unread: Number(r.headers['x-unread-count'] || 0)
  }));
}

export function markRead(id) {
  return api.patch(`/notifications/${id}/read`).then((r) => r.data);
}
