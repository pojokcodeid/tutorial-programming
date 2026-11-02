/* ============================================================
   Pelajaran React Native — Bab 10: Autentikasi dan Sesi Aman
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-authentication',
  title: 'Autentikasi, Token, dan Sesi yang Aman',
  chapter: 'Data & Perangkat',
  duration: '30 menit',
  intro: [
    'Autentikasi mobile bukan hanya form login. Ada token akses yang singkat, refresh token yang harus disimpan aman, sesi yang bertahan setelah aplikasi ditutup, dan permintaan yang gagal saat token kedaluwarsa di tengah jalan.',
    'Kesalahan paling umum adalah menyimpan token di AsyncStorage, memperbarui token di setiap request secara paralel, atau menganggap logout cukup dengan menghapus state. Bab ini membangun alur yang benar untuk Kantong: access token di memori, refresh token di SecureStore, refresh single-flight, dan pembersihan menyeluruh saat logout.',
    'Kita juga membahas biometrik dan OAuth. Keduanya berguna, tetapi bukan pengganti desain sesi yang benar.'
  ],
  objectives: [
    'Membedakan access token, refresh token, dan session',
    'Menyimpan token dengan SecureStore, bukan AsyncStorage',
    'Menerapkan refresh single-flight dan retry 401 satu kali',
    'Membersihkan sesi, cache, dan data pribadi saat logout',
    'Menambahkan biometrik/OAuth dengan pemahaman batasannya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Model Sesi yang Aman untuk Mobile</h3><table class="vocab"><tr><th>Bagian</th><th>Umur</th><th>Tempat penyimpanan</th><th>Catatan</th></tr><tr><td>Access token</td><td>5–15 menit</td><td>Memori (variabel modul)</td><td>Hilang saat aplikasi ditutup; tidak perlu persist</td></tr><tr><td>Refresh token</td><td>7–30 hari</td><td>SecureStore</td><td>Dirotasi server; dapat dicabut</td></tr><tr><td>Data profil</td><td>Sesi</td><td>Cache query</td><td>Dibersihkan saat logout</td></tr><tr><td>Preferensi</td><td>Permanen</td><td>AsyncStorage</td><td>Bukan rahasia</td></tr></table><p>Tujuan access token berumur pendek adalah membatasi kerusakan bila token bocor. Refresh token yang berumur panjang harus dilindungi perangkat dan dapat dicabut server.</p>'
    },
    {
      type: 'example',
      title: 'Penyimpanan token dengan SecureStore',
      lang: 'ts',
      output: false,
      code: `// src/features/auth/tokenStorage.ts
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'kantong.refresh_token';

export async function saveRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function readRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// Access token sengaja hanya di memori:
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}`,
      explain: [
        'SecureStore memakai Keychain (iOS) atau Keystore (Android). AsyncStorage biasa tidak terenkripsi dan mudah dibaca pada perangkat yang di-root.',
        '<code>WHEN_UNLOCKED_THIS_DEVICE_ONLY</code> membatasi akses saat perangkat terkunci dan mencegah backup ke perangkat lain. Android mengabaikan sebagian opsi iOS; tetap gunakan SecureStore.',
        'Access token di memori hilang saat aplikasi dimatikan. Saat aplikasi dibuka, aplikasi memakai refresh token untuk mendapatkan access token baru.'
      ]
    },
    {
      type: 'example',
      title: 'Login, refresh single-flight, dan logout',
      lang: 'ts',
      output: false,
      code: `// src/features/auth/authService.ts
import { apiRequest, ApiError } from '@/services/api';
import {
  clearRefreshToken, getAccessToken, readRefreshToken,
  saveRefreshToken, setAccessToken,
} from './tokenStorage';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
};

export async function login(email: string, password: string) {
  const result = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.accessToken);
  await saveRefreshToken(result.refreshToken);
  return result.user;
}

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) throw new ApiError('Sesi berakhir', 401, 'http');

    const result = await apiRequest<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
    );

    setAccessToken(result.accessToken);
    await saveRefreshToken(result.refreshToken); // rotasi
    return result.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: \`Bearer \${getAccessToken() ?? ''}\` },
    });
  } catch {
    // Tetap bersihkan sesi lokal meskipun server tidak terjangkau.
  } finally {
    setAccessToken(null);
    await clearRefreshToken();
  }
}`,
      explain: [
        '<code>refreshPromise</code> memastikan hanya satu request refresh berjalan. Tanpa ini, sepuluh request yang gagal 401 akan memicu sepuluh refresh dan saling menimpa token.',
        'Refresh token dirotasi: response berisi refresh token baru dan yang lama tidak boleh dipakai lagi.',
        'Logout lokal tetap dilakukan meskipun panggilan server gagal. Pengguna tidak boleh terjebak dalam sesi yang tidak bisa diakhiri.'
      ]
    },
    {
      type: 'example',
      title: 'Retry satu kali setelah 401',
      lang: 'ts',
      output: false,
      code: `// src/services/authorizedRequest.ts
import { apiRequest, ApiError } from './api';
import { getAccessToken, refreshAccessToken } from '@/features/auth/authService';

export async function authorizedRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  try {
    return await apiRequest<T>(path, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: token ? \`Bearer \${token}\` : '',
      },
    });
  } catch (error) {
    const isUnauthorized = error instanceof ApiError && error.status === 401;
    if (!isUnauthorized) throw error;

    const newToken = await refreshAccessToken();
    return apiRequest<T>(path, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: \`Bearer \${newToken}\`,
      },
    });
  }
}`,
      explain: [
        'Hanya 401 yang memicu refresh. 403 berarti pengguna sudah dikenali tetapi tidak berhak; refresh tidak akan mengubahnya.',
        'Retry dibatasi satu kali. Bila token baru juga ditolak, sesi memang tidak valid dan pengguna harus login ulang.',
        'Pastikan endpoint refresh tidak memakai <code>authorizedRequest</code>; jika tidak, akan terjadi rekursi tanpa henti ketika refresh sendiri mengembalikan 401.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyambungkan ke State Aplikasi</h3><p>Simpan status sesi di store atau Context dengan tiga nilai: <code>loading</code>, <code>authenticated</code>, dan <code>guest</code>. Saat aplikasi dibuka, baca refresh token, coba refresh, lalu ambil profil. Jangan menganggap pengguna login hanya karena token ada; token bisa sudah dicabut.</p><p>Setelah login berhasil, bersihkan cache query lama agar data pengguna sebelumnya tidak muncul. Saat logout, lakukan urutan sebaliknya: batalkan query, bersihkan cache, hapus token, reset store, lalu arahkan ke login.</p>'
    },
    {
      type: 'example',
      title: 'Bootstrap sesi saat aplikasi dibuka',
      lang: 'ts',
      output: false,
      code: `// src/features/auth/useSession.ts
import { useEffect, useState } from 'react';
import { readRefreshToken } from './tokenStorage';
import { refreshAccessToken, fetchMe } from './authService';
import { queryClient } from '@/services/queryClient';
import { setAccessToken } from './tokenStorage';

type SessionState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'authenticated'; user: { id: string; name: string; email: string } };

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const refresh = await readRefreshToken();
        if (!refresh) throw new Error('no refresh token');
        await refreshAccessToken();
        const user = await fetchMe();
        if (!cancelled) setState({ status: 'authenticated', user });
      } catch {
        setAccessToken(null);
        queryClient.clear();
        if (!cancelled) setState({ status: 'guest' });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}`,
      explain: [
        'Bootstrap harus idempoten dan boleh gagal tanpa crash. Pengguna tanpa jaringan diperlakukan sebagai guest sampai refresh berhasil.',
        '<code>cancelled</code> mencegah setState setelah komponen dilepas.',
        'Untuk aplikasi dengan mode offline, pertimbangkan sesi "terbatas": pengguna bisa melihat data lokal tetapi tidak bisa sinkron sampai login diverifikasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menyimpan Rahasia di Tempat yang Salah',
      text: 'AsyncStorage, MMKV tanpa enkripsi, dan file biasa bukan tempat refresh token. Jangan menaruh client secret OAuth di aplikasi mobile; aplikasi publik tidak bisa menyimpan rahasia. Untuk OAuth gunakan Authorization Code + PKCE lewat <code>expo-auth-session</code>, dan biarkan server menukar code menjadi token. Biometrik hanya membuka akses ke token yang sudah tersimpan; ia bukan pengganti autentikasi server.'
    },
    {
      type: 'tip',
      title: 'Uji Skenario Token yang Tidak Nyaman',
      text: 'Uji refresh token kedaluwarsa, dicabut, dan jaringan mati saat refresh. Uji dua request bersamaan yang sama-sama mendapat 401. Uji logout saat offline. Semua skenario ini harus berakhir di layar login yang jelas, bukan layar putih atau loop request.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat mock API login/refresh (json-server, Mock Service Worker, atau server sederhana) dengan access token kedaluwarsa dalam 30 detik.</li><li>Implementasikan <code>login</code>, <code>refreshAccessToken</code>, dan <code>logout</code> memakai SecureStore.</li><li>Buat dua request bersamaan setelah token kedaluwarsa; pastikan hanya satu request refresh yang berjalan.</li><li>Uji logout saat offline dan pastikan token lokal terhapus.</li><li>Tambahkan biometrik sebagai pembuka aplikasi (opsional), bukan sebagai login ke server.</li></ol><p><b>Checkpoint:</b> tidak ada token di AsyncStorage, refresh tidak berulang tanpa henti, dan logout membersihkan cache serta data pribadi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Access token', 'Token berumur pendek untuk mengakses API.'],
        ['Refresh token', 'Token berumur panjang untuk mendapatkan access token baru.'],
        ['SecureStore', 'API Expo untuk menyimpan data rahasia di Keychain/Keystore.'],
        ['Single-flight', 'Memastikan hanya satu operasi async berjalan untuk permintaan yang sama.'],
        ['Token rotation', 'Mengganti refresh token lama dengan yang baru setelah dipakai.'],
        ['401 Unauthorized', 'Belum terautentikasi atau token tidak valid.'],
        ['403 Forbidden', 'Sudah terautentikasi tetapi tidak memiliki izin.'],
        ['Session bootstrap', 'Proses memulihkan sesi saat aplikasi dibuka.'],
        ['PKCE', 'Pengaman OAuth untuk aplikasi publik tanpa client secret.'],
        ['Biometric gate', 'Membuka aplikasi dengan sidik jari/wajah, bukan autentikasi server.'],
        ['Token revocation', 'Pencabutan token di server agar tidak bisa dipakai lagi.'],
        ['Cache clearing', 'Menghapus data sensitif dari cache saat logout.']
      ]
    }
  ],
  recap: [
    'Access token pendek di memori; refresh token panjang di SecureStore.',
    'Refresh harus single-flight dan dirotasi; retry 401 hanya sekali.',
    '403 bukan alasan untuk refresh token.',
    'Logout membersihkan token, cache, dan store pribadi meskipun offline.',
    'Biometrik dan OAuth punya aturan keamanan sendiri; jangan menyimpan client secret di aplikasi.'
  ]
});
