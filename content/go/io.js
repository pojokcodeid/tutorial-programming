/* ============================================================
   Pelajaran Go — Bab 12: I/O, File System & Data Format
   (topik info.md:
    - "Package io, os, bufio, dan bytes"
    - "Membaca dan menulis file"
    - "Working with JSON, XML, dan CSV (encoding/json)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 27: File I/O (io, os, bufio, bytes) ---------- */
window.GO_LESSONS.push({
  id: 'file-io',
  title: 'File I/O: io, os, bufio, bytes',
  chapter: 'I/O & Data Format',
  duration: '11 menit',
  intro: [
    'Program nyata hampir selalu berurusan dengan berkas: membaca konfigurasi, menulis log, atau memproses data besar. Go menyediakan package <b>os</b>, <b>io</b>, <b>bufio</b>, dan <b>bytes</b> yang saling melengkapi.',
    'Pelajaran ini memandu membaca dan menulis berkas dengan cara paling sederhana sekaligus cara yang efisien.'
  ],
  objectives: [
    'Membaca dan menulis berkas dengan package os',
    'Memahami peran package io dan io.Reader/io.Writer',
    'Memakai bufio untuk membaca per baris secara efisien',
    'Mengolah data di memori dengan bytes.Buffer'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Package <b>os</b> mengurus berkas dan proses. Cara tercepat membaca & menulis berkas utuh adalah <code>os.ReadFile</code> dan <code>os.WriteFile</code>. Untuk berkas besar, gunakan streaming dengan <b>bufio</b> agar hemat memori.</p>'
    },
    {
      type: 'example',
      title: 'Menulis dan membaca berkas utuh',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "os"
)

func main() {
    // Menulis berkas (membuat bila belum ada)
    isi := []byte("Halo, berkas!\nBaris kedua.\n")
    err := os.WriteFile("catatan.txt", isi, 0644)
    if err != nil {
        fmt.Println("gagal menulis:", err)
        return
    }

    // Membaca berkas utuh
    data, err := os.ReadFile("catatan.txt")
    if err != nil {
        fmt.Println("gagal membaca:", err)
        return
    }
    fmt.Println(string(data))

    // Cek apakah berkas ada
    if _, err := os.Stat("catatan.txt"); err == nil {
        fmt.Println("berkas ada")
    }
}`,
      explain: [
        '<code>os.WriteFile(nama, data, 0644)</code> menulis berkas; 0644 adalah izin akses (rw-r--r--).',
        '<code>os.ReadFile</code> membaca seluruh isi ke slice byte.',
        '<code>os.Stat</code> memeriksa keberadaan/atribut berkas.',
        'Cara ini praktis untuk berkas kecil hingga sedang.'
      ]
    },
    {
      type: 'text', // io
      html: '<p>Package <b>io</b> mendefinisikan dua interface fundamental: <code>io.Reader</code> (sesuatu yang bisa dibaca) dan <code>io.Writer</code> (sesuatu yang bisa ditulis). Hampir semua sumber data Go — berkas, jaringan, buffer — memenuhi keduanya, sehingga banyak fungsi bisa bekerja dengan tipe apa pun asalkan memenuhi interface itu.</p>'
    },
    {
      type: 'example',
      title: 'Streaming dengan bufio.Scanner',
      lang: 'go',
      output: false,
      code: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func main() {
    berkas, err := os.Open("catatan.txt")
    if err != nil {
        fmt.Println("gagal buka:", err)
        return
    }
    defer berkas.Close()

    // Membaca baris demi baris
    scanner := bufio.NewScanner(berkas)
    nomor := 1
    for scanner.Scan() {
        fmt.Printf("%d: %s\n", nomor, scanner.Text())
        nomor++
    }
    if err := scanner.Err(); err != nil {
        fmt.Println("error saat membaca:", err)
    }

    // bufio juga bisa membaca dari string apa pun
    s := bufio.NewScanner(strings.NewReader("a\nb\nc"))
    for s.Scan() {
        fmt.Println("baris:", s.Text())
    }
}`,
      explain: [
        '<code>bufio.NewScanner</code> membaca input potongan demi potongan (per baris) tanpa memuat seluruh berkas.',
        '<code>scanner.Scan()</code> mengembalikan true selama masih ada baris; <code>Text()</code> mengambil barisnya.',
        'Selalu periksa <code>scanner.Err()</code> setelah loop.',
        'Scanner bekerja dengan sumber apa pun yang merupakan <code>io.Reader</code>.'
      ]
    },
    {
      type: 'example',
      title: 'bytes.Buffer untuk menyusun data di memori',
      lang: 'go',
      output: false,
      code: `package main

import (
    "bytes"
    "fmt"
)

func main() {
    // bytes.Buffer adalah io.Writer + io.Reader di memori
    var buf bytes.Buffer

    fmt.Fprintln(&buf, "Baris pertama")
    fmt.Fprintf(&buf, "Nilai: %d\n", 42)
    buf.WriteString("Baris ketiga\n")

    fmt.Println(buf.String())

    // bytes juga menyediakan operasi pada []byte
    data := []byte("apel,jeruk,mangga")
    bagian := bytes.Split(data, []byte(","))
    for _, b := range bagian {
        fmt.Println(string(b))
    }
    fmt.Println(bytes.Contains(data, []byte("jeruk")))   // true
}`,
      explain: [
        '<code>bytes.Buffer</code> mengumpulkan data di memori sebelum ditulis/dibaca sekaligus.',
        'Cocok untuk membangun string/berkas secara bertahap lalu menulisnya dengan satu perintah.',
        '<code>bytes.Split</code>, <code>bytes.Contains</code> bekerja pada slice byte (lebih cepat daripada versi string).',
        'Untuk kebutuhan string, package <b>strings</b> memiliki fungsi serupa.'
      ]
    },
    {
      type: 'tip',
      title: 'Selalu tutup berkas dengan defer',
      text: 'Setelah <code>os.Open</code>, langsung tulis <code>defer f.Close()</code>. Ini memastikan berkas ditutup walau terjadi error, sehingga tidak ada kebocoran sumber daya sistem.'
    },
    {
      type: 'warn',
      title: 'os.ReadFile memuat seluruh isi',
      text: 'Untuk berkas berukuran besar (ratusan MB, GB), <code>os.ReadFile</code> bisa menghabiskan memori. Gunakan <code>bufio.Scanner</code> atau membaca dengan buffer berukuran tetap secara bertahap.'
    },
    {
      type: 'vocab',
      items: [
        ['os.File', 'Representasi berkas yang dibuka oleh sistem operasi.'],
        ['os.ReadFile / WriteFile', 'Membaca/menulis berkas utuh dengan cepat.'],
        ['io.Reader / io.Writer', 'Interface fundamental untuk sumber/tujuan data.'],
        ['bufio', 'Buffered I/O agar pembacaan/penulisan berkas besar efisien.'],
        ['bufio.Scanner', 'Membaca input per baris atau per potongan.'],
        ['bytes.Buffer', 'Buffer di memori yang memenuhi Reader & Writer.']
      ]
    }
  ],
  recap: [
    'os.ReadFile dan os.WriteFile cepat untuk berkas kecil.',
    'io.Reader dan io.Writer membuat kode bekerja dengan sumber data apa pun.',
    'bufio.Scanner membaca berkas besar per baris secara hemat memori.',
    'bytes.Buffer mengumpulkan data di memori; package bytes mengolah []byte.',
    'Selalu tutup berkas dengan defer f.Close().'
  ]
});

/* ---------- Pelajaran 28: JSON, XML & CSV ---------- */
window.GO_LESSONS.push({
  id: 'json-xml-csv',
  title: 'Memproses JSON, XML & CSV',
  chapter: 'I/O & Data Format',
  duration: '12 menit',
  intro: [
    'Aplikasi modern bertukar data dalam format terstruktur. Yang paling umum adalah <b>JSON</b> (untuk API web), disusul <b>XML</b> dan <b>CSV</b> (untuk berkas data & laporan).',
    'Pelajaran ini menunjukkan cara membaca dan menulis ketiganya dengan standard library Go — tanpa dependensi tambahan.'
  ],
  objectives: [
    'Membaca dan menulis JSON dengan struct & tag',
    'Mengenal marshaling dan unmarshaling',
    'Membaca/menulis XML',
    'Membaca dan menulis CSV'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Go menangani JSON lewat package <code>encoding/json</code>. Dua operasi utamanya: <b>Marshal</b> (struct → JSON) dan <b>Unmarshal</b> (JSON → struct). Field struct dipetakan ke nama JSON lewat <b>tag</b>.</p>'
    },
    {
      type: 'example',
      title: 'Marshal: struct menjadi JSON',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Pengguna struct {
    Nama   string   ` + "`" + `json:"nama"` + "`" + `
    Umur   int      ` + "`" + `json:"umur"` + "`" + `
    Email  string   ` + "`" + `json:"email,omitempty"` + "`" + `
    Sandi  string   ` + "`" + `json:"-"` + "`" + `          // selalu disembunyikan
    Hobi   []string ` + "`" + `json:"hobi"` + "`" + `
}

func main() {
    u := Pengguna{
        Nama:  "Andi",
        Umur:  27,
        Sandi: "rahasia",
        Hobi:  []string{"baca", "lari"},
    }

    // Marshal -> []byte JSON
    data, err := json.MarshalIndent(u, "", "  ")
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Println(string(data))
}`,
      explain: [
        'Tag <code>json:"nama"</code> memetakan field <code>Nama</code> ke kunci "nama" di JSON.',
        '<code>omitempty</code> menyembunyikan field bila nilainya kosong.',
        'Tag <code>json:"-"</code> membuat field tidak pernah ikut JSON (mis. kata sandi).',
        '<code>MarshalIndent</code> menghasilkan JSON yang rapi dengan indentasi.'
      ]
    },
    {
      type: 'example',
      title: 'Unmarshal: JSON menjadi struct',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Produk struct {
    Nama  string  ` + "`" + `json:"nama"` + "`" + `
    Harga float64 ` + "`" + `json:"harga"` + "`" + `
    Stok  int     ` + "`" + `json:"stok"` + "`" + `
}

func main() {
    teks := ` + "`" + `{"nama":"Kopi","harga":15000,"stok":20}` + "`" + `

    var p Produk
    if err := json.Unmarshal([]byte(teks), &p); err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Printf("%+v\n", p)
    fmt.Println("harga:", p.Harga)
}`,
      explain: [
        '<code>json.Unmarshal</code> mengisi variabel lewat pointer (<code>&p</code>).',
        'Nama kunci JSON dicocokkan dengan tag; tanpa tag, Go mencocokkan nama field secara tidak peka huruf besar-kecil.',
        'Field yang tidak ada di JSON dibiarkan bernilai zero value.',
        'Selalu periksa error dari Unmarshal — format JSON bisa rusak.'
      ]
    },
    {
      type: 'example',
      title: 'JSON dinamis dan streaming',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

func main() {
    // JSON dengan bentuk tidak diketahui -> map[string]any
    var data map[string]any
    json.Unmarshal([]byte(` + "`" + `{"a":1,"b":"dua"}` + "`" + `), &data)
    fmt.Println(data["a"], data["b"])

    // Streaming: decoder membaca dari io.Reader
    dec := json.NewDecoder(strings.NewReader(` + "`" + `{"skor":95}` + "`" + `))
    var hasil map[string]int
    dec.Decode(&hasil)
    fmt.Println("skor:", hasil["skor"])

    // Encoder menulis langsung ke writer
    var sb strings.Builder
    enc := json.NewEncoder(&sb)
    enc.Encode(map[string]int{"x": 1})
    fmt.Print(sb.String())
}`,
      explain: [
        '<code>map[string]any</code> menampung JSON yang strukturnya belum pasti.',
        '<code>json.NewDecoder</code> membaca langsung dari sumber (berkas, jaringan) tanpa memuat semuanya.',
        '<code>json.NewEncoder</code> menulis JSON ke <code>io.Writer</code>.',
        'Streaming lebih hemat memori untuk data besar.'
      ]
    },
    {
      type: 'example',
      title: 'XML: marshal & unmarshal',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/xml"
    "fmt"
)

type Buku struct {
    XMLName xml.Name ` + "`" + `xml:"buku"` + "`" + `
    Judul   string   ` + "`" + `xml:"judul"` + "`" + `
    Tahun   int      ` + "`" + `xml:"tahun"` + "`" + `
}

func main() {
    // Struct -> XML
    b := Buku{Judul: "Belajar Go", Tahun: 2026}
    data, _ := xml.MarshalIndent(b, "", "  ")
    fmt.Println(string(data))

    // XML -> struct
    teks := ` + "`" + `<buku><judul>Go Lanjut</judul><tahun>2025</tahun></buku>` + "`" + `
    var hasil Buku
    if err := xml.Unmarshal([]byte(teks), &hasil); err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Println(hasil.Judul, hasil.Tahun)
}`,
      explain: [
        'Package <code>encoding/xml</code> bekerja mirip <code>encoding/json</code>.',
        'Tag <code>xml:"judul"</code> memetakan field ke elemen XML.',
        '<code>XMLName</code> menentukan nama elemen akar.',
        'XML masih banyak dipakai di sistem lama, konfigurasi, dan layanan enterprise.'
      ]
    },
    {
      type: 'example',
      title: 'CSV: membaca & menulis',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/csv"
    "fmt"
    "os"
    "strings"
)

func main() {
    // Membaca CSV dari string
    isi := "nama,umur\nAndi,27\nBudi,31\n"
    r := csv.NewReader(strings.NewReader(isi))
    baris, err := r.ReadAll()
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    for _, b := range baris {
        fmt.Println(b)   // [nama umur] lalu [Andi 27], dst.
    }

    // Menulis CSV ke berkas
    f, _ := os.Create("keluaran.csv")
    defer f.Close()
    w := csv.NewWriter(f)
    w.WriteAll([][]string{
        {"nama", "kota"},
        {"Citra", "Bandung"},
    })
    w.Flush()

    // Mendukung pemisah lain (mis. titik koma)
    r2 := csv.NewReader(strings.NewReader("a;b;c"))
    r2.Comma = ';'
    rec, _ := r2.Read()
    fmt.Println(rec)
}`,
      explain: [
        '<code>csv.NewReader</code> dan <code>ReadAll</code> membaca seluruh baris.',
        '<code>csv.NewWriter</code> + <code>WriteAll</code> menulis sekumpulan baris.',
        '<code>w.Flush()</code> wajib dipanggil agar data benar-benar ditulis.',
        'Ubah <code>Comma</code> bila berkas memakai pemisah berbeda (mis. titik koma).'
      ]
    },
    {
      type: 'tip',
      title: 'JSON adalah standar API web',
      text: 'Hampir semua REST API modern memakai JSON. Kuasai <code>encoding/json</code> beserta tag-nya — ini keterampilan wajib sebelum membangun layanan web di bab berikutnya.'
    },
    {
      type: 'warn',
      title: 'Field unexported tidak ikut di-marshal',
      text: 'Hanya field yang <b>diawali huruf kapital</b> (exported) yang diproses oleh encoding/json, xml, maupun csv. Field huruf kecil akan diabaikan tanpa peringatan.'
    },
    {
      type: 'vocab',
      items: [
        ['Marshal', 'Mengubah struct menjadi format data (JSON/XML).'],
        ['Unmarshal', 'Mengubah format data menjadi struct.'],
        ['Tag', 'Anotasi pada field untuk memetakan nama kunci (mis. json:"nama").'],
        ['omitempty', 'Opsi tag agar field kosong tidak disertakan.'],
        ['encoding/json', 'Package JSON standard library.'],
        ['encoding/xml', 'Package XML standard library.'],
        ['encoding/csv', 'Package CSV standard library.']
      ]
    }
  ],
  recap: [
    'JSON ditangani encoding/json lewat Marshal dan Unmarshal.',
    'Tag mengatur nama kunci; omitempty menyembunyikan field kosong; "-" selalu menyembunyikannya.',
    'Decoder/Encoder melakukan streaming untuk data besar.',
    'XML mirip JSON dengan package encoding/xml.',
    'CSV dibaca/ditulis dengan encoding/csv; panggil Flush setelah menulis.'
  ]
});
