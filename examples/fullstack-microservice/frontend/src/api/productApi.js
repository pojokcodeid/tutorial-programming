/* API produk — semua bicara ke product-service lewat proxy. */
import api from './client.js';

export function list() {
  return api.get('/products').then((r) => r.data);
}

/* Versi lengkap: ikut membawa header X-Cache (HIT/MISS dari Redis)
   agar halaman Produk bisa menampilkan status cache di layarnya. */
export function listWithCache() {
  return api.get('/products').then((r) => ({
    items: r.data,
    cache: r.headers['x-cache'] || '—'
  }));
}

export function get(id) {
  return api.get(`/products/${id}`).then((r) => r.data);
}

export function create(data) {
  return api.post('/products', data).then((r) => r.data);
}

export function update(id, data) {
  return api.put(`/products/${id}`, data).then((r) => r.data);
}

export function remove(id) {
  return api.delete(`/products/${id}`).then((r) => r.data);
}
