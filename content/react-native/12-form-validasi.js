/* ============================================================
   Pelajaran React Native — Bab 12: Form, Validasi, dan Upload
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-forms',
  title: 'Form, Validasi Zod, dan Upload Berkas',
  chapter: 'Data & Perangkat',
  duration: '29 menit',
  intro: [
    'Form adalah tempat aplikasi paling sering kehilangan pengguna. Keyboard menutupi tombol, pesan error tidak jelas, tombol simpan ditekan dua kali, dan data hilang saat aplikasi ke latar belakang. Semua ini bisa dicegah dengan pola yang tepat.',
    'Bab ini membangun form pengeluaran Kantong dengan React Hook Form dan Zod: validasi di satu skema, error di dekat input, submit yang aman dari duplikasi, serta unggah foto struk dengan progres.',
    'Prinsipnya: <b>satu sumber kebenaran untuk validasi</b>, <b>satu jalur untuk submit</b>, dan <b>umpan balik yang terlihat</b> di setiap langkah.'
  ],
  objectives: [
    'Membedakan controlled form dan uncontrolled form dengan React Hook Form',
    'Menulis skema Zod yang menghasilkan tipe TypeScript',
    'Menangani error per field, keyboard, dan submit ganda',
    'Membuat form dinamis dan multi-langkah',
    'Mengunggah gambar dengan FormData dan progres'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa React Hook Form?</h3><p>Dengan <code>useState</code>, setiap ketukan memperbarui state dan merender ulang seluruh layar. Untuk form 10 field, ini bisa terasa. React Hook Form memakai ref dan uncontrolled input, lalu hanya merender ulang field yang error atau berubah status.</p><p>Zod melengkapi dengan skema validasi yang bisa dipakai di klien dan server. Tipe TypeScript diturunkan dari skema, sehingga aturan validasi dan tipe tidak bisa berbeda.</p>'
    },
    {
      type: 'example',
      title: 'Skema pengeluaran dan tipe otomatis',
      lang: 'ts',
      output: false,
      code: `// src/features/expenses/schemas/expenseSchema.ts
import { z } from 'zod';

export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Nominal wajib diisi')
    .transform((value) => Number(value.replace(/\\D/g, '')))
    .pipe(z.number().int().positive('Nominal harus lebih dari 0')),

  note: z
    .string()
    .trim()
    .min(3, 'Catatan minimal 3 karakter')
    .max(200, 'Catatan maksimal 200 karakter'),

  categoryId: z.enum(['food', 'transport', 'bills', 'fun', 'other']),

  spentAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal tidak valid'),
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormOutput = z.output<typeof expenseSchema>;`,
      explain: [
        '<code>z.input</code> adalah bentuk sebelum transformasi (amount berupa string dari input), sedangkan <code>z.output</code> adalah hasil akhir (amount number).',
        '<code>.pipe</code> memastikan hasil transformasi tetap divalidasi sebagai bilangan positif.',
        'Aturan yang sama sebaiknya dipakai di server. Validasi klien untuk kenyamanan, validasi server untuk keamanan.'
      ]
    },
    {
      type: 'example',
      title: 'Form dengan Controller dan submit aman',
      lang: 'tsx',
      output: false,
      code: `import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { expenseSchema, type ExpenseFormInput, type ExpenseFormOutput }
  from '@/features/expenses/schemas/expenseSchema';

type Props = {
  onSubmit: (values: ExpenseFormOutput) => Promise<void>;
};

export function ExpenseForm({ onSubmit }: Props) {
  const {
    control, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      note: '',
      categoryId: 'food',
      spentAt: new Date().toISOString(),
    },
  });

  return (
    <View style={{ padding: 20, gap: 14 }}>
      <Text>Nominal</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            placeholder="0"
            style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
          />
        )}
      />
      {errors.amount ? <Text style={{ color: '#B91C1C' }}>{errors.amount.message}</Text> : null}

      <Text>Catatan</Text>
      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Misalnya: makan siang"
            multiline
            style={{ borderWidth: 1, padding: 12, borderRadius: 10, minHeight: 80 }}
          />
        )}
      />
      {errors.note ? <Text style={{ color: '#B91C1C' }}>{errors.note.message}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        accessibilityRole="button"
        style={{ backgroundColor: isSubmitting ? '#94A3B8' : '#0F766E',
          padding: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
          {isSubmitting ? 'Menyimpan…' : 'Simpan'}
        </Text>
      </Pressable>
    </View>
  );
}`,
      explain: [
        '<code>isSubmitting</code> menonaktifkan tombol selama submit, mencegah data ganda.',
        'Error ditampilkan tepat di bawah field terkait, bukan sebagai satu pesan umum di atas form.',
        '<code>Controller</code> dipakai karena <code>TextInput</code> adalah komponen native dengan API <code>value</code>/<code>onChangeText</code>, bukan input HTML.',
        'Untuk form besar, pisahkan komponen field menjadi <code>FormTextField</code> agar tidak mengulang boilerplate.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keyboard dan Kehilangan Data</h3><p>Bungkus form dengan <code>ScrollView</code> yang memiliki <code>keyboardShouldPersistTaps="handled"</code> dan <code>contentContainerStyle={{ paddingBottom: 120 }}</code>. Gunakan <code>KeyboardAvoidingView</code> di iOS. Untuk field terakhir, <code>returnKeyType="done"</code> dan <code>onSubmitEditing</code> membantu pengguna.</p><p>Simpan draf ke penyimpanan lokal saat pengguna mengetik (debounce 500 ms) atau saat aplikasi ke latar belakang. Saat form dibuka lagi, tawarkan untuk melanjutkan draf. Jangan menyimpan draf sensitif tanpa enkripsi.</p>'
    },
    {
      type: 'example',
      title: 'Form dinamis: daftar item yang bisa ditambah',
      lang: 'tsx',
      output: false,
      code: `import { useFieldArray, useForm } from 'react-hook-form';

type SplitBill = {
  title: string;
  items: { name: string; amount: string }[];
};

export function SplitBillForm() {
  const { control, register, handleSubmit } = useForm<SplitBill>({
    defaultValues: { title: '', items: [{ name: '', amount: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <View>
      {fields.map((field, index) => (
        <View key={field.id} style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            {...register(\`items.\${index}.name\`)}
            placeholder="Nama item"
          />
          <TextInput
            {...register(\`items.\${index}.amount\`)}
            placeholder="Nominal"
            keyboardType="number-pad"
          />
          <Pressable onPress={() => remove(index)}>
            <Text>Hapus</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => append({ name: '', amount: '' })}>
        <Text>Tambah item</Text>
      </Pressable>
    </View>
  );
}`,
      explain: [
        '<code>useFieldArray</code> memberi <code>id</code> stabil untuk setiap baris, sehingga fokus dan nilai tidak tertukar saat menghapus.',
        'Gunakan <code>key={field.id}</code>, bukan indeks array.',
        'Untuk validasi dinamis, gunakan <code>superRefine</code> pada skema Zod agar aturan "minimal satu item" dapat diperiksa.'
      ]
    },
    {
      type: 'example',
      title: 'Upload foto struk dengan FormData',
      lang: 'ts',
      output: false,
      code: `// src/features/expenses/uploadReceipt.ts
import * as ImagePicker from 'expo-image-picker';
import { authorizedRequest } from '@/services/authorizedRequest';

export async function pickReceipt() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Izin galeri diperlukan untuk memilih struk.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: [3, 4],
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function uploadReceipt(asset: ImagePicker.ImagePickerAsset) {
  const form = new FormData();
  form.append('receipt', {
    uri: asset.uri,
    name: asset.fileName ?? 'receipt.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  return authorizedRequest<{ url: string }>('/uploads/receipt', {
    method: 'POST',
    body: form,
    // Jangan set Content-Type manual; biarkan fetch menambahkan boundary.
  });
}`,
      explain: [
        'Di React Native, <code>FormData</code> menerima objek <code>{ uri, name, type }</code>. Casting ke <code>Blob</code> diperlukan karena tipe DOM tidak sepenuhnya cocok, tetapi nilainya tetap dibaca oleh native.',
        'Jangan menetapkan <code>Content-Type: multipart/form-data</code> tanpa boundary. Bila kamu memakai <code>apiRequest</code> yang menambahkan JSON header, buat jalur khusus untuk upload.',
        'Kompres gambar sebelum upload. Foto 12 MP tidak perlu dikirim untuk struk yang dibaca di layar ponsel.'
      ]
    },
    {
      type: 'warn',
      title: 'Validasi Klien Bukan Keamanan',
      text: 'Pengguna dapat memodifikasi aplikasi atau memanggil API langsung. Semua aturan penting harus divalidasi ulang di server: nominal, kepemilikan data, tipe file, ukuran file, dan izin. Validasi klien hanya meningkatkan pengalaman, bukan menggantikan keamanan.'
    },
    {
      type: 'tip',
      title: 'Pola Submit yang Tidak Bisa Digandakan',
      text: 'Gunakan <code>isSubmitting</code>, nonaktifkan tombol, dan buat operasi idempoten di server. Untuk form yang mengirim file, tampilkan progres dan izinkan pembatalan. Jika pengguna menekan kembali saat upload, batalkan request dan beri tahu bahwa data belum tersimpan.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang <code>react-hook-form</code>, <code>zod</code>, dan <code>@hookform/resolvers</code>.</li><li>Buat form pengeluaran dengan validasi nominal, catatan, kategori, dan tanggal.</li><li>Uji: nominal kosong, nol, huruf, catatan 1 karakter, dan tombol ditekan dua kali cepat.</li><li>Tambahkan pemilih foto dan unggah ke endpoint mock. Tampilkan progres.</li><li>Simpan draf ke AsyncStorage dan pulihkan saat form dibuka kembali.</li></ol><p><b>Checkpoint:</b> error tampil di field yang tepat, submit ganda tidak menghasilkan dua data, dan form tetap bisa dipakai saat keyboard terbuka.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Controlled input', 'Nilai input dikendalikan state React.'],
        ['Uncontrolled input', 'Nilai disimpan oleh komponen native dan dibaca lewat ref.'],
        ['React Hook Form', 'Library form yang efisien dengan validasi berbasis resolver.'],
        ['Zod', 'Library validasi runtime yang menghasilkan tipe TypeScript.'],
        ['Resolver', 'Jembatan antara skema validasi dan React Hook Form.'],
        ['z.input', 'Tipe nilai sebelum transformasi skema.'],
        ['z.output', 'Tipe nilai setelah transformasi skema.'],
        ['useFieldArray', 'Hook untuk field dinamis berbentuk array.'],
        ['FormData', 'Format multipart untuk mengirim berkas dan field.'],
        ['Multipart boundary', 'Pemisah bagian pada body multipart yang dibuat otomatis.'],
        ['Idempotent submit', 'Submit berulang tidak menghasilkan data ganda.'],
        ['Draft', 'Data form yang belum dikirim dan disimpan sementara.']
      ]
    }
  ],
  recap: [
    'React Hook Form mengurangi render ulang; Zod menjaga aturan dan tipe tetap sinkron.',
    'Error harus tampil di dekat field dan submit harus aman dari duplikasi.',
    'Keyboard, draf, dan kehilangan fokus adalah bagian dari desain form.',
    'Field dinamis membutuhkan key stabil, bukan indeks array.',
    'Upload memakai FormData tanpa menetapkan boundary manual; validasi tetap dilakukan server.'
  ]
});
