/* ============================================================
   Pelajaran React Native — Bab 3: Core Components dan Interaksi
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-core-components',
  title: 'Core Components: Menyusun Layar yang Hidup',
  chapter: 'Fondasi & Persiapan',
  duration: '24 menit',
  intro: [
    'Di web kamu memakai <code>div</code>, <code>p</code>, dan <code>input</code>. Di React Native kamu memakai <code>View</code>, <code>Text</code>, dan <code>TextInput</code>. Namanya berbeda karena yang dirender adalah komponen native, bukan elemen HTML.',
    'Bab ini membahas komponen inti yang akan muncul di hampir setiap layar: wadah, teks, gambar, input, tombol, daftar, modal, indikator, dan keyboard. Fokusnya bukan menghafal props, tetapi memilih komponen yang tepat dan menangani keadaan kosong, memuat, serta gagal.',
    'Kita akan membangun layar <b>Daftar Pengeluaran</b> untuk Kantong dengan data contoh. Layar ini akan dipakai kembali di bab navigasi, API, dan database.'
  ],
  objectives: [
    'Memilih View, Text, Image, TextInput, dan Pressable sesuai peran',
    'Membedakan ScrollView, FlatList, dan SectionList',
    'Menangani state kosong, memuat, dan gagal pada daftar',
    'Mengelola input terkontrol dan keyboard dengan benar',
    'Menghindari kesalahan umum seperti teks di luar komponen Text'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Komponen Inti dalam Satu Tabel</h3><table class="vocab"><tr><th>Komponen</th><th>Dipakai untuk</th><th>Catatan penting</th></tr><tr><td><code>View</code></td><td>Wadah layout</td><td>Tidak bisa menampilkan teks langsung</td></tr><tr><td><code>Text</code></td><td>Semua teks</td><td>Teks wajib berada di dalam <code>Text</code></td></tr><tr><td><code>Image</code></td><td>Gambar lokal atau jaringan</td><td>Butuh <code>width</code>/<code>height</code> atau style</td></tr><tr><td><code>TextInput</code></td><td>Input pengguna</td><td>Gunakan <code>value</code> + <code>onChangeText</code></td></tr><tr><td><code>Pressable</code></td><td>Area sentuh fleksibel</td><td>Beri <code>accessibilityRole="button"</code></td></tr><tr><td><code>Button</code></td><td>Tombol bawaan sederhana</td><td>Gaya terbatas; sering diganti Pressable</td></tr><tr><td><code>ScrollView</code></td><td>Konten pendek yang bisa digulir</td><td>Merender semua anak sekaligus</td></tr><tr><td><code>FlatList</code></td><td>Daftar panjang</td><td>Memakai virtualisasi</td></tr><tr><td><code>SectionList</code></td><td>Daftar berkelompok</td><td>Cocok untuk data per kategori/bulan</td></tr><tr><td><code>Modal</code></td><td>Dialog atau sheet sederhana</td><td>Perhatikan tombol back Android</td></tr><tr><td><code>ActivityIndicator</code></td><td>Indikator memuat</td><td>Beri label aksesibilitas</td></tr><tr><td><code>Switch</code></td><td>Pilihan on/off</td><td>Gunakan <code>value</code> + <code>onValueChange</code></td></tr></table>'
    },
    {
      type: 'warn',
      title: 'Teks Harus Berada di Dalam Text',
      text: 'Menulis <code>&lt;View&gt;Halo&lt;/View&gt;</code> akan gagal di React Native. Aturan ini berlaku juga untuk spasi dan tanda baca di antara komponen. Bila perlu menyusun teks dan ikon, bungkus semuanya dalam <code>&lt;Text&gt;</code> atau letakkan ikon sebagai komponen terpisah dengan ukuran yang jelas.'
    },
    {
      type: 'example',
      title: 'Layar daftar pengeluaran',
      lang: 'tsx',
      output: false,
      code: `// app/(tabs)/expenses.tsx
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Expense } from '@/types/domain';
import { formatRupiah } from '@/utils/format';

const CONTOH: Expense[] = [
  { id: '1', amount: 25000, note: 'Kopi dan roti', categoryId: 'food',
    spentAt: '2026-11-01T08:15:00.000Z', syncState: 'synced' },
  { id: '2', amount: 18000, note: 'Ojek ke kantor', categoryId: 'transport',
    spentAt: '2026-11-01T09:10:00.000Z', syncState: 'pending' },
];

export default function ExpensesScreen() {
  const [items, setItems] = useState<Expense[]>(CONTOH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      // Nanti diganti pemanggilan API/database pada Bab 7–11.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setItems(CONTOH);
    } catch {
      setError('Daftar pengeluaran gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.muted}>Memuat pengeluaran…</Text>
      </SafeAreaView>
    );
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retry} onPress={refresh}>
          <Text style={styles.retryText}>Coba lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pengeluaran</Text>
        <Text style={styles.total}>
          {formatRupiah(items.reduce((sum, item) => sum + item.amount, 0))}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Belum ada pengeluaran</Text>
            <Text style={styles.muted}>
              Catat pengeluaran pertamamu hari ini.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={\`\${item.note}, \${formatRupiah(item.amount)}\`}
            onPress={() => console.log('buka detail', item.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text style={styles.note}>{item.note}</Text>
              <Text style={styles.meta}>
                {new Date(item.spentAt).toLocaleDateString('id-ID')} ·{' '}
                {item.categoryId}
              </Text>
            </View>
            <Text style={styles.amount}>{formatRupiah(item.amount)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  total: { fontSize: 20, color: '#0F766E', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowText: { flex: 1, paddingRight: 12 },
  note: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  meta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0' },
  pressed: { opacity: 0.6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
  muted: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  error: { fontSize: 15, color: '#B91C1C', textAlign: 'center' },
  retry: { backgroundColor: '#0F766E', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});`,
      explain: [
        'Satu layar menangani empat keadaan: memuat, gagal, kosong, dan berisi. Ini pola yang akan diulang di semua fitur.',
        '<code>FlatList</code> hanya merender item yang terlihat. Jangan menggantinya dengan <code>ScrollView</code> berisi <code>items.map()</code> untuk daftar panjang.',
        '<code>keyExtractor</code> harus stabil. Memakai indeks array menyebabkan baris salah animasi dan salah identitas saat data berubah.',
        'Fungsi <code>renderItem</code> sebaiknya didefinisikan di luar komponen atau dibungkus <code>useCallback</code> bila daftar sangat besar. Kita akan membahas performa di Bab 16.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Input Terkontrol dan Keyboard</h3><p><code>TextInput</code> menyimpan teks di state React melalui <code>value</code> dan <code>onChangeText</code>. Untuk formulir pendek ini cukup. Untuk formulir kompleks, Bab 12 memakai React Hook Form agar setiap ketukan tidak merender seluruh layar.</p><p>Di iOS, keyboard menutupi input bawah. Bungkus layar dengan <code>KeyboardAvoidingView</code> dengan <code>behavior="padding"</code>, lalu gunakan <code>keyboardShouldPersistTaps="handled"</code> pada daftar agar tombol tetap bisa ditekan saat keyboard terbuka.</p>'
    },
    {
      type: 'example',
      title: 'Input nominal dengan format dan validasi sederhana',
      lang: 'tsx',
      output: false,
      code: `import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

export function AmountInput() {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  const value = Number.parseInt(raw.replace(/\\D/g, ''), 10) || 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ padding: 20, gap: 8 }}>
        <Text>Nominal</Text>
        <TextInput
          value={raw}
          onChangeText={(text) => {
            setRaw(text);
            setError('');
          }}
          placeholder="0"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={12}
          accessibilityLabel="Nominal pengeluaran dalam rupiah"
          style={{
            borderWidth: 1,
            borderColor: error ? '#B91C1C' : '#CBD5E1',
            borderRadius: 10,
            padding: 12,
            fontSize: 18,
          }}
        />
        <Text style={{ color: '#64748B' }}>
          Terbaca: {new Intl.NumberFormat('id-ID').format(value)}
        </Text>
        {error ? <Text style={{ color: '#B91C1C' }}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}`,
      explain: [
        '<code>keyboardType="number-pad"</code> memunculkan keyboard angka. Selalu bersihkan karakter non-digit karena pengguna masih bisa menempel teks.',
        '<code>inputMode</code> membantu aksesibilitas dan konsistensi lintas platform. Jangan mengandalkan keyboard untuk validasi.',
        'Pesan error ditempatkan dekat input, bukan hanya lewat <code>Alert</code>. Pengguna harus tahu bagian mana yang salah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>ScrollView, FlatList, atau SectionList?</h3><ul><li><b>ScrollView</b> untuk konten pendek dan campuran: halaman profil, formulir, detail artikel.</li><li><b>FlatList</b> untuk daftar datar yang panjang: pengeluaran, produk, pesan.</li><li><b>SectionList</b> untuk data berkelompok: pengeluaran per bulan, menu per kategori.</li></ul><p>Jangan menaruh <code>FlatList</code> di dalam <code>ScrollView</code> dengan arah gulir yang sama; virtualisasi akan rusak dan muncul peringatan. Bila perlu header yang ikut menggulir, gunakan <code>ListHeaderComponent</code> pada FlatList.</p>'
    },
    {
      type: 'example',
      title: 'SectionList pengeluaran per bulan',
      lang: 'tsx',
      output: false,
      code: `import { SectionList, Text, View } from 'react-native';
import type { Expense } from '@/types/domain';
import { formatRupiah } from '@/utils/format';

type Section = { title: string; total: number; data: Expense[] };

export function ExpenseSections({ sections }: { sections: Section[] }) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingVertical: 8, backgroundColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '700' }}>{section.title}</Text>
          <Text style={{ color: '#64748B' }}>
            Total {formatRupiah(section.total)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Text style={{ paddingVertical: 10 }}>
          {item.note} — {formatRupiah(item.amount)}
        </Text>
      )}
      stickySectionHeadersEnabled
    />
  );
}`,
      explain: [
        'Section header dapat menampilkan ringkasan yang tidak ada di setiap item, misalnya total bulanan.',
        '<code>stickySectionHeadersEnabled</code> membantu pengguna tetap tahu sedang melihat bulan apa saat menggulir.',
        'Pastikan setiap section memiliki <code>data</code> array, meskipun kosong, agar SectionList tidak error.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan Pressable yang Ramah Pengguna',
      text: 'Beri area sentuh minimal 44×44 poin. Gunakan gaya <code>pressed</code> agar ada umpan balik. Tambahkan <code>accessibilityRole="button"</code>, <code>accessibilityLabel</code>, dan <code>hitSlop</code> bila ikon kecil. Jangan membuat tombol dari <code>View</code> + <code>onTouchStart</code>; Pressable sudah menangani fokus, aksesibilitas, dan pembatalan sentuhan.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pindahkan layar di atas ke <code>app/(tabs)/expenses.tsx</code> dan tambahkan tabnya nanti di Bab 6.</li><li>Tambahkan tombol <b>Tambah</b> yang membuka <code>Modal</code> berisi input nominal dan catatan.</li><li>Buat <code>components/common/EmptyState.tsx</code> yang menerima <code>title</code>, <code>description</code>, dan <code>action</code>, lalu pakai di daftar.</li><li>Uji dengan data 0, 3, dan 200 item. Perhatikan apakah daftar tetap lancar dan keadaan kosong tidak muncul saat data sedang dimuat.</li><li>Buka TalkBack/VoiceOver dan pastikan setiap baris terbaca sebagai satu tombol yang bermakna.</li></ol><p><b>Checkpoint:</b> tidak ada teks di luar <code>Text</code>, tidak ada <code>FlatList</code> di dalam <code>ScrollView</code>, dan keempat keadaan layar dapat kamu tunjukkan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['View', 'Wadah layout paling dasar; setara div pada web.'],
        ['Text', 'Komponen untuk semua teks; mendukung nesting dan style.'],
        ['Pressable', 'Area sentuh dengan state pressed, hover, dan fokus.'],
        ['FlatList', 'Daftar virtualisasi untuk data panjang.'],
        ['SectionList', 'Daftar virtualisasi berkelompok dengan header per bagian.'],
        ['ScrollView', 'Wadah gulir yang merender semua anak sekaligus.'],
        ['KeyboardAvoidingView', 'Menggeser konten agar tidak tertutup keyboard.'],
        ['RefreshControl', 'Kontrol tarik-untuk-menyegarkan pada daftar.'],
        ['ListEmptyComponent', 'Komponen yang tampil ketika data daftar kosong.'],
        ['keyExtractor', 'Fungsi yang menghasilkan kunci stabil untuk setiap item.'],
        ['Accessibility label', 'Teks yang dibacakan pembaca layar untuk sebuah elemen.'],
        ['Hit slop', 'Area sentuh tambahan di luar batas visual komponen.']
      ]
    }
  ],
  recap: [
    'View adalah wadah; semua teks harus berada di dalam Text.',
    'FlatList/SectionList dipakai untuk daftar panjang; ScrollView untuk konten pendek.',
    'Setiap layar data perlu menangani keadaan memuat, gagal, kosong, dan berisi.',
    'Input terkontrol memakai value dan onChangeText; keyboard harus diuji di perangkat.',
    'Pressable yang baik memiliki area sentuh cukup dan label aksesibilitas.'
  ]
});
