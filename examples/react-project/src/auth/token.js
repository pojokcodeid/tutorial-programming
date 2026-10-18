/* Penyimpanan token di localStorage + sinyal "sesi berakhir" */

const ACCESS_KEY = 'toko-access-token';
const REFRESH_KEY = 'toko-refresh-token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  /* simpan pasangan token baru (dipakai login, register, dan hasil refresh) */
  save(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  /* refresh token gagal → sesi dianggap berakhir */
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const AUTH_EXPIRED_EVENT = 'auth:expired';

/* dipanggil axios interceptor ketika refresh token tidak bisa dipakai lagi */
export function announceSessionExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
