/* ============================================================
   Pelajaran Go REST API — Bab 8: Unit Testing
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-unit-testing',
  title: 'Unit Testing: Mock, Table-Driven & httptest',
  chapter: 'Testing',
  duration: '13 menit',
  intro: [
    '<b>Unit test</b> menguji satu unit kode secara terisolasi — tanpa database, tanpa server sungguhan. Kuncinya ada pada arsitektur layered tadi: karena service hanya mengenal interface repository, kita bisa menyetorkan <b>repository palsu (mock)</b> yang ada di memori.',
    'Pelajaran ini mempraktikkan tiga teknik inti testing Go: <b>table-driven test</b>, <b>mocking dengan interface</b>, dan <b>httptest</b> untuk menguji lapisan HTTP.'
  ],
  objectives: [
    'Menulis unit test dengan package testing dan go test',
    'Menerapkan pola table-driven test dengan sub-test',
    'Membuat mock repository lewat interface',
    'Menguji handler dengan httptest tanpa server sungguhan',
    'Membaca hasil test & coverage'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konvensi Test di Go</h3><p>Go punya testing di standard library — tidak perlu framework. Cukup buat file <code>*_test.go</code>, tulis fungsi <code>TestXxx(t *testing.T)</code>, lalu jalankan dengan <code>go test</code>. Nama fungsi harus diawali <code>Test</code> diikuti huruf kapital.</p>'
    },
    {
      type: 'example',
      title: 'Test pertama yang paling sederhana',
      lang: 'go',
      output: false,
      code: `package service

import "testing"

func TestRegister_Berhasil(t *testing.T) {
    svc := newTestAuthService(newMockUserRepo())

    user, err := svc.Register(context.Background(), RegisterInput{
        Username: "budi",
        Email:    "budi@mail.com",
        Password: "rahasia123",
    })
    if err != nil {
        t.Fatalf("Register() error = %v", err)
    }
    if user.ID == 0 {
        t.Error("ID user belum terisi")
    }
}`,
      explain: [
        '<code>t.Errorf</code> menandai test gagal tapi melanjutkan pemeriksaan berikutnya.',
        '<code>t.Fatalf</code> menandai gagal dan LANGSUNG menghentikan test (untuk prasyarat yang fatal).',
        'Pesan sebaiknya berbentuk <code>fungsi() hasil = X, want Y</code> agar mudah dipahami.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Table-Driven Test</h3><p>Untuk menguji banyak variasi input, Go memakai pola <b>table-driven</b>: daftar kasus disimpan di slice struct, lalu diulang dengan loop. Setiap kasus dibungkus <code>t.Run</code> sehingga menjadi sub-test dengan nama sendiri — hasilnya sangat mudah dibaca.</p>'
    },
    {
      type: 'example',
      title: 'Satu test, banyak kasus validasi',
      lang: 'go',
      output: false,
      code: `func TestRegister_Invalidasi(t *testing.T) {
    tests := []struct {
        name    string
        input   RegisterInput
        wantErr bool
    }{
        {"username terlalu pendek", RegisterInput{"ab", "a@mail.com", "rahasia123"}, true},
        {"email tanpa @", RegisterInput{"budi", "budi.mail.com", "rahasia123"}, true},
        {"password kurang dari 8", RegisterInput{"budi", "budi@mail.com", "pendek"}, true},
        {"semua valid", RegisterInput{"budi", "budi@mail.com", "rahasia123"}, false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) { // sub-test per kasus
            svc := newTestAuthService(newMockUserRepo())
            _, err := svc.Register(context.Background(), tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("Register(%+v) error = %v, wantErr = %v",
                    tt.input, err, tt.wantErr)
            }
        })
    }
}`,
      explain: [
        'Setiap kasus punya nama deskriptif → hasil test menyebut kasus mana yang gagal.',
        'Menambah kasus baru cukup menambah satu baris ke slice.',
        'Menjalankan satu sub-test: <code>go test -run TestRegister_Invalidasi/semua_valid</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mock Repository dengan Interface</h3><p>Di sinilah arsitektur layered terbayar. Service menerima <code>UserRepository</code> (interface), jadi untuk test kita bisa menyetorkan implementasi palsu yang menyimpan data di map — cepat dan tanpa database.</p>'
    },
    {
      type: 'example',
      title: 'Mock user repository di memori',
      lang: 'go',
      output: false,
      code: `// mockUserRepo memenuhi interface repository.UserRepository
type mockUserRepo struct {
    users map[string]*model.User // key: username
}

func (m *mockUserRepo) Create(ctx context.Context, u *model.User) error {
    if _, ada := m.users[u.Username]; ada {
        return repository.ErrDuplicate // meniru unique constraint
    }
    u.ID = int64(len(m.users) + 1)
    cp := *u
    m.users[u.Username] = &cp
    return nil
}

func (m *mockUserRepo) FindByUsername(
    ctx context.Context, username string,
) (*model.User, error) {
    u, ok := m.users[username]
    if !ok {
        return nil, repository.ErrNotFound
    }
    cp := *u
    return &cp, nil
}`,
      explain: [
        'Mock meniru perilaku database (termasuk error ErrDuplicate/ErrNotFound) tanpa membukanya.',
        'Karena sama-sama memenuhi interface, mock bisa dipakai langsung sebagai argumen service.',
        'Test menjadi deterministik dan berjalan dalam milidetik.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji logika bisnis dengan mock',
      lang: 'go',
      output: false,
      code: `func TestLogin_PasswordSalah(t *testing.T) {
    repo := newMockUserRepo()
    svc := newTestAuthService(repo)

    // Siapkan data: daftarkan user dulu
    _, err := svc.Register(context.Background(),
        RegisterInput{"budi", "budi@mail.com", "rahasia123"})
    if err != nil {
        t.Fatal(err)
    }

    // Login dengan password salah → harus ditolak
    _, _, err = svc.Login(context.Background(),
        LoginInput{"budi", "salah!"})
    if !errors.Is(err, ErrUnauthorized) {
        t.Errorf("Login() error = %v, want ErrUnauthorized", err)
    }
}`,
      explain: [
        'Urutan test: siapkan data (Arrange) → jalankan (Act) → periksa (Assert).',
        '<code>errors.Is</code> memeriksa jenis error meski sudah dibungkus fmt.Errorf("%w").',
        'Tanpa satu baris pun menyentuh MariaDB.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menguji Handler dengan httptest</h3><p>Package <b>httptest</b> memungkinkan menguji jalur HTTP lengkap (middleware → handler → respons) tanpa membuka port. Caranya: buat request palsu dengan <code>httptest.NewRequest</code>, lewatkan ke router, lalu periksa <code>httptest.ResponseRecorder</code>.</p>'
    },
    {
      type: 'example',
      title: 'Menguji kebijakan akses lewat router asli',
      lang: 'go',
      output: false,
      code: `func TestPOST_Products_PeranUser_403(t *testing.T) {
    srv := newTestServer() // router asli + service mock

    req := httptest.NewRequest(http.MethodPost,
        "/api/v1/products", strings.NewReader(\`{"name":"X","price":1000}\`))
    req.Header.Set("Authorization", "Bearer "+tokenUser) // token peran user

    rec := httptest.NewRecorder()
    srv.ServeHTTP(rec, req)

    if rec.Code != http.StatusForbidden {
        t.Errorf("status = %d, want 403", rec.Code)
    }
}`,
      explain: [
        'Request dilewatkan ke router ASLI, sehingga middleware Authenticate + RequireRole ikut teruji.',
        'Skenario seru diuji di sini: tanpa token → 401, token palsu → 401, peran user → 403, admin → 201.',
        'ResponseRecorder merekam status, header, dan body tanpa koneksi jaringan.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan & membaca hasil test',
      lang: 'bash',
      output: false,
      code: `# Jalankan semua unit test
go test ./... -v

# Jalankan satu fungsi test saja
go test ./internal/service/ -run TestLogin -v

# Ukur seberapa banyak kode teruji (coverage)
go test ./internal/service/ -cover`,
      explain: [
        '<code>-v</code> menampilkan detail tiap test yang dijalankan.',
        '<code>-run</code> memfilter nama test (mendukung pola regex).',
        '<code>-cover</code> menampilkan persentase baris kode yang dijalankan test.'
      ]
    },
    {
      type: 'tip',
      title: 'Apa yang layak diuji?',
      text: 'Prioritaskan logika yang rawan salah: validasi input, kebijakan akses (401/403), penanganan error, dan perhitungan bisnis. Hal yang hanya "menempel" library (mis. pemanggilan json.Marshal) biasanya cukup teruji lewat test alur di atasnya.'
    },
    {
      type: 'warn',
      title: 'Unit test harus tanpa efek samping',
      text: 'Test unit yang menulis ke database nyata membuat hasil tidak menentu dan lambat. Pastikan unit test murni di memori (mock). Untuk pengujian terhadap database sungguhan, gunakan integration test — dibahas di pelajaran berikutnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Pengujian satu unit kode secara terisolasi (tanpa dependensi luar).'],
        ['Table-driven test', 'Pola menguji banyak kasus dari daftar struct dalam satu fungsi test.'],
        ['Sub-test', 'Test di dalam test via t.Run(name, ...) — punya nama & hasil sendiri.'],
        ['Mock', 'Implementasi palsu interface yang meniru perilaku dependensi nyata.'],
        ['httptest', 'Package standard library untuk menguji HTTP tanpa server sungguhan.'],
        ['ResponseRecorder', 'Perekam respons HTTP palsu: status, header, dan body.'],
        ['Coverage', 'Persentase baris kode yang dijalankan oleh test (go test -cover).']
      ]
    }
  ],
  recap: [
    'Unit test memakai package testing bawaan: file *_test.go + go test.',
    'Table-driven test + t.Run menguji banyak kasus secara ringkas dan terbaca.',
    'Mock repository lewat interface membuat service teruji tanpa database.',
    'httptest menguji jalur HTTP lengkap termasuk middleware.',
    'Unit test harus bebas efek samping; pengujian DB ada di integration test.'
  ]
});
