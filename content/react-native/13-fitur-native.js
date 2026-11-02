/* ============================================================
   Pelajaran React Native — Bab 13: Fitur Perangkat Native
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-native-features',
  title: 'Kamera, Lokasi, Notifikasi, dan Fitur Perangkat',
  chapter: 'Data & Perangkat',
  duration: '31 menit',
  intro: [
    'Di sinilah aplikasi mobile terasa berbeda dari web: kamera, GPS, notifikasi, getaran, dan berbagi ke aplikasi lain. Expo menyediakan modul untuk semuanya, tetapi setiap fitur membawa izin, batasan platform, dan tanggung jawab privasi.',
    'Bab ini menambahkan tiga fitur ke Kantong: foto struk, lokasi pengeluaran, dan pengingat harian. Kita juga menyinggung peta, clipboard, haptic, share, barcode, dan kontak secukupnya agar kamu tahu kapan dan bagaimana memakainya.',
    'Aturan utamanya: <b>minta izin saat fitur dipakai</b>, jelaskan manfaatnya, dan siapkan jalan keluar bila pengguna menolak. Aplikasi harus tetap berguna tanpa izin opsional.'
  ],
  objectives: [
    'Memakai kamera/image picker dan menyimpan berkas dengan benar',
    'Mengambil lokasi dengan akurasi dan timeout yang terkendali',
    'Mengirim notifikasi lokal dan memahami batasan push notification',
    'Menggunakan clipboard, haptic, share, dan barcode sesuai kebutuhan',
    'Menangani izin ditolak dan pengaturan perangkat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Modul Expo untuk Fitur Perangkat</h3><table class="vocab"><tr><th>Kebutuhan</th><th>Paket</th><th>Izin/konfigurasi</th></tr><tr><td>Kamera & galeri</td><td><code>expo-image-picker</code>, <code>expo-camera</code></td><td>Kamera, galeri (iOS infoPlist)</td></tr><tr><td>Lokasi</td><td><code>expo-location</code></td><td>Foreground/background location</td></tr><tr><td>Peta</td><td><code>react-native-maps</code></td><td>API key untuk provider tertentu</td></tr><tr><td>Notifikasi lokal</td><td><code>expo-notifications</code></td><td>Izin notifikasi (Android 13+)</td></tr><tr><td>Push notification</td><td><code>expo-notifications</code> + server</td><td>Project ID, token perangkat</td></tr><tr><td>Clipboard</td><td><code>expo-clipboard</code></td><td>Tidak ada izin khusus</td></tr><tr><td>Getaran</td><td><code>expo-haptics</code></td><td>Tidak ada izin khusus</td></tr><tr><td>Berbagi</td><td><code>expo-sharing</code>, <code>Share</code></td><td>Tidak ada izin khusus</td></tr><tr><td>Barcode</td><td><code>expo-camera</code></td><td>Kamera</td></tr><tr><td>Kontak</td><td><code>expo-contacts</code></td><td>Kontak (sangat sensitif)</td></tr></table><p>Pasang dengan <code>npx expo install</code> agar versi cocok dengan SDK proyek.</p>'
    },
    {
      type: 'example',
      title: 'Mengambil lokasi dengan izin dan timeout',
      lang: 'ts',
      output: false,
      code: `// src/features/expenses/useLocation.ts
import * as Location from 'expo-location';
import { useState } from 'react';

type Coords = { latitude: number; longitude: number };

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(): Promise<Coords | null> {
    setLoading(true);
    setError(null);

    try {
      const services = await Location.hasServicesEnabledAsync();
      if (!services) {
        setError('Layanan lokasi perangkat sedang mati.');
        return null;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('Izin lokasi ditolak. Kamu tetap bisa menyimpan tanpa lokasi.');
        return null;
      }

      const last = await Location.getLastKnownPositionAsync({
        maxAge: 60_000,
      });
      if (last) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        };
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });

      return {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
    } catch {
      setError('Lokasi tidak dapat diambil. Coba lagi di area terbuka.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { request, loading, error };
}`,
      explain: [
        '<code>getLastKnownPositionAsync</code> cepat dan sering cukup untuk menandai lokasi pengeluaran. Jika terlalu tua, ambil posisi baru.',
        '<code>Accuracy.Balanced</code> menghemat baterai. Jangan memakai akurasi tertinggi untuk fitur yang tidak membutuhkannya.',
        'Penolakan izin bukan akhir dunia. Pengeluaran tetap bisa disimpan tanpa koordinat.',
        'Background location membutuhkan izin terpisah, penjelasan di App Store, dan alasan yang sangat kuat. Jangan memintanya untuk fitur yang hanya dipakai saat layar terbuka.'
      ]
    },
    {
      type: 'example',
      title: 'Notifikasi lokal pengingat harian',
      lang: 'ts',
      output: false,
      code: `// src/features/reminders/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }

  if (status !== 'granted') {
    return { ok: false as const, reason: 'permission' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pengingat',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: 'Sudah mencatat hari ini?',
      body: 'Luangkan satu menit untuk mencatat pengeluaranmu.',
      data: { route: '/expense/new' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'reminders',
    },
  });

  return { ok: true as const };
}`,
      explain: [
        '<code>setNotificationHandler</code> menentukan apakah notifikasi tampil saat aplikasi di depan. Di iOS, banner foreground harus diizinkan eksplisit.',
        'Channel Android diperlukan untuk perilaku dan suara notifikasi. Tanpa channel, notifikasi bisa tidak tampil sesuai harapan.',
        'Identifier tetap memudahkan pembatalan dan penggantian jadwal tanpa membuat notifikasi ganda.',
        'Notifikasi lokal dijadwalkan perangkat. Push notification membutuhkan token perangkat dan server pengirim; keduanya berbeda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kamera, Galeri, dan Penyimpanan Foto</h3><p>Gunakan <code>expo-image-picker</code> untuk memilih foto dan <code>expo-camera</code> bila perlu pratinjau kamera kustom. Setelah foto diambil, salin ke direktori aplikasi agar tidak hilang ketika cache dibersihkan. Simpan <b>path relatif</b> di database, bukan URI absolut yang bisa berubah setelah update aplikasi.</p><p>Kompres gambar sebelum upload. Untuk struk, lebar 1080 px biasanya cukup. Jangan menyimpan foto asli 12 MP di perangkat tanpa alasan.</p>'
    },
    {
      type: 'example',
      title: 'Menyimpan foto ke direktori aplikasi',
      lang: 'ts',
      output: false,
      code: `import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

export async function pickAndPersistReceipt() {
  const picked = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
  });
  if (picked.canceled) return null;

  const asset = picked.assets[0];
  const folder = \`\${FileSystem.documentDirectory}receipts/\`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

  const filename = \`\${Date.now()}.jpg\`;
  const destination = \`\${folder}\${filename}\`;
  await FileSystem.copyAsync({ from: asset.uri, to: destination });

  return { filename, uri: destination };
}`,
      explain: [
        'Contoh memakai <code>expo-file-system/legacy</code> yang masih tersedia dan stabil. Versi baru menawarkan API <code>File</code>/<code>Directory</code>; periksa dokumentasi SDK yang kamu pakai sebelum mencampur keduanya.',
        'Simpan <code>filename</code> di database dan bangun URI saat dibutuhkan. Ini membuat data tetap valid setelah aplikasi diperbarui.',
        'Bersihkan foto lama saat pengeluaran dihapus agar penyimpanan tidak membengkak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Fitur Kecil yang Berdampak Besar</h3><ul><li><b>Clipboard:</b> salin ID transaksi atau tautan. Jangan membaca clipboard tanpa alasan; iOS menampilkan pemberitahuan privasi.</li><li><b>Haptic:</b> getaran halus saat simpan berhasil atau tombol penting ditekan. Jangan memakai untuk setiap sentuhan.</li><li><b>Share:</b> bagikan ringkasan pengeluaran sebagai teks atau berkas CSV.</li><li><b>Barcode:</b> pindai struk/QR untuk mengisi data. Selalu validasi hasil pindai.</li><li><b>Contacts:</b> hanya bila fitur benar-benar membutuhkan; jelaskan sebelum meminta izin.</li></ul>'
    },
    {
      type: 'example',
      title: 'Haptic dan share ringkasan',
      lang: 'ts',
      output: false,
      code: `import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

export async function onExpenseSaved() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function shareSummary(text: string) {
  await Share.share({
    message: text,
    title: 'Ringkasan pengeluaran Kantong',
  });
}

export async function shareFile(uri: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Berbagi berkas tidak tersedia di perangkat ini.');
  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Bagikan laporan',
  });
}`,
      explain: [
        'Haptic sukses membantu konfirmasi tanpa harus membaca layar, tetapi tetap sediakan umpan balik visual.',
        '<code>Share</code> bawaan React Native cocok untuk teks. <code>expo-sharing</code> dipakai untuk berkas.',
        'Selalu periksa ketersediaan fitur sebelum memakainya, terutama di emulator dan perangkat lama.'
      ]
    },
    {
      type: 'warn',
      title: 'Izin dan Kebijakan Toko Aplikasi',
      text: 'Setiap izin harus dijelaskan di <code>app.json</code> (iOS <code>infoPlist</code>) dan memiliki alasan yang terlihat oleh pengguna. Aplikasi yang meminta lokasi latar belakang, kontak, atau akses foto penuh tanpa alasan jelas sering ditolak reviewer. Uji di build nyata: Expo Go tidak selalu mencerminkan dialog izin dan konfigurasi aplikasi.'
    },
    {
      type: 'tip',
      title: 'Buat Fitur Tetap Berguna Tanpa Izin',
      text: 'Kantong harus bisa mencatat pengeluaran tanpa kamera, lokasi, atau notifikasi. Jadikan fitur tersebut opsional dan beri tombol "Aktifkan nanti" di pengaturan. Ini meningkatkan retensi dan mengurangi penolakan izin yang tidak perlu.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Tambahkan tombol <b>Lampirkan struk</b> dan <b>Tandai lokasi</b> di form pengeluaran.</li><li>Uji penolakan izin kamera dan lokasi; pastikan form tetap bisa disimpan.</li><li>Buat pengingat harian pukul 20.00 dan uji di perangkat fisik.</li><li>Tambahkan tombol share ringkasan teks ke aplikasi lain.</li><li>Uji semua fitur di Android dan iOS. Catat perbedaan dialog izin dan perilaku notifikasi.</li></ol><p><b>Checkpoint:</b> tidak ada crash saat izin ditolak, foto tetap ada setelah restart, dan notifikasi tidak menggandakan jadwal.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Foreground permission', 'Izin lokasi saat aplikasi sedang dipakai.'],
        ['Background permission', 'Izin lokasi saat aplikasi tidak di depan; membutuhkan alasan kuat.'],
        ['Image picker', 'Pemilih foto dari galeri atau kamera.'],
        ['Push notification', 'Notifikasi yang dikirim server melalui layanan platform.'],
        ['Local notification', 'Notifikasi yang dijadwalkan aplikasi di perangkat.'],
        ['Notification channel', 'Kanal Android untuk mengatur perilaku notifikasi.'],
        ['Haptic feedback', 'Getaran halus sebagai umpan balik.'],
        ['Clipboard', 'Penyimpanan sementara untuk salin-tempel.'],
        ['Deep link payload', 'Data pada notifikasi yang membuka rute tertentu.'],
        ['Document directory', 'Folder aplikasi yang tidak dibersihkan sistem secara otomatis.'],
        ['Barcode scanner', 'Pembaca kode batang/QR memakai kamera.'],
        ['Permission rationale', 'Penjelasan mengapa izin dibutuhkan.']
      ]
    }
  ],
  recap: [
    'Setiap fitur perangkat membutuhkan izin, konfigurasi, dan pengujian di perangkat nyata.',
    'Lokasi dan kamera harus tetap opsional; aplikasi tetap berguna saat izin ditolak.',
    'Simpan path foto di direktori aplikasi, bukan URI sementara.',
    'Notifikasi lokal dijadwalkan perangkat; push notification membutuhkan server.',
    'Haptic, clipboard, share, dan barcode dipakai secukupnya dengan alasan yang jelas.'
  ]
});
