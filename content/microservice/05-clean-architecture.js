/* ============================================================
   Pelajaran Microservices — Bab 5: Clean Architecture & Modular Monolith
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'clean-architecture-modular-monolith',
  title: 'Clean Architecture & Modular Monolith',
  chapter: 'Membangun Service',
  duration: '14–16 menit',
  intro: [
    'Sebelum memecah aplikasi menjadi banyak service, kamu harus bisa menjaga satu binary tetap rapi. <b>Clean architecture</b> memisahkan kode ke lapisan handler (transport HTTP), usecase (aturan bisnis), dan repository (akses database) dengan aturan keras: <b>dependensi selalu mengarah ke dalam</b> — lapisan luar boleh tahu lapisan dalam, tidak sebaliknya.',
    'Sistem contoh kita, Order Management System (OMS), masih berupa satu module Go <code>example.com/oms</code> yang dipecah menjadi modul <code>catalog</code>, <code>orders</code>, dan <code>customers</code>. Ketiganya berbagi satu binary tetapi punya batas tegas: tiap modul memegang domain model, usecase, dan repository sendiri, serta berbicara satu sama lain lewat kontrak interface kecil.',
    'Bab ini menunjukkan cara menulis domain model Product, memasang dependency injection lewat constructor, mendefinisikan interface di sisi konsumen, dan menguji usecase dengan fake repository tanpa menyentuh database. Di akhir bab kamu juga tahu kapan modular monolith lebih bijak daripada microservices.'
  ],
  objectives: [
    'Memisahkan tanggung jawab kode ke lapisan handler, usecase, dan repository',
    'Menulis domain model dengan aturan bisnis di dalam method-nya sendiri',
    'Menerapkan dependency injection lewat constructor dan interface kecil khas Go',
    'Mengorganisasi modul catalog, orders, dan customers dalam satu binary',
    'Menguji usecase dengan fake repository tanpa database'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Lapisan, Satu Arah Dependensi</h3><p>Bayangkan permintaan POST /orders masuk ke order-service. <b>Handler</b> bertugas menerjemahkan HTTP ke dunia Go: baca body JSON, validasi format, panggil usecase, lalu tulis status code. <b>Usecase</b> memegang urutan langkah bisnis: cek produk lewat catalog, buat entitas order, simpan ke database. <b>Repository</b> satu-satunya tempat SQL ditulis. Bila satu fungsi melakukan ketiganya, mengubah aturan harga berarti menyentuh kode HTTP dan kode SQL sekaligus — itulah awal code smell.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 170" width="760" role="img" aria-label="Tiga lapisan clean architecture dengan panah dependensi ke dalam"><rect x="20" y="30" width="200" height="70" rx="10" class="u-box"/><text x="120" y="58" class="u-title" text-anchor="middle">Handler (transport)</text><text x="120" y="82" class="u-lbl" text-anchor="middle">net/http, JSON</text><rect x="280" y="30" width="200" height="70" rx="10" class="u-hd"/><text x="380" y="58" class="u-title" text-anchor="middle">Usecase</text><text x="380" y="82" class="u-lbl" text-anchor="middle">aturan bisnis</text><rect x="540" y="30" width="200" height="70" rx="10" class="u-box"/><text x="640" y="58" class="u-title" text-anchor="middle">Repository</text><text x="640" y="82" class="u-lbl" text-anchor="middle">SQL, pgx</text><line x1="222" y1="65" x2="276" y2="65" class="u-line" marker-end="url(#u-arrow)"/><line x1="482" y1="65" x2="536" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="250" y="50" class="u-lbl" text-anchor="middle">panggil</text><text x="510" y="50" class="u-lbl" text-anchor="middle">panggil</text><line x1="640" y1="105" x2="640" y2="130" class="u-dash"/><line x1="380" y1="130" x2="636" y2="130" class="u-dash"/><line x1="380" y1="130" x2="380" y2="105" class="u-dash" marker-end="url(#u-arrow)"/><line x1="120" y1="130" x2="376" y2="130" class="u-dash"/><line x1="120" y1="130" x2="120" y2="105" class="u-dash" marker-end="url(#u-arrow)"/><text x="380" y="158" class="u-lbl" text-anchor="middle">arah dependensi: ke dalam, menuju inti bisnis</text></svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Handler memanggil usecase, usecase memanggil repository; tidak ada panah yang berbalik.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Contoh: Domain Model Product dengan Aturan Bisnis di Dalamnya',
      lang: 'go',
      output: false,
      code: `package catalog

import (
    "errors"
    "strings"
    "time"
)

var (
    ErrNameRequired     = errors.New("nama produk wajib diisi")
    ErrPriceNegative    = errors.New("harga tidak boleh negatif")
    ErrStockInsufficient = errors.New("stok tidak mencukupi")
    ErrNotFound         = errors.New("produk tidak ditemukan")
)

// Product adalah domain model: murni data plus aturan bisnis,
// tanpa dependensi ke net/http maupun database/sql.
type Product struct {
    ID        int64
    Name      string
    Price     int64 // rupiah bulat; uang jangan dipakai float
    Stock     int
    CreatedAt time.Time
}

func NewProduct(name string, price int64, stock int) (Product, error) {
    if name = strings.TrimSpace(name); name == "" {
        return Product{}, ErrNameRequired
    }
    if price < 0 {
        return Product{}, ErrPriceNegative
    }
    return Product{Name: name, Price: price, Stock: stock, CreatedAt: time.Now()}, nil
}

// Reserve adalah aturan bisnis: stok boleh dikurangi hanya bila mencukupi.
func (p *Product) Reserve(qty int) error {
    if qty <= 0 {
        return errors.New("jumlah pesanan harus positif")
    }
    if p.Stock < qty {
        return ErrStockInsufficient
    }
    p.Stock -= qty
    return nil
}`,
      explain: [
        'Package <code>catalog</code> tidak meng-import net/http maupun pgx — arah dependensi yang benar membuat model ini bisa diuji tanpa apa pun.',
        'Aturan bisnis seperti Reserve hidup sebagai method, bukan if yang tersebar di handler; error sentinel memudahkan pemeriksaan dengan <code>errors.Is</code> di lapisan luar.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Interface Repository dan Usecase dengan Constructor Injection',
      lang: 'go',
      output: false,
      code: `package catalog

import "context"

// ProductRepository didefinisikan di sisi pemakai (consumer-side interface).
type ProductRepository interface {
    Save(ctx context.Context, p *Product) error
    FindByID(ctx context.Context, id int64) (Product, error)
}

// ProductService adalah lapisan usecase; kebutuhannya dipasang lewat constructor.
type ProductService struct {
    repo ProductRepository
}

func NewProductService(repo ProductRepository) *ProductService {
    return &ProductService{repo: repo}
}

func (s *ProductService) Create(ctx context.Context, name string, price int64, stock int) (Product, error) {
    p, err := NewProduct(name, price, stock)
    if err != nil {
        return Product{}, err
    }
    if err := s.repo.Save(ctx, &p); err != nil {
        return Product{}, err
    }
    return p, nil
}

func (s *ProductService) ReserveStock(ctx context.Context, id int64, qty int) error {
    p, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return err
    }
    if err := p.Reserve(qty); err != nil {
        return err
    }
    return s.repo.Save(ctx, &p)
}`,
      explain: [
        'Di Go, interface didefinisikan di package konsumen dan berukuran kecil — satu atau dua method. Package postgres cukup <i>memenuhi</i> interface ini tanpa kata kunci implements.',
        'Karena constructor menerima ProductRepository, pada pengujian kamu mengirim versi palsu; pada produksi kamu mengirim implementasi pgx. Usecase tidak pernah tahu perbedaannya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Domain-Driven Design Dasar</h3><p>Clean architecture menjawab <i>bagaimana</i> kode disusun; Domain-Driven Design (DDD) membantu menjawab <i>apa</i> yang layak dimodelkan. Tiga istilahnya paling sering dipakai: <ul><li><b>Bounded context</b> — batas di mana sebuah kata punya makna tetap. "Produk" di konteks katalog berarti master data dengan stok; "produk" di konteks pesanan berarti baris order dengan harga snapshot. Dua makna berbeda = dua bounded context, kandidat dua service.</li><li><b>Aggregate</b> — cluster objek yang selalu berubah sebagai satu kesatuan beserta aturannya. Product adalah aggregate kecil: aturan stok tidak boleh dilanggar siapa pun dari luar, hanya lewat method Reserve.</li><li><b>Business rules</b> — kebijakan bisnis yang harus bertahan walau transport atau database berganti ganti. Uang memakai integer rupiah, stok tidak negatif, nama wajib terisi — itu aturan, bukan detail teknis.</li></ul></p>'
    },
    {
      type: 'text',
      html: '<h3>Modular Monolith: Satu Binary, Batas Tegas</h3><p>Microservices bukan satu-satunya cara memperoleh arsitektur rapi. <b>Modular monolith</b> menjalankan catalog, orders, dan customers dalam satu proses dan satu binary, tetapi tiap modul memegang paketnya sendiri dengan aturan keras: package lain hanya boleh memakai API publik modul, dan tidak boleh ada import silang menembus lapisan dalam. Saat orders perlu memeriksa produk, ia memanggil kontrak <code>ProductCatalog</code> — di modular monolith kontrak itu diisi wrapper dari modul catalog; ketika nanti dipecah jadi microservices, kontrak yang sama diisi HTTP client. Itulah nilai batas yang tegas: pemecahan nanti hanya mengubah isi, bukan bentuk.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Kontrak Antarmodul yang Sama Saat Dipecah',
      lang: 'go',
      output: false,
      code: `package orders

// ProductCatalog adalah kontrak yang DIPAKAI modul orders.
// Bila OMS dipecah menjadi microservices, cukup ganti implementasi
// dengan HTTP client ke catalog-service; kode usecase tetap sama.
type ProductCatalog interface {
    GetProduct(ctx context.Context, id int64) (catalog.Product, error)
}

type OrderService struct {
    products ProductCatalog
    orders   OrderRepository
}

func NewOrderService(products ProductCatalog,
    orders OrderRepository,
) *OrderService {
    return &OrderService{products: products, orders: orders}
}`,
      explain: [
        'Interface didefinisikan di package orders (konsumen), sesuai idiom Go: interface kecil milik pemakai, bukan pemilik.',
        'Modul catalog tidak perlu tahu bahwa orders memakainya — coupling hanya terjadi lewat kontrak, sehingga kedua modul bisa dikembangkan tim berbeda.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Unit Test Usecase dengan Fake Repository (Tanpa Database)',
      lang: 'go',
      output: false,
      code: `package catalog

import (
    "context"
    "testing"
)

// fakeProductRepo memenuhi ProductRepository tanpa menyentuh SQL.
type fakeProductRepo struct {
    items map[int64]Product
    seq   int64
}

func (f *fakeProductRepo) Save(_ context.Context, p *Product) error {
    if p.ID == 0 {
        f.seq++
        p.ID = f.seq
    }
    f.items[p.ID] = *p
    return nil
}

func (f *fakeProductRepo) FindByID(_ context.Context, id int64) (Product, error) {
    p, ok := f.items[id]
    if !ok {
        return Product{}, ErrNotFound
    }
    return p, nil
}

func TestReserveStock_StokKurang(t *testing.T) {
    repo := &fakeProductRepo{items: map[int64]Product{}}
    svc := NewProductService(repo)

    p, err := svc.Create(context.Background(), "Kopi Susu", 25000, 2)
    if err != nil {
        t.Fatalf("Create: %v", err)
    }
    err = svc.ReserveStock(context.Background(), p.ID, 5)
    if !errors.Is(err, ErrStockInsufficient) {
        t.Fatalf("err = %v, mau ErrStockInsufficient", err)
    }
}`,
      explain: [
        'Fake repository hanyalah struct yang memenuhi interface — tanpa gomock, tanpa database, dan berjalan dalam hitungan milidetik.',
        'Test memeriksa perilaku usecase (stok kurang harus gagal), bukan detail SQL; jalankan dengan <code>go test ./internal/catalog/</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan Modular Monolith Lebih Baik',
      text: 'Selama timmu kecil (satu sampai dua tim), rilis masih berjalan satu paket, dan modul-modulmu sering butuh transaksi database bersama, modular monolith memberi struktur rapi dengan biaya operasional minimum: satu deploy, satu log, satu debugger. Microservices baru terbayar saat timnya sudah benar-benar butuh rilis independen, ada bottleneck resource yang nyata, atau skala bebannya berbeda jauh antar bagian. Struktur modular yang kamu bangun hari ini justru mempersiapkan pemecahan yang murah di kemudian hari.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Modular monolith hanya berhasil bila batasnya dijaga secara teknis. Kalau package orders diam-diam meng-import struct internal package catalog, atau semua modul berbagi satu package model raksasa, kamu mendapat monolith kotor yang gagal dipecah dan tetap sulit dikembangkan. Terapkan batas lewat interface publik yang kecil, dan bila perlu cek import silang di CI.'
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tambahkan method <code>UpdatePrice</code> ke ProductService lengkap dengan aturan bisnis (harga baru tidak boleh negatif), tanpa menyentuh kode handler.</li><li>Buat interface <code>CustomerDirectory</code> di modul orders, lalu rangkai implementasinya di main.</li><li>Tulis satu fake repository dan dua test usecase: sukses dan gagal. Pastikan <code>go test ./...</code> lulus tanpa database berjalan.</li></ol>'
    },
    {
      type: 'vocab',
      items: [
        ['Clean architecture', 'Pemisahan lapisan handler, usecase, dan repository dengan arah dependensi ke dalam.'],
        ['Domain model', 'Struct data bisnis plus method aturan bisnisnya, bebas dari framework dan database.'],
        ['Dependency injection', 'Pemasangan kebutuhan lewat parameter constructor, bukan dibuat di dalam method.'],
        ['Consumer-defined interface', 'Interface yang didefinisikan di package pemakai; implementasi bersifat implisit di Go.'],
        ['Bounded context', 'Batas di mana sebuah istilah domain punya makna tetap dan konsisten.'],
        ['Aggregate', 'Kumpulan objek yang berubah sebagai satu kesatuan beserta aturan invariant-nya.'],
        ['Modular monolith', 'Satu binary berisi banyak modul dengan batas tegas dan kontrak antarmodul.'],
        ['Composition root', 'Fungsi main yang merangkai semua lapisan; satu-satunya tempat yang tahu tipe konkret.']
      ]
    }
  ],
  recap: [
    'Handler, usecase, dan repository adalah tiga lapisan dengan satu arah dependensi: ke dalam, menuju inti bisnis.',
    'Domain model memegang aturan bisnis sebagai method; error sentinel memudahkan pemeriksaan lintas lapisan dengan errors.Is.',
    'Dependency injection lewat constructor plus interface kecil khas Go membuat usecase bisa diuji dengan fake repository tanpa database.',
    'Modular monolith menjalankan modul catalog, orders, dan customers dalam satu binary; kontrak antarmodul tetap sama saat kelak dipecah jadi microservices.'
  ]
});
