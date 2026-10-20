/* Instance axios untuk seluruh aplikasi.

   baseURL relatif "/api" — di produksi nginx meneruskannya ke service Go,
   di pengembangan Vite proxy yang meneruskannya. Karena origin sama,
   tidak ada masalah CORS. */
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/* Menyederhanakan pesan galat: backend selalu membalas { message: "..." }
   sehingga halaman cukup menampilkan err.response?.data?.message. */
export function pesanGalat(err, fallback) {
  return err.response?.data?.message || fallback;
}

export default api;
