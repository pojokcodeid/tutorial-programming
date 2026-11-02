/* ============================================================
   Pelajaran React Native — Bab 14: UI/UX dan Design System
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-ui-design-system',
  title: 'UI/UX Mobile dan Design System yang Dipakai Ulang',
  chapter: 'Kualitas & Performa',
  duration: '30 menit',
  intro: [
    'Aplikasi yang cepat tetapi membingungkan tetap gagal. Pengguna mobile punya perhatian singkat, jari yang tidak selalu tepat, dan sinyal yang tidak stabil. Desain yang baik mengurangi beban kognitif, bukan sekadar mempercantik layar.',
    'Bab ini mengubah token dan komponen dari bab sebelumnya menjadi <b>design system kecil</b> untuk Kantong: tombol dengan varian, input, kartu, state kosong, skeleton, dan tema terang/gelap. Tujuannya bukan membuat library besar, tetapi memastikan setiap layar memakai bahasa visual yang sama.',
    'Kita juga membahas touch target, kontras, loading/empty/error state, dan perbedaan UX Android/iOS yang membuat aplikasi terasa "native".'
  ],
  objectives: [
    'Menerapkan prinsip UI/UX mobile: touch target, hierarki, dan umpan balik',
    'Membangun komponen reusable dengan varian yang konsisten',
    'Menyediakan tema terang/gelap berbasis token',
    'Merancang loading, empty, error, dan skeleton state',
    'Mendokumentasikan komponen agar tim memakainya dengan benar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prinsip yang Paling Terasa di Tangan Pengguna</h3><ul><li><b>Touch target:</b> minimal 44×44 pt iOS, 48×48 dp Android. Ikon kecil tetap boleh terlihat kecil asalkan area sentuhnya cukup.</li><li><b>Hierarki:</b> satu aksi utama per layar. Tombol sekunder jangan bersaing warna dengan tombol utama.</li><li><b>Umpan balik:</b> setiap aksi harus terlihat sedang diproses, berhasil, atau gagal.</li><li><b>Konsistensi:</b> tombol simpan selalu di posisi dan gaya yang sama.</li><li><b>Kontras:</b> teks minimal 4.5:1 terhadap latar untuk ukuran normal.</li><li><b>Platform:</b> hormati gesture back Android dan safe area iOS.</li></ul>'
    },
    {
      type: 'example',
      title: 'Button dengan varian yang terkendali',
      lang: 'tsx',
      output: false,
      code: `// src/components/ui/Button.tsx
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const backgrounds: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  ghost: 'transparent',
  danger: colors.danger,
};

const textColors: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: colors.text,
  ghost: colors.primary,
  danger: '#FFFFFF',
};

const heights: Record<Size, number> = { sm: 40, md: 48, lg: 56 };

export function Button({
  label, variant = 'primary', size = 'md', loading = false,
  disabled, style, ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: heights[size],
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: backgrounds[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style({ pressed } as never) : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={textColors[variant]} /> : null}
      <Text style={{ color: textColors[variant], fontWeight: '700', fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}`,
      explain: [
        'Varian membatasi pilihan warna dan bentuk. Tanpa varian, setiap layar akan membuat tombol sendiri.',
        '<code>accessibilityState</code> memberi tahu pembaca layar bahwa tombol sedang sibuk atau nonaktif.',
        'Ukuran tinggi minimum menjaga touch target. Padding horizontal bisa berubah, tinggi tidak.',
        'Untuk varian ghost, pastikan area sentuh tetap terlihat jelas saat fokus/tekanan.'
      ]
    },
    {
      type: 'example',
      title: 'Theme provider dan mode gelap',
      lang: 'tsx',
      output: false,
      code: `// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from './tokens';

type Theme = { mode: 'light' | 'dark'; colors: ColorTokens };
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const mode = system === 'dark' ? 'dark' : 'light';
  const value = useMemo<Theme>(
    () => ({ mode, colors: mode === 'dark' ? darkColors : lightColors }),
    [mode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return theme;
}

// Pemakaian:
// const { colors } = useTheme();
// <View style={{ backgroundColor: colors.background }} />`,
      explain: [
        'Mode gelap bukan sekadar membalik warna. Pastikan kontras, bayangan, dan gambar tetap terbaca.',
        'Simpan preferensi pengguna (light/dark/system) di store, lalu pilih warna berdasarkan preferensi dan tema sistem.',
        'Jangan memakai <code>useColorScheme</code> langsung di setiap komponen; pusatkan di ThemeProvider agar mudah diuji.'
      ]
    },
    {
      type: 'text',
      html: '<h3>State yang Wajib Ada di Setiap Layar Data</h3><table class="vocab"><tr><th>State</th><th>Tampilan</th><th>Yang harus dihindari</th></tr><tr><td>Loading pertama</td><td>Skeleton atau spinner dengan konteks</td><td>Spinner di tengah layar tanpa teks</td></tr><tr><td>Refreshing</td><td>Pull-to-refresh, data lama tetap terlihat</td><td>Mengosongkan layar</td></tr><tr><td>Empty</td><td>Ilustrasi ringan + penjelasan + aksi</td><td>Hanya "Tidak ada data"</td></tr><tr><td>Error</td><td>Pesan spesifik + coba lagi</td><td>Alert untuk setiap kegagalan</td></tr><tr><td>Offline</td><td>Banner "Mode offline" + data lokal</td><td>Menyembunyikan data yang sudah ada</td></tr><tr><td>Sukses</td><td>Konfirmasi singkat, data diperbarui</td><td>Toast yang menutupi aksi berikutnya</td></tr></table><p>Skeleton harus menyerupai bentuk konten akhir agar transisi tidak mengejutkan. Jangan memakai skeleton untuk loading yang selesai dalam 100 ms; itu hanya membuat layar berkedip.</p>'
    },
    {
      type: 'example',
      title: 'EmptyState yang memberi jalan keluar',
      lang: 'tsx',
      output: false,
      code: `import { View, Text } from 'react-native';
import { Button } from './Button';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: spacing.xl, gap: spacing.md }}>
      <Text style={{ fontSize: 44 }} accessibilityElementsHidden>🗒️</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text,
        textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, color: colors.textMuted,
        textAlign: 'center', lineHeight: 22 }}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}`,
      explain: [
        'Empty state harus menjelaskan mengapa kosong dan apa yang bisa dilakukan.',
        'Emoji dekoratif disembunyikan dari pembaca layar agar tidak mengganggu.',
        'Aksi opsional: layar tanpa data karena filter sebaiknya menawarkan "Hapus filter", bukan "Tambah data".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Bottom Sheet dan Modal</h3><p>Untuk pilihan singkat, bottom sheet terasa lebih natural di mobile daripada modal penuh. Gunakan <code>@gorhom/bottom-sheet</code> bila butuh snap point dan gesture, atau <code>Modal</code> sederhana untuk dialog kecil. Jangan menumpuk tiga modal; bila alurnya panjang, gunakan layar penuh.</p><p>Selalu sediakan tombol tutup yang jelas, dukung tombol back Android, dan jangan mengunci pengguna pada modal yang tidak bisa ditutup saat error.</p>'
    },
    {
      type: 'example',
      title: 'Skeleton sederhana dengan Animated',
      lang: 'tsx',
      output: false,
      code: `import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export function Skeleton({ width = '100%', height = 16 }: {
  width?: number | \`\${number}%\`;
  height?: number;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: 8, backgroundColor: '#CBD5E1', opacity }}
    />
  );
}`,
      explain: [
        'Skeleton diberi label tersembunyi dari pembaca layar; sebagai gantinya sediakan teks status "Memuat data".',
        '<code>useNativeDriver: true</code> membuat animasi opacity berjalan di UI thread, sehingga tidak tersendat saat JS sibuk.',
        'Hormati preferensi reduce motion; bila aktif, tampilkan blok statis tanpa animasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menyalin Desain Web Mentah-Mentah',
      text: 'Hover, tooltip, tabel lebar, dan grid 12 kolom tidak selalu cocok di mobile. Sebaliknya, jangan menghilangkan affordance penting hanya agar terlihat minimalis. Uji desain dengan satu tangan, di bawah sinar matahari, dan dengan koneksi lambat.'
    },
    {
      type: 'tip',
      title: 'Dokumentasikan Komponen di Kode',
      text: 'Setiap komponen UI sebaiknya punya contoh pemakaian dan daftar varian di komentar atau Storybook. Aturan sederhana: jika sebuah komponen dipakai di tiga tempat dengan variasi berbeda, jadikan komponen bersama; jika baru satu tempat, jangan buru-buru mengabstraksi.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat komponen <code>Button</code>, <code>TextField</code>, <code>Card</code>, dan <code>EmptyState</code> dengan token yang sama.</li><li>Terapkan mode gelap dan uji kontras semua teks.</li><li>Ganti layar pengeluaran agar memakai komponen tersebut; hapus style duplikat.</li><li>Tambahkan skeleton saat memuat pertama kali dan pertahankan data lama saat refresh.</li><li>Buat halaman <code>/dev/components</code> yang menampilkan semua varian untuk pemeriksaan cepat.</li></ol><p><b>Checkpoint:</b> tidak ada tombol dengan gaya berbeda tanpa alasan, mode gelap terbaca, dan setiap state data punya tampilan yang disengaja.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Design token', 'Nilai desain dasar seperti warna, spacing, dan tipografi.'],
        ['Design system', 'Kumpulan token, komponen, dan aturan pemakaian yang konsisten.'],
        ['Touch target', 'Area minimum yang nyaman disentuh jari.'],
        ['Hierarchy', 'Urutan kepentingan visual pada layar.'],
        ['Empty state', 'Tampilan saat tidak ada data, disertai penjelasan dan aksi.'],
        ['Skeleton', 'Placeholder berbentuk konten saat data dimuat.'],
        ['Contrast ratio', 'Perbandingan kecerahan teks dan latar untuk keterbacaan.'],
        ['Bottom sheet', 'Panel yang muncul dari bawah dengan snap point.'],
        ['Variant', 'Versi tampilan komponen untuk konteks berbeda.'],
        ['Reduce motion', 'Preferensi pengguna untuk membatasi animasi.'],
        ['Affordance', 'Petunjuk visual bahwa sesuatu bisa dilakukan.'],
        ['Component documentation', 'Contoh dan aturan pemakaian komponen.']
      ]
    }
  ],
  recap: [
    'UI/UX mobile dimulai dari touch target, hierarki, umpan balik, dan kontras.',
    'Design system kecil yang konsisten lebih berguna daripada library besar yang tidak dipakai.',
    'Setiap layar data membutuhkan loading, empty, error, offline, dan success state.',
    'Mode gelap harus diuji, bukan hanya dibalik warnanya.',
    'Dokumentasikan komponen dan jangan mengabstraksi terlalu dini.'
  ]
});
