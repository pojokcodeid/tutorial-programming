/* Instance axios + interceptor otomatis access & refresh token */
import axios from 'axios';
import { tokenStore, announceSessionExpired } from '../auth/token.js';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE_URL });

/* ---------- interceptor REQUEST: sisipkan access token ---------- */
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* endpoint auth yang tidak boleh memicu percobaan refresh */
const TANPA_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/* satu proses refresh dipakai bersama oleh banyak request yang kebetulan
   sama-sama menerima 401 di saat yang bersamaan */
let refreshing = null;

async function runRefresh() {
  // axios polos (bukan instance api) agar interceptor tidak berputar-putar
  const res = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken: tokenStore.refresh
  });
  tokenStore.save(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken;
}

/* ---------- interceptor RESPONSE: refresh saat 401 ---------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const bolehCobaRefresh =
      status === 401 &&
      !original._retry &&                    // hanya sekali per request
      !TANPA_RETRY.includes(original.url) && // login salah password tidak di-refresh
      tokenStore.refresh;                    // tanpa refresh token, ya sudah

    if (!bolehCobaRefresh) return Promise.reject(error);

    original._retry = true;
    try {
      refreshing = refreshing || runRefresh();
      const accessToken = await refreshing;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);                  // kirim ulang request awal
    } catch (err) {
      tokenStore.clear();
      announceSessionExpired();              // beri tahu AuthContext
      return Promise.reject(err);
    } finally {
      refreshing = null;
    }
  }
);

export default api;
