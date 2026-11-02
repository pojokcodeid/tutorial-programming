/* ============================================================
   Pelajaran React Native — Bab 15: Animasi dan Gesture
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-animation-gesture',
  title: 'Animasi dan Gesture dengan Reanimated',
  chapter: 'Kualitas & Performa',
  duration: '30 menit',
  intro: [
    'Animasi yang baik membuat aplikasi terasa hidup tanpa memperlambatnya. Animasi yang buruk membuat pengguna menunggu, kehilangan konteks, atau merasa mual. Bedanya bukan jumlah animasi, tetapi apakah animasi berjalan di thread yang tepat dan punya tujuan.',
    'Bab ini membahas Animated API bawaan, React Native Reanimated, dan React Native Gesture Handler. Kita akan membuat baris pengeluaran yang bisa digeser untuk menghapus, tombol yang membesar saat ditekan, dan transisi yang tetap halus saat JS thread sibuk.',
    'Prinsipnya: <b>animasi untuk menjelaskan perubahan</b>, bukan untuk menutupi keterlambatan. Selalu hormati preferensi "kurangi gerakan" dan uji di perangkat kelas menengah.'
  ],
  objectives: [
    'Membedakan Animated API, Reanimated, dan layout animation',
    'Menggunakan shared value, worklet, dan useAnimatedStyle',
    'Membuat gesture swipe-to-delete dengan Gesture Handler',
    'Mengoptimalkan animasi agar berjalan di UI thread',
    'Menghormati preferensi reduce motion dan aksesibilitas'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Pilih Alat Animasi</h3><table class="vocab"><tr><th>Alat</th><th>Cocok untuk</th><th>Catatan</th></tr><tr><td><code>Animated</code></td><td>Animasi sederhana, opacity, transform</td><td>Bawaan React Native; dengan <code>useNativeDriver</code> berjalan di UI thread</td></tr><tr><td><code>LayoutAnimation</code></td><td>Perubahan layout sederhana</td><td>Android perlu konfigurasi; kurang fleksibel</td></tr><tr><td><b>Reanimated</b></td><td>Animasi kompleks, gesture, worklet</td><td>Logika animasi berjalan di UI thread</td></tr><tr><td><b>Gesture Handler</b></td><td>Swipe, pinch, pan, long press</td><td>Menggantikan responder system bawaan</td></tr><tr><td><code>react-native-skia</code></td><td>Grafik 2D kustom, chart berat</td><td>Kurva belajar lebih tinggi</td></tr></table><p>Untuk aplikasi bisnis, Reanimated + Gesture Handler sudah menutup sebagian besar kebutuhan. Jangan menambahkan Skia hanya untuk animasi tombol.</p>'
    },
    {
      type: 'example',
      title: 'Shared value dan animasi tekan',
      lang: 'tsx',
      output: false,
      code: `import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';

export function ScaleButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{ backgroundColor: '#0F766E', padding: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Simpan</Text>
      </Pressable>
    </Animated.View>
  );
}`,
      explain: [
        '<code>useSharedValue</code> menyimpan nilai yang bisa dibaca worklet di UI thread tanpa bridge.',
        '<code>useAnimatedStyle</code> menghasilkan style yang diperbarui secara sinkron dengan nilai shared.',
        '<code>withSpring</code> memberi gerak yang terasa natural. Untuk perubahan kecil, durasi 150–250 ms biasanya cukup.',
        'Jangan membaca <code>scale.value</code> di JS saat render; itu memaksa sinkronisasi dan menghilangkan manfaat animasi UI thread.'
      ]
    },
    {
      type: 'example',
      title: 'Swipe-to-delete dengan Gesture Handler',
      lang: 'tsx',
      output: false,
      code: `import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = { note: string; amount: string; onDelete: () => void };

export function SwipeableExpenseRow({ note, amount, onDelete }: Props) {
  const { width } = useWindowDimensions();
  const threshold = width * 0.35;
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((event) => {
      translateX.value = Math.max(-threshold * 1.4, Math.min(0, event.translationX));
    })
    .onEnd(() => {
      if (translateX.value < -threshold) {
        translateX.value = withTiming(-threshold * 1.4, { duration: 160 });
        opacity.value = withTiming(0, { duration: 160 }, (finished) => {
          if (finished) runOnJS(onDelete)();
        });
      } else {
        translateX.value = withTiming(0, { duration: 160 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteText}>Hapus</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.row, rowStyle]}>
          <Text style={styles.note}>{note}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#B91C1C' },
  deleteBackground: { ...StyleSheet.absoluteFillObject, alignItems: 'flex-end',
    justifyContent: 'center', paddingRight: 24 },
  deleteText: { color: '#FFFFFF', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#FFFFFF' },
  note: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '700' },
});`,
      explain: [
        '<code>activeOffsetX</code> membuat gesture baru aktif setelah geseran horizontal cukup, sehingga scroll vertikal tetap nyaman.',
        '<code>failOffsetY</code> membatalkan pan jika pengguna lebih banyak menggeser vertikal.',
        '<code>runOnJS</code> diperlukan untuk memanggil fungsi JavaScript biasa dari worklet. Jangan memanggil <code>onDelete</code> langsung di UI thread.',
        'Animasi opacity selesai sebelum item dihapus, memberi kesan responsif. Sediakan juga tombol hapus alternatif untuk aksesibilitas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Worklet: Logika yang Berjalan di UI Thread</h3><p>Worklet adalah fungsi yang dapat dieksekusi di UI thread. Pada Reanimated, callback gesture dan <code>useAnimatedStyle</code> otomatis di-worklet-kan. Kamu bisa menandai fungsi dengan <code>"worklet"</code> directive, tetapi jangan memindahkan seluruh logika bisnis ke sana.</p><p>Aturan praktis: worklet hanya untuk perhitungan visual dan gesture. Validasi, akses database, dan pemanggilan API tetap di JS thread. Jika perlu memicu aksi JS, gunakan <code>runOnJS</code> dan pastikan tidak mengirim objek besar.</p>'
    },
    {
      type: 'example',
      title: 'Transisi masuk dengan layout animation',
      lang: 'tsx',
      output: false,
      code: `import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

export function ExpenseItem({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(160)}
    >
      {children}
    </Animated.View>
  );
}

// Untuk daftar, gunakan itemLayoutAnimation pada Animated.FlatList
// agar item lain bergeser halus saat satu item dihapus.`,
      explain: [
        'Layout animation bawaan Reanimated menghilangkan kebutuhan menghitung posisi manual.',
        '<code>FadeInDown</code> cocok untuk item baru, tetapi jangan memakainya pada 200 item sekaligus; animasi massal bisa membebani render.',
        'Untuk daftar besar, batasi animasi pada item yang baru terlihat atau gunakan transisi yang lebih ringan.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menganimasikan Properti Layout Secara Terus-Menerus',
      text: 'Menganimasikan <code>width</code>, <code>height</code>, <code>top</code>, atau <code>left</code> memaksa layout ulang setiap frame. Prioritaskan <code>transform</code> dan <code>opacity</code> yang bisa ditangani GPU. Bila harus mengubah ukuran, lakukan sekali dengan durasi pendek dan ukur dampaknya.'
    },
    {
      type: 'text',
      html: '<h3>Reduce Motion dan Aksesibilitas</h3><p>Sebagian pengguna mengalami gangguan vestibular dan memilih mengurangi gerakan. Hormati preferensi ini dengan <code>AccessibilityInfo.isReduceMotionEnabled()</code> atau hook yang setara. Animasi dekoratif bisa dimatikan; animasi yang menjelaskan perubahan penting bisa diganti dengan transisi instan atau fade singkat.</p><p>Gesture juga harus punya alternatif. Swipe-to-delete tanpa tombol hapus membuat pengguna pembaca layar tidak bisa menghapus. Sediakan menu atau tombol eksplisit.</p>'
    },
    {
      type: 'example',
      title: 'Menghormati reduce motion',
      lang: 'tsx',
      output: false,
      code: `import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );
    return () => subscription.remove();
  }, []);

  return reduce;
}

// const reduce = useReduceMotion();
// duration = reduce ? 0 : 220;`,
      explain: [
        'Preferensi dapat berubah saat aplikasi berjalan; listener menjaga nilai tetap akurat.',
        'Durasi 0 bukan berarti menghilangkan umpan balik. Tetap tampilkan perubahan state secara instan.',
        'Uji dengan pengaturan sistem, bukan dengan flag manual di kode.'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur, Jangan Menebak',
      text: 'Aktifkan Performance Monitor atau profiler untuk melihat frame drop. Animasi yang terlihat halus di iPhone terbaru bisa tersendat di perangkat kelas menengah. Uji release build, karena mode development memiliki overhead yang tidak mewakili produksi.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang <code>react-native-reanimated</code> dan <code>react-native-gesture-handler</code> dengan <code>npx expo install</code>.</li><li>Buat tombol dengan animasi tekan dan uji di perangkat fisik.</li><li>Buat baris pengeluaran swipe-to-delete, lengkap dengan tombol hapus alternatif.</li><li>Tambahkan animasi masuk untuk item baru dan animasi keluar saat dihapus.</li><li>Aktifkan reduce motion dan pastikan aplikasi tetap bisa dipakai.</li></ol><p><b>Checkpoint:</b> tidak ada animasi yang menghalangi aksi, gesture tidak bentrok dengan scroll, dan frame tetap stabil saat daftar digulir.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Animated API', 'API animasi bawaan React Native.'],
        ['useNativeDriver', 'Menjalankan animasi di UI thread untuk properti tertentu.'],
        ['Reanimated', 'Library animasi yang menjalankan worklet di UI thread.'],
        ['Shared value', 'Nilai Reanimated yang dapat dibaca worklet tanpa bridge.'],
        ['Worklet', 'Fungsi yang dapat dieksekusi di UI thread.'],
        ['useAnimatedStyle', 'Menghasilkan style dari shared value.'],
        ['Gesture Handler', 'Library gesture yang lebih andal daripada responder bawaan.'],
        ['runOnJS', 'Memanggil fungsi JS dari worklet.'],
        ['Layout animation', 'Animasi pergeseran layout saat item ditambah/dihapus.'],
        ['Reduce motion', 'Preferensi sistem untuk mengurangi animasi.'],
        ['Threshold', 'Batas nilai gesture untuk memicu aksi.'],
        ['Frame drop', 'Frame yang terlewat sehingga animasi terlihat patah.']
      ]
    }
  ],
  recap: [
    'Gunakan transform dan opacity untuk animasi yang efisien.',
    'Reanimated menempatkan logika visual di UI thread; logika bisnis tetap di JS.',
    'Gesture Handler membutuhkan offset agar tidak bentrok dengan scroll.',
    'Setiap gesture harus punya alternatif yang dapat diakses.',
    'Hormati reduce motion dan uji performa di perangkat nyata serta release build.'
  ]
});
