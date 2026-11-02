/* ============================================================
   Pelajaran React Native — Bab 4: Styling, Flexbox, dan Layout
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-styling-layout',
  title: 'Styling, Flexbox, dan Layout Responsif',
  chapter: 'Fondasi & Persiapan',
  duration: '25 menit',
  intro: [
    'React Native memakai Flexbox, tetapi aturan default-nya berbeda dari web: arah utama adalah <b>kolom</b>, bukan baris. Tidak ada CSS cascade, tidak ada <code>display: grid</code>, dan tidak semua properti CSS tersedia. Memahami perbedaan ini membuat layout terasa mudah, bukan seperti menebak-nebak.',
    'Bab ini menyusun sistem layout Kantong: token warna dan spacing, kartu pengeluaran, form yang aman dari keyboard, serta tampilan yang menyesuaikan ukuran layar dan safe area.',
    'Prinsip utamanya sederhana: <b>layout ditentukan oleh orang tua, bukan anak</b>. Sebelum menambah margin acak, pikirkan siapa yang mengatur lebar, siapa yang mengisi ruang, dan siapa yang boleh menyusut.'
  ],
  objectives: [
    'Menggunakan StyleSheet.create dan token desain secara konsisten',
    'Memahami flex, flexDirection, alignItems, justifyContent, dan gap',
    'Membuat layout responsif dengan useWindowDimensions',
    'Menangani safe area, shadow lintas platform, dan tipografi',
    'Menghindari magic number dan layout yang rusak saat font diperbesar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Flexbox dalam Satu Paragraf</h3><p>Setiap <code>View</code> adalah flex container dengan <code>flexDirection: "column"</code>. <code>justifyContent</code> mengatur distribusi pada sumbu utama (vertikal secara default), <code>alignItems</code> pada sumbu silang (horizontal). <code>flex: 1</code> membuat anak mengisi ruang yang tersedia. <code>gap</code> memberi jarak antar anak tanpa margin yang saling bertabrakan.</p><p>Di web, <code>flex: 1</code> berarti <code>flex-grow: 1; flex-shrink: 1; flex-basis: 0%</code>. Di React Native, <code>flex: 1</code> juga berarti anak boleh tumbuh dan menyusut, dengan basis 0. Bila anak tidak ingin menyusut, set <code>flexShrink: 0</code>.</p>'
    },
    {
      type: 'example',
      title: 'Token desain sebelum komponen',
      lang: 'ts',
      output: false,
      code: `// src/theme/tokens.ts
export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: '#0F766E',
  primaryPressed: '#115E59',
  border: '#E2E8F0',
  danger: '#B91C1C',
  success: '#15803D',
  warning: '#B45309',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
} as const;`,
      explain: [
        'Token mencegah "50 warna abu-abu" yang muncul ketika setiap layar memilih warna sendiri.',
        '<code>as const</code> membuat nilai token bertipe literal, sehingga TypeScript menolak salah ketik nama token.',
        'Line height eksplisit penting untuk teks Indonesia yang panjang. Tanpa itu, teks terasa sesak di beberapa perangkat.'
      ]
    },
    {
      type: 'example',
      title: 'Kartu pengeluaran dengan layout flex',
      lang: 'tsx',
      output: false,
      code: `import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Props = {
  note: string;
  category: string;
  amount: string;
  date: string;
};

export function ExpenseCard({ note, category, amount, date }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{category.slice(0, 1).toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.note} numberOfLines={1} ellipsizeMode="tail">
          {note}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category} · {date}
        </Text>
      </View>

      <Text style={styles.amount} numberOfLines={1}>
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  content: { flex: 1, minWidth: 0 },
  note: { ...typography.body, fontWeight: '600', color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
});`,
      explain: [
        'Ikon dan nominal memakai <code>flexShrink: 0</code> agar tetap utuh. Bagian tengah memakai <code>flex: 1</code> sehingga boleh menyusut dan memotong teks dengan elipsis.',
        '<code>minWidth: 0</code> pada konten membantu perilaku penyusutan teks di beberapa platform. Tanpa ini, teks panjang bisa mendorong nominal keluar layar.',
        '<code>numberOfLines</code> mencegah kartu berubah tinggi drastis ketika catatan pengguna sangat panjang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Responsif Tanpa Breakpoint Berlebihan</h3><p>Mobile bukan web desktop. Kamu tidak perlu lima breakpoint. Yang dibutuhkan biasanya tiga penyesuaian: <b>ponsel kecil</b> (di bawah 360 poin), <b>ponsel biasa</b>, dan <b>tablet/landscape</b> (di atas 700 poin). Gunakan <code>useWindowDimensions</code> agar layout bereaksi saat rotasi atau ukuran jendela berubah.</p><p>Hindari menyimpan ukuran layar di variabel global saat modul dimuat. Ukuran bisa berubah ketika perangkat dirotasi atau aplikasi berjalan di tablet dengan split screen.</p>'
    },
    {
      type: 'example',
      title: 'Dua kolom di tablet, satu kolom di ponsel',
      lang: 'tsx',
      output: false,
      code: `import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { spacing } from '@/theme/tokens';

export function ExpenseGrid({ children }: { children: React.ReactNode[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 2 : 1;

  return (
    <View style={[styles.grid, { gap: spacing.md }]}>
      {children.map((child, index) => (
        <View
          key={index}
          style={{ width: columns === 2 ? '48%' : '100%' }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});`,
      explain: [
        'Di tablet, dua kartu muat berdampingan. Di ponsel, masing-masing mengambil lebar penuh.',
        'Gunakan <code>flexBasis</code> atau persentase dengan <code>gap</code> yang diperhitungkan. Jangan memakai <code>50%</code> plus gap karena totalnya melebihi 100% dan kartu turun ke baris baru.',
        'Untuk daftar panjang, tetap gunakan FlatList dengan <code>numColumns</code>; contoh ini hanya untuk konten pendek.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Safe Area, Status Bar, dan Keyboard</h3><p>Layar modern memiliki notch, dynamic island, dan gesture bar. Jangan menaruh konten penting di area itu. Bungkus layar dengan <code>SafeAreaView</code> dari <code>react-native-safe-area-context</code>, bukan dari <code>react-native</code>. Pilih sisi yang perlu diamankan sesuai desain: layar penuh dengan gambar di belakang status bar mungkin hanya perlu <code>edges={["top"]}</code>.</p><p>Untuk keyboard, gunakan <code>KeyboardAvoidingView</code> di iOS dan atur <code>softwareKeyboardLayoutMode</code> di Android bila perlu. Selalu uji dengan keyboard terbuka, font besar, dan mode gelap.</p>'
    },
    {
      type: 'example',
      title: 'Shadow yang benar di iOS dan Android',
      lang: 'tsx',
      output: false,
      code: `import { Platform, StyleSheet, View } from 'react-native';

export function FloatingCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
});`,
      explain: [
        'iOS memakai <code>shadowColor</code>, <code>shadowOffset</code>, <code>shadowOpacity</code>, dan <code>shadowRadius</code>. Android memakai <code>elevation</code>.',
        'Shadow di Android dipengaruhi warna latar dan tidak bisa diwarnai sesuka hati pada versi lama. Uji di perangkat, bukan hanya emulator.',
        'Jangan memakai bayangan berlebihan pada banyak kartu; secara visual melelahkan dan menambah biaya render.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Memperbaiki Layout dengan Margin Acak',
      text: 'Bila tombol turun atau teks terpotong, periksa dulu: siapa yang memiliki <code>flex</code>, apakah ada <code>flexShrink</code> yang salah, apakah lebar dihitung termasuk padding, dan apakah font scale diperbesar. Menambahkan <code>marginTop: 17</code> hanya akan rusak di perangkat lain. Gunakan token spacing dan uji di layar kecil.'
    },
    {
      type: 'tip',
      title: 'Dukung Ukuran Font Pengguna',
      text: 'Jangan mematikan <code>allowFontScaling</code> untuk seluruh aplikasi. Batasi hanya pada teks dekoratif yang benar-benar tidak boleh membesar. Gunakan <code>maxFontSizeMultiplier</code> pada label tombol bila perlu, dan pastikan layout tidak terpotong saat font diperbesar 200%.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat <code>src/theme/tokens.ts</code> dan ganti semua warna serta spacing di layar pengeluaran dengan token.</li><li>Buat komponen <code>ExpenseCard</code> dan tampilkan 20 data contoh. Uji catatan sepanjang 120 karakter.</li><li>Uji di ponsel kecil (misalnya lebar 320–360), ponsel biasa, dan tablet/landscape. Screenshot ketiganya.</li><li>Aktifkan mode gelap sistem dan catat bagian yang belum terbaca. Perbaikan menyeluruh dilakukan di Bab 14.</li><li>Buka pengaturan aksesibilitas, perbesar font 200%, lalu pastikan tidak ada teks terpotong parah.</li></ol><p><b>Checkpoint:</b> tidak ada nilai warna hex baru di luar token, tidak ada margin horizontal yang bertabrakan dengan safe area, dan kartu tetap rapi saat teks panjang.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Flexbox', 'Model layout satu dimensi yang dipakai React Native.'],
        ['Sumbu utama', 'Arah flexDirection; default kolom pada React Native.'],
        ['flex: 1', 'Anak mengisi ruang tersedia dan boleh menyusut.'],
        ['flexShrink', 'Kemampuan anak menyusut saat ruang tidak cukup.'],
        ['gap', 'Jarak antar anak flex tanpa margin.'],
        ['StyleSheet.create', 'Membuat objek style yang dioptimalkan dan divalidasi.'],
        ['Safe area', 'Area layar yang tidak tertutup notch, status bar, atau gesture bar.'],
        ['useWindowDimensions', 'Hook yang memperbarui ukuran saat layar berubah.'],
        ['Hairline', 'Ketebalan garis terkecil perangkat, cocok untuk separator.'],
        ['Elevation', 'Properti bayangan Android.'],
        ['Font scale', 'Pengaturan ukuran teks sistem pengguna.'],
        ['Magic number', 'Nilai acak tanpa alasan yang membuat layout rapuh.']
      ]
    }
  ],
  recap: [
    'Flexbox React Native default-nya kolom; pahami sumbu utama dan silang.',
    'Token warna, spacing, radius, dan tipografi menjaga konsistensi.',
    'Layout responsif cukup memakai useWindowDimensions dan aturan lebar yang jelas.',
    'Safe area dan keyboard harus diuji di perangkat fisik.',
    'Shadow dan tipografi berbeda antar platform; jangan mengandalkan satu properti untuk keduanya.'
  ]
});
