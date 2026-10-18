/* Context API: satu sumber kebenaran untuk data login */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { tokenStore, AUTH_EXPIRED_EVENT } from './token.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);   // sesi sudah selesai dipulihkan?

  /* 1) saat aplikasi dibuka: pulihkan sesi dari token tersimpan */
  useEffect(() => {
    let aktif = true;

    async function pulihkanSesi() {
      if (tokenStore.access || tokenStore.refresh) {
        try {
          const u = await authApi.me();   // token mati → interceptor refresh sendiri
          if (aktif) setUser(u);
        } catch {
          tokenStore.clear();             // refresh token ikut habis → mulai dari nol
        }
      }
      if (aktif) setReady(true);
    }

    pulihkanSesi();
    return () => { aktif = false; };
  }, []);

  /* 2) dengarkan sinyal sesi berakhir dari axios interceptor */
  useEffect(() => {
    const akhiriSesi = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    tokenStore.save(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    tokenStore.save(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    tokenStore.clear();                    // lokal dulu agar UI langsung sigap
    setUser(null);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken); // cabut token di server
      } catch { /* server mungkin sudah mati — abaikan */ }
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* hook kecil agar pemakaian tidak mengetik Context secara langsung */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() harus dipakai di dalam <AuthProvider>');
  return ctx;
}
