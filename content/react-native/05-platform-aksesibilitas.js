/* ============================================================
   Pelajaran React Native — Bab 5: Platform, Aksesibilitas, dan Lifecycle
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-platform-a11y',
  title: 'Perbedaan Platform, Aksesibilitas, dan App Lifecycle',
  chapter: 'Fondasi & Persiapan',
  duration: '23 menit',
  intro: [
    'Aplikasi yang sama tetap terasa berbeda di Android dan iOS. Tombol kembali, keyboard, status bar, izin, dan gesture memiliki kebiasaan masing-masing. Menyamakan semuanya bukan tujuan; yang penting adalah <b>konsisten secara rasa</b> dan tidak melanggar kebiasaan platform.',
    'Bab ini juga membahas dua hal yang sering ditunda sampai terlambat: <b>aksesibilitas</b> dan <b>lifecycle</b>. Keduanya memengaruhi kepercayaan pengguna dan kualitas data, terutama saat aplikasi berpindah ke latar belakang.',
    'Setelah bab ini, kamu bisa memilih perilaku per platform dengan sadar, membuat layar yang terbaca pembaca layar, dan menyimpan data dengan aman ketika aplikasi ditinggalkan pengguna.'
  ],
  objectives: [
    'Menggunakan Platform.OS, Platform.select, dan file khusus platform',
    'Menerapkan safe area, status bar, dan keyboard behavior dengan benar',
    'Membuat komponen yang ramah TalkBack/VoiceOver',
    'Memahami siklus hidup aplikasi dan AppState',
    'Meminta izin hanya saat dibutuhkan dengan penjelasan yang jelas'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Cara Menangani Perbedaan Platform</h3><ol><li><b>Platform.OS</b> untuk percabangan kecil di dalam satu berkas, misalnya perilaku keyboard.</li><li><b>Platform.select</b> untuk memilih nilai style atau konfigurasi.</li><li><b>Berkas khusus platform</b> seperti <code>MapView.ios.tsx</code> dan <code>MapView.android.tsx</code> bila implementasinya benar-benar berbeda.</li></ol><p>Jangan bercabang untuk hal yang bisa diselesaikan dengan komponen yang sama. Terlalu banyak <code>Platform.OS === "ios"</code> membuat kode sulit dibaca dan diuji.</p>'
    },
    {
      type: 'example',
      title: 'Platform.select dan berkas khusus platform',
      lang: 'ts',
      output: false,
      code: `// src/theme/platformStyles.ts
import { Platform, StyleSheet } from 'react-native';

export const platformStyles = StyleSheet.create({
  toolbar: {
    paddingTop: Platform.select({ ios: 8, android: 4, default: 6 }),
    elevation: Platform.select({ android: 3, default: 0 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      default: {},
    }),
  },
});

// src/components/DatePickerField.ios.tsx -> memakai DateTimePicker iOS
// src/components/DatePickerField.android.tsx -> memakai dialog Android
// src/components/DatePickerField.tsx -> fallback untuk web/test`,
      explain: [
        '<code>Platform.select</code> mengembalikan nilai sesuai platform dan mendukung <code>default</code>. Ini lebih rapi daripada rantai if.',
        'Metro memilih berkas <code>.ios.tsx</code>/<code>.android.tsx</code> secara otomatis. File tanpa akhiran platform dipakai sebagai fallback, misalnya saat unit test di Node.',
        'Jangan menduplikasi seluruh layar hanya karena satu tombol berbeda. Pisahkan bagian yang benar-benar platform-specific.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Safe Area dan Status Bar</h3><p>Status bar Android dan iOS punya tinggi berbeda. Gunakan <code>SafeAreaProvider</code> di root dan <code>useSafeAreaInsets</code> bila perlu menghitung padding secara manual. Untuk status bar, pakai <code>StatusBar</code> dari <code>expo-status-bar</code> agar gaya ikon menyesuaikan tema terang/gelap.</p><p>Jangan memberi <code>paddingTop: 44</code> karena itu hanya cocok untuk satu model iPhone. Gunakan inset dari sistem.</p>'
    },
    {
      type: 'example',
      title: 'Layout aman dengan inset sistem',
      lang: 'tsx',
      output: false,
      code: `import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

export function Screen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: '#F8FAFC',
      }}
    >
      <StatusBar style="dark" />
      <Text style={{ fontSize: 24, fontWeight: '700', padding: 20 }}>
        Kantong
      </Text>
      {children}
    </View>
  );
}`,
      explain: [
        'Inset kiri/kanan penting pada mode landscape dengan notch.',
        'Bila memakai <code>SafeAreaView</code>, pilih <code>edges</code> yang sesuai. Menambahkan padding dua kali (SafeAreaView + inset) membuat jarak berlebihan.',
        'Status bar harus kontras dengan latar. Di mode gelap, gunakan <code>style="light"</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aksesibilitas Bukan Fitur Tambahan</h3><p>Pembaca layar membacakan <code>accessibilityLabel</code>, peran (<code>accessibilityRole</code>), dan status. Tombol ikon tanpa label akan terbaca sebagai "tombol" tanpa arti. Gambar dekoratif sebaiknya diberi <code>accessible={false}</code> atau <code>importantForAccessibility="no"</code> agar tidak mengganggu.</p><p>Urutan fokus mengikuti urutan render. Jika tampilan visual berbeda dari urutan logis, atur <code>accessibilityElementsHidden</code> atau susun ulang struktur. Untuk status dinamis seperti "3 item dipilih", gunakan <code>accessibilityLiveRegion="polite"</code> di Android dan pengumuman yang setara di iOS.</p>'
    },
    {
      type: 'example',
      title: 'Tombol ikon dan baris daftar yang terbaca',
      lang: 'tsx',
      output: false,
      code: `import { Pressable, Text, View } from 'react-native';

export function AddExpenseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Tambah pengeluaran baru"
      accessibilityHint="Membuka formulir pengeluaran"
      hitSlop={12}
      style={{ width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0F766E' }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 24 }}>+</Text>
    </Pressable>
  );
}

export function ExpenseRow({ note, amount }: { note: string; amount: string }) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={\`\${note}, nominal \${amount}\`}
      style={{ padding: 16 }}
    >
      <Text>{note}</Text>
      <Text>{amount}</Text>
    </View>
  );
}`,
      explain: [
        'Ikon "+" tidak bermakna bagi pembaca layar. Label dan hint menjelaskan aksi yang akan terjadi.',
        '<code>accessible</code> pada baris menggabungkan teks anak menjadi satu pengumuman, bukan dua elemen terpisah.',
        'Area sentuh 48×48 memenuhi pedoman umum 44–48 poin. <code>hitSlop</code> membantu bila ikon terlihat kecil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>App Lifecycle dan AppState</h3><p>Aplikasi mobile tidak selalu berjalan di depan. Pengguna menerima telepon, berpindah aplikasi, atau mengunci layar. <code>AppState</code> memberi tahu transisi <code>active</code>, <code>background</code>, dan <code>inactive</code> (iOS). Gunakan transisi ini untuk menyimpan draf, menghentikan timer, atau menyegarkan data saat kembali.</p><p>Jangan mengandalkan <code>useEffect</code> cleanup sebagai satu-satunya tempat menyimpan data; proses bisa dimatikan sistem tanpa peringatan. Simpan draf secara berkala, bukan hanya saat aplikasi ditutup.</p>'
    },
    {
      type: 'example',
      title: 'Menyimpan draf saat aplikasi ke latar belakang',
      lang: 'tsx',
      output: false,
      code: `import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useSaveDraftOnBackground(save: () => Promise<void>) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasActive = appState.current === 'active';
      const isLeaving = next === 'background' || next === 'inactive';
      if (wasActive && isLeaving) {
        void saveRef.current();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, []);
}`,
      explain: [
        'Callback disimpan di ref agar effect tidak perlu dipasang ulang setiap render ketika fungsi <code>save</code> berubah.',
        'Transisi <code>inactive</code> di iOS juga terjadi saat panel kontrol dibuka; simpan draf dengan operasi ringan dan idempoten.',
        'Untuk operasi berat, gunakan antrean/background task sesuai batasan platform, bukan menahan UI thread.'
      ]
    },
    {
      type: 'warn',
      title: 'Izin: Minta Saat Dibutuhkan, Bukan Saat Startup',
      text: 'Meminta izin kamera, lokasi, dan notifikasi sekaligus saat aplikasi pertama dibuka membuat pengguna curiga dan sering menolak. Jelaskan manfaatnya tepat sebelum fitur dipakai, lalu tangani penolakan dengan sopan. Jika pengguna memilih "jangan tanya lagi", arahkan ke pengaturan aplikasi. Deklarasikan izin di <code>app.json</code> (iOS <code>infoPlist</code>, Android permission) dan uji di build nyata, bukan hanya Expo Go.'
    },
    {
      type: 'tip',
      title: 'Uji dengan Pembaca Layar Sungguhan',
      text: 'Aktifkan TalkBack (Android) atau VoiceOver (iOS), lalu tutup mata dan coba selesaikan satu tugas: mencatat pengeluaran. Jika kamu tersesat, pengguna juga. Uji juga dengan font 200%, mode gelap, dan tombol "kurangi gerakan" (reduce motion).'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Tambahkan <code>SafeAreaProvider</code> di <code>app/_layout.tsx</code> dan pastikan layar pengeluaran tidak tertutup notch.</li><li>Buat komponen tombol ikon dengan label aksesibilitas dan uji dengan TalkBack/VoiceOver.</li><li>Gunakan <code>AppState</code> untuk menyimpan draf catatan ke <code>AsyncStorage</code> saat aplikasi ke latar belakang.</li><li>Buat berkas <code>src/components/PlatformBadge.ios.tsx</code> dan <code>.android.tsx</code> yang menampilkan teks berbeda, lalu buktikan Metro memilih berkas yang benar.</li><li>Uji keyboard pada layar form di iOS dan Android. Catat perbedaan perilaku yang kamu temukan.</li></ol><p><b>Checkpoint:</b> tidak ada padding status bar hardcode, tombol ikon punya label, dan draf tetap ada setelah aplikasi ditutup paksa lalu dibuka kembali.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Platform.OS', 'String platform saat ini: ios, android, atau web.'],
        ['Platform.select', 'Memilih nilai berdasarkan platform dengan fallback default.'],
        ['File extension platform', 'Berkas .ios.tsx/.android.tsx dipilih otomatis oleh Metro.'],
        ['SafeAreaProvider', 'Penyedia inset aman untuk seluruh aplikasi.'],
        ['useSafeAreaInsets', 'Hook untuk membaca inset atas, bawah, kiri, dan kanan.'],
        ['accessibilityRole', 'Peran elemen bagi pembaca layar, misalnya button atau header.'],
        ['accessibilityLabel', 'Teks yang dibacakan untuk elemen.'],
        ['accessibilityHint', 'Keterangan tambahan tentang apa yang terjadi setelah aksi.'],
        ['AppState', 'API untuk memantau aplikasi aktif, tidak aktif, atau di latar belakang.'],
        ['Inactive', 'Kondisi iOS saat aplikasi terlihat tetapi tidak menerima interaksi.'],
        ['Reduce motion', 'Preferensi pengguna untuk mengurangi animasi.'],
        ['Runtime permission', 'Izin yang diminta saat aplikasi berjalan, bukan saat instalasi.']
      ]
    }
  ],
  recap: [
    'Gunakan Platform.select atau file khusus platform hanya ketika perilakunya memang berbeda.',
    'Safe area dan status bar harus mengikuti inset sistem, bukan angka hardcode.',
    'Aksesibilitas dimulai dari label, peran, area sentuh, dan urutan fokus yang logis.',
    'AppState membantu menyimpan draf dan menghentikan pekerjaan saat aplikasi ke latar belakang.',
    'Izin diminta saat fitur dipakai, dengan penjelasan dan penanganan penolakan.'
  ]
});
