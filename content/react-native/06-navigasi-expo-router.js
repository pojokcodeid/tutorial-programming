/* ============================================================
   Pelajaran React Native — Bab 6: Navigasi dengan Expo Router
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-navigation',
  title: 'Navigasi dan Routing dengan Expo Router',
  chapter: 'Navigasi & Data',
  duration: '28 menit',
  intro: [
    'Di aplikasi mobile, navigasi bukan sekadar berpindah halaman. Ia menyimpan riwayat, mendukung tombol kembali, deep link, notifikasi, dan alur autentikasi. Expo Router memakai <b>file-based routing</b>: struktur folder di dalam <code>app/</code> menjadi URL aplikasi.',
    'Bab ini membangun kerangka navigasi Kantong: grup autentikasi, tab utama, detail pengeluaran dinamis, modal, dan rute yang dilindungi. Kita juga membahas kesalahan yang paling sering membuat aplikasi terjebak di layar kosong atau redirect tanpa henti.',
    'Kamu tidak perlu menghafal seluruh API. Yang perlu dipegang adalah pembagian: <code>_layout</code> mengatur kerangka, folder mengatur URL, dan parameter mengatur data yang dibawa.'
  ],
  objectives: [
    'Membuat Stack, Tabs, dan nested layout dengan Expo Router',
    'Menggunakan dynamic route dan query parameter bertipe',
    'Menerapkan protected route tanpa redirect loop',
    'Membuka modal dan menangani tombol kembali',
    'Menguji deep link dan typed routes'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Rute Kantong</h3><table class="vocab"><tr><th>Berkas</th><th>URL</th><th>Peran</th></tr><tr><td><code>app/_layout.tsx</code></td><td>—</td><td>Provider global, Stack akar</td></tr><tr><td><code>app/(auth)/login.tsx</code></td><td>/login</td><td>Masuk</td></tr><tr><td><code>app/(auth)/register.tsx</code></td><td>/register</td><td>Daftar</td></tr><tr><td><code>app/(tabs)/_layout.tsx</code></td><td>—</td><td>Kerangka tab</td></tr><tr><td><code>app/(tabs)/index.tsx</code></td><td>/</td><td>Beranda</td></tr><tr><td><code>app/(tabs)/expenses.tsx</code></td><td>/expenses</td><td>Daftar pengeluaran</td></tr><tr><td><code>app/expense/[id].tsx</code></td><td>/expense/123</td><td>Detail dinamis</td></tr><tr><td><code>app/expense/new.tsx</code></td><td>/expense/new</td><td>Form (modal)</td></tr><tr><td><code>app/+not-found.tsx</code></td><td>*</td><td>Halaman 404</td></tr></table><p>Tanda kurung pada <code>(auth)</code> dan <code>(tabs)</code> adalah <b>route group</b>: tidak muncul di URL, tetapi mengelompokkan layout. Ini menjaga URL tetap bersih sambil memisahkan alur.</p>'
    },
    {
      type: 'example',
      title: 'Root layout dan provider',
      lang: 'tsx',
      output: false,
      code: `// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="expense/new"
            options={{ presentation: 'modal', headerShown: true,
              title: 'Pengeluaran Baru' }}
          />
          <Stack.Screen
            name="expense/[id]"
            options={{ headerShown: true, title: 'Detail' }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}`,
      explain: [
        'Root layout hanya berisi provider dan konfigurasi navigasi. Jangan menaruh logika bisnis di sini.',
        '<code>presentation: "modal"</code> membuat form muncul dari bawah pada iOS dan memberi perilaku modal yang sesuai di Android.',
        'Urutan <code>Stack.Screen</code> tidak menentukan URL; folder dan nama berkas yang menentukannya.'
      ]
    },
    {
      type: 'example',
      title: 'Tabs dengan ikon dan badge',
      lang: 'tsx',
      output: false,
      code: `// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Pengeluaran',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>▤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>◯</Text>
          ),
        }}
      />
    </Tabs>
  );
}`,
      explain: [
        'Ikon di sini memakai teks agar contoh tidak bergantung pada library ikon. Di proyek nyata gunakan ikon vektor yang konsisten.',
        '<code>tabBarActiveTintColor</code> harus memenuhi kontras dengan latar tab, termasuk di mode gelap.',
        'Setiap rute di dalam folder <code>(tabs)</code> otomatis menjadi tab. Untuk layar yang tidak boleh menjadi tab, letakkan di luar grup.'
      ]
    },
    {
      type: 'example',
      title: 'Detail dinamis dan navigasi bertipe',
      lang: 'tsx',
      output: false,
      code: `// app/expense/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useExpense } from '@/features/expenses/hooks/useExpense';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useExpense(id);

  if (isLoading) return <ActivityIndicator />;
  if (isError || !data) return <Text>Pengeluaran tidak ditemukan.</Text>;

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>{data.note}</Text>
      <Text>{data.amount}</Text>
      <Text onPress={() => router.back()}>Kembali</Text>
    </View>
  );
}

// Dari daftar:
// router.push({ pathname: '/expense/[id]', params: { id: item.id } });`,
      explain: [
        '<code>useLocalSearchParams</code> membaca parameter URL. Parameter selalu berupa string; ubah ke angka/ID dengan validasi sebelum dipakai.',
        'Gunakan bentuk objek <code>pathname</code> + <code>params</code> agar typed routes memeriksa nama rute dan parameternya.',
        '<code>router.back()</code> lebih tepat daripada <code>router.push("/expenses")</code> karena menjaga riwayat dan posisi gulir.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Protected Route Tanpa Redirect Loop</h3><p>Alur autentikasi harus menunggu status sesi selesai dibaca dari penyimpanan. Bila kamu langsung mengalihkan ke <code>/login</code> saat <code>isLoading</code> masih <code>true</code>, pengguna yang sudah masuk akan terlempar keluar setiap kali aplikasi dibuka.</p><p>Aturan praktisnya: <b>jangan melakukan navigasi saat render</b>. Gunakan <code>useEffect</code> atau komponen guard yang menampilkan splash selama status belum diketahui. Setelah login, arahkan ke halaman yang diminta lewat parameter <code>next</code>, bukan selalu ke beranda.</p>'
    },
    {
      type: 'example',
      title: 'Guard autentikasi yang sabar',
      lang: 'tsx',
      output: false,
      code: `// app/_layout.tsx (bagian dalam)
import { useEffect } from 'react';
import { SplashScreen, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/features/auth/useSession';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession(); // 'loading' | 'authenticated' | 'guest'
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'guest' && !inAuthGroup) {
      router.replace('/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/');
    }
  }, [status, segments, router]);

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') return null;
  return <>{children}</>;
}`,
      explain: [
        'Selama status <code>loading</code>, aplikasi menampilkan splash dan tidak mengalihkan ke mana pun.',
        'Effect bergantung pada <code>status</code>, <code>segments</code>, dan <code>router</code>; perubahan salah satunya memicu pemeriksaan ulang.',
        'Untuk kasus yang lebih kompleks, Expo Router versi baru menyediakan <code>Stack.Protected</code>. Prinsipnya sama: status harus diketahui sebelum keputusan navigasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Tiga Penyebab Layar Kosong atau Redirect Berulang',
      text: '<b>Pertama</b>, layout tidak mengembalikan <code>&lt;Slot /&gt;</code> atau <code>&lt;Stack /&gt;</code>, sehingga anak tidak pernah dirender. <b>Kedua</b>, guard mengalihkan saat status sesi masih loading. <b>Ketiga</b>, dua router dipasang bersamaan (misalnya Expo Router dan React Navigation root). Periksa urutan layout dan pastikan hanya satu sistem navigasi yang menjadi akar.'
    },
    {
      type: 'tip',
      title: 'Deep Link yang Bisa Diuji',
      text: 'Dengan scheme <code>kantong</code>, jalankan <code>npx uri-scheme open "kantong://expense/123" --android</code> atau <code>--ios</code>. Untuk notifikasi, kirim data yang sama dan arahkan lewat router setelah aplikasi siap. Uji juga saat aplikasi tertutup, di latar belakang, dan sudah terbuka.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat grup <code>(auth)</code>, <code>(tabs)</code>, dan rute <code>expense/[id].tsx</code> sesuai peta di atas.</li><li>Tambahkan tombol <b>Tambah</b> yang membuka <code>/expense/new</code> sebagai modal. Setelah simpan, tutup modal dan kembali ke daftar.</li><li>Buat guard sementara yang menganggap pengguna belum login, lalu ubah status secara manual untuk menguji kedua alur.</li><li>Uji deep link <code>kantong://expense/123</code> ketika aplikasi tertutup.</li><li>Tekan tombol back Android dari detail dan dari modal; pastikan hasilnya sesuai harapan.</li></ol><p><b>Checkpoint:</b> tidak ada redirect loop, deep link membuka layar yang benar, dan kamu bisa menjelaskan perbedaan <code>push</code>, <code>replace</code>, dan <code>back</code>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Expo Router', 'Router berbasis berkas untuk React Native dan web.'],
        ['Route group', 'Folder dalam tanda kurung yang tidak muncul di URL.'],
        ['_layout.tsx', 'Berkas yang mendefinisikan kerangka navigasi untuk folder.'],
        ['Dynamic route', 'Rute dengan segmen variabel, misalnya [id].tsx.'],
        ['useLocalSearchParams', 'Hook untuk membaca parameter rute saat ini.'],
        ['router.push', 'Menambah layar baru ke riwayat navigasi.'],
        ['router.replace', 'Mengganti layar saat ini tanpa menambah riwayat.'],
        ['Deep link', 'URL yang membuka layar tertentu di dalam aplikasi.'],
        ['Typed routes', 'Tipe otomatis untuk nama dan parameter rute.'],
        ['Modal presentation', 'Gaya tampilan layar yang muncul seperti dialog/sheet.'],
        ['Auth guard', 'Logika yang mencegah akses ke rute terlindungi.'],
        ['SplashScreen', 'Layar pembuka yang ditahan sampai aplikasi siap.']
      ]
    }
  ],
  recap: [
    'Folder di app/ menentukan URL; _layout menentukan kerangka navigasi.',
    'Route group menyembunyikan folder dari URL dan memisahkan alur.',
    'Parameter dinamis selalu string dan harus divalidasi sebelum dipakai.',
    'Protected route harus menunggu status sesi selesai dimuat.',
    'push, replace, dan back memiliki efek berbeda pada riwayat dan pengalaman pengguna.'
  ]
});
