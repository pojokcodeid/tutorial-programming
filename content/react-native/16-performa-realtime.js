/* ============================================================
   Pelajaran React Native — Bab 16: Performa dan Realtime
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-performance-realtime',
  title: 'Optimasi Performa dan Komunikasi Realtime',
  chapter: 'Kualitas & Performa',
  duration: '33 menit',
  intro: [
    'Pengguna menilai performa dari apa yang mereka lihat: scroll tersendat, tombol lambat merespons, atau animasi patah. Di React Native, penyebabnya bisa rendering berlebih di JS thread, gambar terlalu besar, atau pekerjaan berat yang menahan UI.',
    'Bab ini mengajarkan cara mengukur sebelum mengoptimalkan, lalu memperbaiki daftar, gambar, dan re-render. Setelah itu kita menambahkan komunikasi realtime dengan WebSocket: koneksi ulang, deteksi jaringan, dan antrean pesan saat offline.',
    'Kita juga membahas jebakan umum: <code>useMemo</code> yang dipakai untuk segalanya, <code>React.memo</code> dengan props yang selalu baru, dan WebSocket yang membuka koneksi baru setiap render.'
  ],
  objectives: [
    'Mengukur render, FPS, dan ukuran bundel sebelum mengoptimalkan',
    'Mengurangi re-render dengan memo, selector, dan struktur props yang stabil',
    'Mengoptimalkan FlatList, gambar, dan lazy loading',
    'Membuat koneksi WebSocket dengan reconnect dan cleanup',
    'Menangani offline queue dan sinkronisasi saat jaringan kembali'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Ukur Dulu, Baru Ubah</h3><ul><li><b>React DevTools Profiler:</b> melihat komponen yang render dan berapa lama.</li><li><b>Performance Monitor:</b> FPS JS dan UI thread.</li><li><b>Network inspector:</b> request berulang, payload besar, gambar tanpa cache.</li><li><b>Release build:</b> mode development jauh lebih lambat; ukur di build release.</li><li><b>Bundle analyzer:</b> menemukan library besar yang tidak terpakai.</li></ul><p>Optimasi tanpa pengukuran sering menghasilkan kode lebih rumit tanpa dampak yang terasa. Mulai dari layar yang paling sering dipakai, bukan dari komponen yang paling mudah diubah.</p>'
    },
    {
      type: 'example',
      title: 'Daftar yang stabil dan hemat render',
      lang: 'tsx',
      output: false,
      code: `import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { Expense } from '@/types/domain';

type RowProps = { item: Expense; onPress: (id: string) => void };

const ExpenseRow = React.memo(function ExpenseRow({ item, onPress }: RowProps) {
  return (
    <View style={{ padding: 16 }}>
      <Text onPress={() => onPress(item.id)}>{item.note}</Text>
      <Text>{item.amount}</Text>
    </View>
  );
});

type ListProps = {
  data: Expense[];
  onOpen: (id: string) => void;
};

export function ExpenseList({ data, onOpen }: ListProps) {
  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseRow item={item} onPress={onOpen} />
    ),
    [onOpen],
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      getItemLayout={(_data, index) => ({
        length: 72,
        offset: 72 * index,
        index,
      })}
    />
  );
}`,
      explain: [
        '<code>React.memo</code> hanya berguna bila props stabil. <code>onOpen</code> harus stabil (useCallback di parent) agar baris tidak render ulang.',
        '<code>getItemLayout</code> hanya boleh dipakai jika tinggi setiap baris benar-benar tetap. Bila salah, scroll dan posisi item menjadi kacau.',
        '<code>removeClippedSubviews</code> dapat membantu di Android, tetapi bisa menyebabkan item hilang pada layout tertentu. Uji, jangan aktifkan asal.',
        '<code>windowSize</code> lebih kecil berarti memori lebih rendah tetapi risiko blank saat scroll cepat. Sesuaikan dengan perangkat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Memo Berguna?</h3><p><code>useMemo</code> berguna untuk perhitungan mahal yang dipakai berulang, misalnya memfilter 5.000 transaksi atau membangun struktur data untuk grafik. Ia <b>tidak</b> berguna untuk perhitungan murah seperti <code>a + b</code>; biaya dependency check bisa lebih besar.</p><p><code>useCallback</code> berguna ketika fungsi diteruskan ke komponen yang dimemo atau menjadi dependency effect. Jangan membungkus setiap fungsi hanya karena "biar optimal". Ukur dengan profiler.</p>'
    },
    {
      type: 'example',
      title: 'Gambar dan lazy loading',
      lang: 'tsx',
      output: false,
      code: `import { Image } from 'expo-image';

export function ReceiptThumb({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: 72, height: 72, borderRadius: 8 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
      recyclingKey={uri}
      accessibilityLabel="Foto struk pengeluaran"
    />
  );
}

// Lazy screen dengan React.lazy + Suspense
// const ReportScreen = React.lazy(() => import('./ReportScreen'));
// <Suspense fallback={<ReportSkeleton />}><ReportScreen /></Suspense>`,
      explain: [
        '<code>expo-image</code> menyediakan cache memori/disk dan placeholder yang lebih baik daripada Image bawaan.',
        '<code>recyclingKey</code> membantu saat gambar dipakai di daftar yang mendaur ulang komponen.',
        'Kompres gambar di server atau saat upload. Gambar 4000 px untuk thumbnail 72 px hanya membuang memori dan bandwidth.',
        'Lazy loading layar berat mengurangi waktu startup, tetapi jangan memecah terlalu banyak chunk hingga muncul kedipan saat navigasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Realtime: WebSocket yang Tahan Putus</h3><p>WebSocket cocok untuk chat, notifikasi, atau dashboard yang berubah cepat. Ia membuka koneksi dua arah, tetapi koneksi mobile sering putus saat berpindah jaringan atau aplikasi ke latar belakang. Implementasi yang baik harus memiliki: status koneksi, reconnect dengan backoff, heartbeat, dan cleanup.</p><p>Jangan membuka WebSocket di dalam komponen yang sering render ulang. Letakkan di provider atau service yang hidup selama sesi. Untuk pesan yang dikirim saat offline, simpan di antrean lokal dan kirim setelah tersambung.</p>'
    },
    {
      type: 'example',
      title: 'Hook WebSocket dengan reconnect',
      lang: 'tsx',
      output: false,
      code: `import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

type Status = 'connecting' | 'open' | 'closed';

export function useLiveUpdates(url: string, onMessage: (data: unknown) => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const closedByUs = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    closedByUs.current = false;

    function connect() {
      setStatus('connecting');
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        retryRef.current = 0;
        setStatus('open');
      };

      socket.onmessage = (event) => {
        try {
          onMessageRef.current(JSON.parse(event.data));
        } catch {
          // Abaikan pesan yang bukan JSON valid.
        }
      };

      socket.onerror = () => socket.close();

      socket.onclose = () => {
        setStatus('closed');
        if (closedByUs.current) return;
        const delay = Math.min(30_000, 1_000 * 2 ** retryRef.current);
        retryRef.current += 1;
        setTimeout(connect, delay);
      };
    }

    connect();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && socketRef.current?.readyState !== WebSocket.OPEN) {
        socketRef.current?.close();
      }
    });

    return () => {
      closedByUs.current = true;
      subscription.remove();
      socketRef.current?.close();
    };
  }, [url]);

  return status;
}`,
      explain: [
        'Backoff eksponensial mencegah server dibanjiri reconnect saat jaringan mati total.',
        '<code>closedByUs</code> membedakan penutupan sengaja dari koneksi yang putus, sehingga cleanup tidak memicu reconnect.',
        'Callback disimpan di ref agar effect tidak terpasang ulang setiap render orang tua.',
        'Untuk produksi, tambahkan heartbeat/ping, batas percobaan, dan telemetry agar kegagalan koneksi terlihat.'
      ]
    },
    {
      type: 'example',
      title: 'Deteksi jaringan dan antrean pesan',
      lang: 'tsx',
      output: false,
      code: `import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

export function useOnlineStatus(onOnline: () => void) {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online) onOnline();
    });
    return unsubscribe;
  }, [onOnline]);
}

// Antrean sederhana di memori; untuk produksi gunakan SQLite outbox.
const pending: string[] = [];

export function queueMessage(message: string) {
  pending.push(message);
}

export function flushMessages(send: (message: string) => void) {
  while (pending.length > 0) {
    const next = pending.shift();
    if (next) send(next);
  }
}`,
      explain: [
        '<code>isInternetReachable</code> bisa <code>null</code> saat belum diketahui; jangan langsung menganggap offline.',
        'Antrean di memori hilang saat aplikasi ditutup. Untuk pesan penting, simpan di SQLite dengan idempotency key.',
        'Sinkronisasi saat online harus idempoten dan tidak memblokir UI. Tampilkan status "menunggu koneksi" bila perlu.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Mengoptimalkan Semua Hal Sekaligus',
      text: 'Menambahkan <code>React.memo</code>, <code>useMemo</code>, dan <code>useCallback</code> di seluruh kode membuatnya lebih sulit dibaca dan bisa memperlambat karena dependency check. Optimalkan setelah profiler menunjukkan masalah nyata. Satu perbaikan yang tepat lebih berharga daripada sepuluh optimasi spekulatif.'
    },
    {
      type: 'tip',
      title: 'Anggaran Performa yang Bisa Diuji',
      text: 'Tetapkan target: waktu startup di bawah 3 detik pada perangkat menengah, scroll 60 FPS, ukuran unduhan awal di bawah batas yang kamu tentukan, dan tidak ada request berulang saat membuka layar. Ukur di CI atau sebelum rilis, bukan hanya saat terasa lambat.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Profile layar pengeluaran dengan 500 item. Catat FPS dan jumlah render sebelum/sesudah optimasi.</li><li>Terapkan <code>React.memo</code>, <code>useCallback</code>, dan <code>getItemLayout</code> hanya jika data menunjukkan masalah.</li><li>Ganti gambar struk dengan <code>expo-image</code> dan ukur memori.</li><li>Hubungkan WebSocket ke server echo. Matikan WiFi, nyalakan lagi, dan pastikan reconnect bekerja.</li><li>Simpan pesan saat offline ke SQLite dan kirim setelah online tanpa duplikasi.</li></ol><p><b>Checkpoint:</b> kamu punya angka sebelum/sesudah, tidak ada koneksi WebSocket ganda, dan pesan offline tidak hilang.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Re-render', 'Komponen menjalankan fungsi render lagi.'],
        ['React.memo', 'Melewati render jika props tidak berubah secara dangkal.'],
        ['useMemo', 'Menyimpan hasil perhitungan antar render.'],
        ['useCallback', 'Menyimpan referensi fungsi antar render.'],
        ['Virtualisasi', 'Merender hanya item yang terlihat.'],
        ['FlashList', 'Alternatif FlatList yang dioptimalkan untuk daftar besar.'],
        ['FPS', 'Frame per detik; 60 FPS berarti 16,7 ms per frame.'],
        ['JS thread', 'Thread yang menjalankan logika React dan JavaScript.'],
        ['UI thread', 'Thread yang menggambar dan menangani gesture native.'],
        ['WebSocket', 'Koneksi dua arah persisten untuk data realtime.'],
        ['Backoff', 'Menambah jeda antar percobaan reconnect.'],
        ['Idempotency', 'Sifat operasi yang aman diulang tanpa efek ganda.']
      ]
    }
  ],
  recap: [
    'Ukur dengan profiler dan release build sebelum mengoptimalkan.',
    'Memo hanya berguna bila props dan dependencies stabil.',
    'Optimasi daftar dan gambar memberi dampak paling besar pada aplikasi data.',
    'WebSocket harus punya reconnect, cleanup, heartbeat, dan penanganan offline.',
    'Pesan offline harus disimpan persisten dan dikirim idempoten.'
  ]
});
