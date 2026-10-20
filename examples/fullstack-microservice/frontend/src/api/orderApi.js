/* API pesanan — semua bicara ke order-service lewat proxy. */
import api from './client.js';

export function list() {
  return api.get('/orders').then((r) => r.data);
}

/* Kunci idempotensi dibuat di klien: bila request yang sama dikirim ulang
   (misal karena jaringan terputus), server tidak membuat pesanan kedua. */
export function create({ productId, qty, customer }) {
  const idemKey = crypto.randomUUID();
  return api
    .post('/orders', { product_id: productId, qty, customer }, { headers: { 'Idempotency-Key': idemKey } })
    .then((r) => r.data);
}
