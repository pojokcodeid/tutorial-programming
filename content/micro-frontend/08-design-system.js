/* ============================================================
   Pelajaran Micro-Frontend — Bab 8: Design System, Token, dan Isolasi Gaya
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-design-system',
  title: 'Design System, Token, dan Isolasi Gaya',
  chapter: 'Kontrak & Data',
  duration: '18 menit',
  intro: [
    'Tiga tim bisa membangun tiga remote yang berbeda, tetapi pengguna tetap harus merasa memakai satu toko. Tombol di katalog, keranjang, dan akun harus punya bentuk, jarak, dan warna yang sama. Di TokoMicro React, kesepakatan itu hidup di <code>packages/ui-kit</code> dan token CSS berawalan <code>--tm-*</code>.',
    'Design system bukan sekadar kumpulan komponen cantik. Ia adalah kontrak visual: nama token, arti token, ukuran jarak, radius, tipografi, dan perilaku tema. Remote boleh punya tata letak sendiri, tetapi tidak boleh menebak warna tombol atau mendefinisikan ulang token global.',
    'Bab ini membahas token terang/gelap, atribut <code>data-theme</code>, hook <code>useTheme</code>, komponen Button/Card/Badge, prefix kelas per remote, CSS Modules, Shadow DOM, dan batas penggunaan Storybook. Di akhir, kamu menambahkan <code>PriceTag</code> beserta story-nya.'
  ],
  objectives: [
    'Menjelaskan token sebagai kontrak visual, bukan variabel hiasan',
    'Menerapkan tema terang dan gelap lewat data-theme serta token --tm-*',
    'Membangun Button, Card, dan Badge yang dipakai bersama di packages/ui-kit',
    'Memilih strategi isolasi gaya: prefix kelas, CSS Modules, atau Shadow DOM',
    'Menambahkan komponen PriceTag beserta story dan memverifikasi build Storybook'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Token adalah Bahasa, Komponen adalah Kalimat</h3><p>Token memberi nama pada keputusan desain: <code>--tm-card</code>, <code>--tm-text</code>, <code>--tm-border</code>, <code>--tm-radius</code>. Remote memakai nama itu, bukan nilai mentah seperti <code>#ffffff</code> atau <code>12px</code>. Ketika tim desain mengubah permukaan gelap, cukup satu tempat yang berubah.</p><p>Bedakan tiga lapis: <b>token primitif</b> (palet mentah), <b>token semantik</b> (surface, text, accent, danger), dan <b>komponen</b> (Button, Card, Badge). Remote sebaiknya hanya menyentuh token semantik. Dengan begitu tema gelap tidak memerlukan penulisan ulang komponen.</p><p><code>packages/ui-kit</code> adalah satu-satunya pemilik komponen dasar. Remote tidak menyalin Button ke folder masing-masing, karena salinan akan cepat berbeda. Yang boleh berbeda adalah komposisi halaman dan gaya khusus remote yang tetap memakai token.</p>'
    },
    {
      type: 'example',
      title: 'Token terang dan gelap',
      lang: 'css',
      output: false,
      code: `/* packages/ui-kit/src/tokens.css */
:root,
[data-theme='light'] {
  --tm-bg: #f5f7fb; --tm-card: #ffffff;
  --tm-text: #1c2333; --tm-text-2: #525a6b;
  --tm-muted: #7b8494; --tm-border: #e3e8f0;
  --tm-accent: #4f46e5; --tm-accent-soft: #eef2ff;
  --tm-green: #16a34a; --tm-red: #dc2626;
  --tm-radius: 12px; --tm-radius-sm: 9px;
  --tm-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --tm-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --tm-shadow: 0 8px 24px rgba(28, 35, 51, 0.08);
}
[data-theme='dark'] {
  --tm-bg: #0f1420; --tm-card: #171e2e;
  --tm-text: #eef2ff; --tm-text-2: #b6c0d4;
  --tm-muted: #8b97ad; --tm-border: #2a3448;
  --tm-accent: #818cf8; --tm-accent-soft: #1e2540;
  --tm-green: #4ade80; --tm-red: #f87171;
  --tm-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}`,
      explain: [
        'Token semantik menyembunyikan nilai mentah. Komponen cukup memakai <code>var(--tm-card)</code> dan otomatis mengikuti tema.',
        '<code>[data-theme="dark"]</code> dipasang pada <code>&lt;html&gt;</code>, sehingga seluruh remote yang berada di halaman ikut berubah.',
        'Jangan menaruh token di dalam selector remote. Satu definisi global mencegah dua remote memberi arti berbeda pada nama token yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Button, Card, dan Badge di ui-kit',
      lang: 'jsx',
      output: false,
      code: `// packages/ui-kit/src/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}
export function Button({
  variant = 'secondary', size = 'md', loading = false,
  className = '', disabled, children, ...rest
}: ButtonProps) {
  const classes = ['tm-btn', variant !== 'secondary' ? 'tm-btn--' + variant : '',
    size !== 'md' ? 'tm-btn--' + size : '', className].filter(Boolean).join(' ');
  return <button className={classes} disabled={disabled || loading} {...rest}>{loading ? '…' : children}</button>;
}
// packages/ui-kit/src/Badge.tsx
interface BadgeProps { children: ReactNode; tone?: string; label?: string; }
export function Badge({ children, tone = 'default', label }: BadgeProps) {
  return <span className={'tm-badge tm-badge--' + tone} aria-label={label}>{children}</span>;
}
// packages/ui-kit/src/Card.tsx
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={'tm-card ' + className}>{children}</section>;
}
// packages/ui-kit/src/tokens.css (potongan)
.tm-btn { border: 1px solid transparent; border-radius: var(--tm-radius-sm); font: inherit; cursor: pointer; }
.tm-btn--primary { background: var(--tm-accent); color: #fff; }
.tm-btn--ghost { background: transparent; border-color: var(--tm-border); color: var(--tm-text); }
.tm-btn:focus-visible { outline: 2px solid var(--tm-accent); outline-offset: 2px; }`,
      explain: [
        'Semua kelas berawalan <code>tm-</code> agar tidak bertabrakan dengan kelas milik remote. Nama komponen dan nama kelas konsisten.',
        'Varian dan ukuran diterjemahkan menjadi kelas, bukan inline style. Remote tidak perlu tahu nilai warna atau padding.',
        '<code>focus-visible</code> disediakan ui-kit supaya aksesibilitas tidak hilang saat tim lain memakai tombol.'
      ]
    },
    {
      type: 'example',
      title: 'Tema lewat useTheme dan data-theme',
      lang: 'jsx',
      output: false,
      code: `// packages/ui-kit/src/theme.ts
import { useCallback, useEffect, useState } from 'react';
export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'tokomicro.theme';
function initialTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage bisa diblokir di mode privat. */
    }
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme((current) => (current === 'light' ? 'dark' : 'light')), []);
  return { theme, toggleTheme };
}
// apps/shell/src/App.tsx — tema masuk ke kontrak
const { theme, toggleTheme } = useTheme();
const ctx = useMemo<AppContext>(() => ({
  /* ...field lain... */
  theme,
  toggleTheme
}), [theme, toggleTheme]);`,
      explain: [
        'Hanya shell yang menulis <code>document.documentElement.dataset.theme</code>. Remote membaca <code>ctx.theme</code> dan meminta perubahan lewat <code>ctx.toggleTheme</code>.',
        '<code>localStorage</code> di sini hanya menyimpan preferensi tampilan, bukan token autentikasi. Token tetap di memori dan cookie httpOnly.',
        'Karena tema ada di <code>AppContext</code>, header dapat menampilkan tombol yang sama untuk semua halaman tanpa remote mengimpor store internal shell.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Isolasi Gaya: Pilih Sesuai Risiko</h3><table class="vocab"><tr><th>Teknik</th><th>Kapan dipakai</th><th>Biaya</th></tr><tr><td>Prefix kelas per remote</td><td>Default untuk semua remote; misalnya <code>.pr-</code>, <code>.ct-</code>, <code>.ak-</code>, <code>.hd-</code>.</td><td>Perlu disiplin dan review.</td></tr><tr><td>CSS Modules</td><td>Komponen internal remote yang tidak perlu diakses dari luar.</td><td>Nama kelas menjadi hash; sulit diuji lewat selector manual.</td></tr><tr><td>Shadow DOM</td><td>Widget legacy atau pihak ketiga yang benar-benar tidak boleh bocor.</td><td>Token, font, portal, dan event harus dijembatani; tidak cocok untuk seluruh halaman.</td></tr><tr><td>UI kit bersama</td><td>Komponen dasar yang harus identik di semua remote.</td><td>Menambah dependensi dan proses rilis paket.</td></tr></table><p>Yang dilarang: reset global di dalam remote (<code>* { box-sizing: ... }</code>), selector elemen seperti <code>button { ... }</code>, dan menimpa <code>.tm-*</code> dari remote. Shell memiliki reset dan token; remote memiliki gaya yang dibatasi pada akar komponennya.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: PriceTag dan story-nya',
      lang: 'jsx',
      output: false,
      code: `// packages/ui-kit/src/PriceTag.tsx
import './price-tag.css';
const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export function PriceTag({ value, size = 'md', strike = false }) {
  return (
    <data
      className={['tm-price', 'tm-price--' + size, strike ? 'tm-price--strike' : ''].filter(Boolean).join(' ')}
      value={value}
    >
      {formatter.format(value)}
    </data>
  );
}
// packages/ui-kit/src/PriceTag.stories.tsx
import { PriceTag } from './PriceTag';
export default {
  title: 'UI Kit/PriceTag',
  component: PriceTag,
  args: { value: 149000, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } }
};
export const Default = {}; export const Large = { args: { value: 1250000, size: 'lg' } };
// Jalankan dan verifikasi
npm run storybook
npm run build`,
      explain: [
        'Story hanya berada di <code>packages/ui-kit</code>. Remote tidak punya Storybook sendiri karena halaman remote diuji lewat e2e komposisi.',
        'Gunakan elemen <code>data</code> dengan atribut <code>value</code> agar harga tetap semantik dan mudah dibaca mesin.',
        'Periksa kedua story dalam tema terang dan gelap. Storybook yang hanya terlihat benar di satu tema belum selesai.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menimpa Token Global dari Remote',
      text: 'Remote yang menulis <code>:root { --tm-accent: red }</code> akan mengubah tombol seluruh aplikasi, termasuk remote lain. Jangan juga memakai <code>!important</code> untuk mengalahkan ui-kit, menyalin nilai hex ke banyak berkas, atau mengandalkan urutan pemuatan CSS. Bila butuh variasi lokal, buat token turunan di akar komponen remote, misalnya <code>.pr-hero { --tm-local-overlay: ... }</code>, dan tetap gunakan token global untuk warna teks serta permukaan. Shadow DOM bukan obat semua masalah: ia memutus pewarisan token dan membuat portal sulit, jadi pakai hanya bila isolasi benar-benar dibutuhkan.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Tema, Kelas, dan Storybook</h3><ol><li>Buka <code>http://localhost:4173</code>, klik tombol tema di header, lalu kunjungi katalog, keranjang, dan akun. Semua permukaan, teks, dan tombol harus berubah tanpa kilatan putih.</li><li>Refresh halaman. Tema pilihan harus bertahan karena disimpan sebagai preferensi tampilan.</li><li>Periksa <code>document.documentElement.dataset.theme</code> di konsol. Nilainya harus <code>light</code> atau <code>dark</code>, bukan kelas acak di setiap remote.</li><li>Cari kelas CSS di DevTools. Kelas remote harus berprefix dan tidak ada aturan global yang menimpa <code>.tm-btn</code>.</li><li>Jalankan <code>npm run storybook</code>, cek story PriceTag di kedua tema, lalu jalankan build Storybook di CI.</li></ol><p>Bila tema hanya berubah di sebagian halaman, cari remote yang menetapkan warna langsung. Bila Storybook gagal build, periksa import CSS dan dependensi React di ui-kit.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Design token', 'Nama untuk keputusan desain seperti warna, jarak, radius, dan tipografi.'],
        ['data-theme', 'Atribut pada elemen html yang memilih kumpulan token tema aktif.'],
        ['useTheme', 'Hook shell untuk membaca dan mengubah tema yang dibagikan lewat AppContext.'],
        ['UI kit', 'Paket komponen dasar bersama, di proyek ini packages/ui-kit.'],
        ['CSS Modules', 'Teknik mengubah nama kelas menjadi unik secara lokal agar tidak bentrok.'],
        ['Shadow DOM', 'Batas DOM dan gaya yang kuat, berguna untuk widget legacy atau pihak ketiga.'],
        ['Namespace kelas', 'Prefix seperti tm- atau pr- untuk menandai pemilik aturan CSS.'],
        ['Storybook', 'Katalog komponen untuk mengembangkan dan memeriksa ui-kit secara terisolasi.']
      ]
    }
  ],
  recap: [
    'Token adalah kontrak visual; remote memakai token semantik, bukan nilai warna mentah.',
    'Tema diterapkan sekali di html lewat data-theme dan dibagikan ke remote melalui AppContext.',
    'Button, Card, dan Badge tinggal di packages/ui-kit; remote tidak menyalin komponen dasar.',
    'Isolasi gaya dimulai dari prefix kelas, lalu CSS Modules, dan Shadow DOM hanya bila perlu.',
    'Storybook hanya untuk ui-kit; komposisi halaman remote diuji dengan e2e dan pemeriksaan tema.'
  ]
});
