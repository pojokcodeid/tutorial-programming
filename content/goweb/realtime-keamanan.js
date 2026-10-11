/* ============================================================
   Pelajaran Go Web Examples — Bab 6: Realtime & Keamanan
   (materi dari https://gowebexamples.com/)
    - "Websockets"
    - "Password Hashing"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 12: WebSocket (Echo Server) ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-websockets',
  title: 'WebSocket: Server Echo',
  chapter: 'Realtime & Keamanan',
  duration: '11 menit',
  intro: [
    'HTTP biasa bersifat "kirim lalu tutup" — server tidak bisa mendorong pesan ke browser. Untuk komunikasi <b>dua arah</b> yang hidup terus, kita memakai <b>WebSocket</b>.',
    'Pelajaran ini membuat server WebSocket sederhana yang mengirim balik (echo) setiap pesan yang diterimanya, memakai library gorilla/websocket.'
  ],
  objectives: [
    'Memahami apa itu WebSocket',
    'Memasang library gorilla/websocket',
    'Mengupgrade koneksi HTTP menjadi WebSocket',
    'Membaca & menulis pesan secara berulang'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>WebSocket membuka koneksi <b>persisten</b> antara browser dan server. Setelah tersambung, keduanya bisa saling mengirim pesan kapan saja tanpa membuka permintaan HTTP baru. Di Go, library populer untuk ini adalah <b>gorilla/websocket</b>.</p>'
    },
    {
      type: 'example',
      title: 'Memasang gorilla/websocket',
      lang: 'bash',
      output: false,
      code: `go get github.com/gorilla/websocket`,
      explain: [
        'Setelah terpasang, aplikasi bisa mengupgrade koneksi HTTP menjadi WebSocket.',
        'Library ini menangani detail protokol yang rumit untuk kita.'
      ]
    },
    {
      type: 'example',
      title: 'Upgrader & loop echo',
      lang: 'go',
      output: false,
      code: `var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func echo(w http.ResponseWriter, r *http.Request) {
    // Ubah koneksi HTTP menjadi WebSocket.
    conn, _ := upgrader.Upgrade(w, r, nil)

    for {
        // Baca pesan dari browser.
        msgType, msg, err := conn.ReadMessage()
        if err != nil {
            return // koneksi ditutup
        }

        fmt.Printf("%s mengirim: %s\\n", conn.RemoteAddr(), string(msg))

        // Kirim pesan yang sama kembali ke browser.
        if err = conn.WriteMessage(msgType, msg); err != nil {
            return
        }
    }
}`,
      explain: [
        '<code>upgrader.Upgrade</code> mengubah permintaan HTTP menjadi koneksi WebSocket.',
        '<code>conn.ReadMessage</code> menerima satu pesan; mengembalikan error saat koneksi ditutup.',
        '<code>conn.WriteMessage</code> mengirim pesan kembali ke klien.',
        'Loop tak berujung menjaga koneksi tetap melayani pesan bergantian.'
      ]
    },
    {
      type: 'example',
      title: 'Halaman HTML WebSocket',
      lang: 'html',
      output: false,
      code: `<input id="input" type="text" />
<button onclick="send()">Kirim</button>
<pre id="output"></pre>
<script>
    var input = document.getElementById("input");
    var output = document.getElementById("output");
    var socket = new WebSocket("ws://localhost:8080/echo");

    socket.onopen = function () {
        output.innerHTML += "Status: Tersambung\\n";
    };

    socket.onmessage = function (e) {
        output.innerHTML += "Server: " + e.data + "\\n";
    };

    function send() {
        socket.send(input.value);
        input.value = "";
    }
<\/script>`,
      explain: [
        '<code>new WebSocket(url)</code> membuka koneksi ke endpoint server.',
        '<code>onopen</code> dipanggil saat koneksi siap; <code>onmessage</code> saat ada pesan masuk.',
        '<code>socket.send(...)</code> mengirim pesan ke server.',
        'Perhatikan protokol <code>ws://</code> (bukan http) — di produksi gunakan <code>wss://</code> lewat HTTPS.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap server WebSocket',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func main() {
    http.HandleFunc("/echo", func(w http.ResponseWriter, r *http.Request) {
        conn, _ := upgrader.Upgrade(w, r, nil)

        for {
            msgType, msg, err := conn.ReadMessage()
            if err != nil {
                return
            }

            fmt.Printf("%s mengirim: %s\\n", conn.RemoteAddr(), string(msg))

            if err = conn.WriteMessage(msgType, msg); err != nil {
                return
            }
        }
    })

    // Sajikan halaman HTML yang memuat skrip WebSocket.
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "websockets.html")
    })

    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Route <code>/echo</code> menangani koneksi WebSocket.',
        'Route <code>/</code> menyajikan halaman HTML-nya.',
        'Jalankan dengan <code>go run websockets.go</code> lalu buka <code>http://localhost:8080/</code>.',
        'Setiap pesan yang dikirim akan muncul kembali di layar (echo).'
      ]
    },
    {
      type: 'tip',
      title: 'Satu goroutine per koneksi untuk aplikasi nyata',
      text: 'Contoh ini menangani baca & tulis dalam satu loop. Untuk aplikasi berskala, pisahkan goroutine pembaca dan penulis per koneksi, dan gunakan channel untuk mengirim pesan (mis. chat atau broadcast).'
    },
    {
      type: 'warn',
      title: 'WebSocket tetap butuh autentikasi & otorisasi',
      text: 'WebSocket tidak otomatis mewarisi perlindungan HTTP. Periksa identitas pengguna (mis. token/cookie) saat handshake, batasi asal (origin), dan jangan mempercayai pesan dari klien begitu saja.'
    },
    {
      type: 'vocab',
      items: [
        ['WebSocket', 'Protokol komunikasi dua arah lewat satu koneksi persisten.'],
        ['Upgrade', 'Mengubah koneksi HTTP menjadi WebSocket.'],
        ['ReadMessage / WriteMessage', 'Membaca & menulis pesan WebSocket.'],
        ['ws:// / wss://', 'Skema WebSocket (wss = versi aman lewat TLS).'],
        ['Origin', 'Asal permintaan; penting untuk membatasi akses.'],
        ['Persistent connection', 'Koneksi yang tetap terbuka untuk waktu lama.']
      ]
    }
  ],
  recap: [
    'WebSocket memberi komunikasi dua arah dengan satu koneksi persisten.',
    'gorilla/websocket menyediakan Upgrader dan koneksi.',
    'ReadMessage/WriteMessage dipakai dalam loop.',
    'Halaman klien memakai new WebSocket(url) dan event onmessage.',
    'Autentikasi & pembatasan origin tetap wajib.'
  ]
});

/* ---------- Pelajaran 13: Hashing Password dengan bcrypt ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-password-hashing',
  title: 'Hashing Password dengan bcrypt',
  chapter: 'Realtime & Keamanan',
  duration: '9 menit',
  intro: [
    'Jangan pernah menyimpan kata sandi dalam bentuk asli (plain text)! Bila database bocor, semua akun langsung terancam. Kata sandi harus di-<b>hash</b> memakai algoritma yang dirancang lambat, seperti <b>bcrypt</b>.',
    'Pelajaran ini membuat fungsi untuk meng-hash kata sandi dan memeriksa kecocokannya.'
  ],
  objectives: [
    'Memahami mengapa kata sandi harus di-hash',
    'Memahami fungsi salt pada bcrypt',
    'Membuat hash dengan bcrypt',
    'Memverifikasi kata sandi dengan hash'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Hashing</b> mengubah kata sandi menjadi rangkaian karakter yang tidak bisa dibalik. Saat pengguna login, kita hash lagi kata sandi yang diketik lalu membandingkannya dengan hash tersimpan. bcrypt juga menambahkan <b>salt</b> acak sehingga dua kata sandi yang sama menghasilkan hash berbeda.</p>'
    },
    {
      type: 'example',
      title: 'Memasang library bcrypt',
      lang: 'bash',
      output: false,
      code: `go get golang.org/x/crypto/bcrypt`,
      explain: [
        'bcrypt adalah algoritma hashing yang sengaja dibuat lambat agar sulit dipecahkan paksa (brute force).',
        'Library resmi Go menyediakannya di golang.org/x/crypto.'
      ]
    },
    {
      type: 'example',
      title: 'Fungsi hash & verifikasi',
      lang: 'go',
      output: false,
      code: `func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}`,
      explain: [
        '<code>GenerateFromPassword</code> membuat hash dari kata sandi.',
        'Angka <code>14</code> adalah <i>cost</i> — semakin tinggi semakin lambat & aman (default 10).',
        '<code>CompareHashAndPassword</code> memeriksa apakah kata sandi cocok dengan hash.',
        'Fungsi mengembalikan <code>nil</code> bila cocok, error bila tidak.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh pemakaian',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"

    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "secret"
    hash, _ := HashPassword(password)

    fmt.Println("Password:", password)
    fmt.Println("Hash:    ", hash)

    match := CheckPasswordHash(password, hash)
    fmt.Println("Cocok:   ", match)
}`,
      explain: [
        'Hash yang dihasilkan menyertakan salt, jadi panjangnya tetap konsisten.',
        'Contoh keluaran hash: <code>$2a$14$ajq8Q7fb...</code>.',
        'Verifikasi dengan kata sandi benar menghasilkan <code>Cocok: true</code>.',
        'Simpan string hash inilah ke kolom password di database.'
      ]
    },
    {
      type: 'text', // storage
      html: '<p>Alur lengkap pada aplikasi login: <b>(1)</b> saat mendaftar, hash kata sandi lalu simpan hasilnya; <b>(2)</b> saat login, ambil hash dari database lalu panggil <code>CompareHashAndPassword</code>. Jangan pernah menyimpan kata sandi asli, dan jangan memakai hash cepat seperti MD5/SHA-1 untuk kata sandi.</p>'
    },
    {
      type: 'tip',
      title: 'Atur cost sesuai kemampuan server',
      text: 'Cost bcrypt menambah waktu komputasi. Nilai 10–14 umum dipakai. Ukur sehingga proses login tetap nyaman (mis. < 250 ms) untuk pengguna, tetapi cukup berat bagi penyerang.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah menyimpan kata sandi asli',
      text: 'Menyimpan plain text berarti kebocoran database = semua akun jatuh. Gunakan bcrypt (atau argon2) dengan salt otomatis. Ini aturan keamanan paling dasar dan tidak bisa ditawar.'
    },
    {
      type: 'vocab',
      items: [
        ['Hashing', 'Mengubah data menjadi kode satu arah yang tidak bisa dibalik.'],
        ['Salt', 'Nilai acak yang ditambahkan agar hash tiap pengguna berbeda.'],
        ['bcrypt', 'Algoritma hashing kata sandi yang lambat & aman.'],
        ['Cost', 'Tingkat kesulitan bcrypt; makin besar makin lambat.'],
        ['GenerateFromPassword', 'Membuat hash dari kata sandi.'],
        ['CompareHashAndPassword', 'Memverifikasi kata sandi terhadap hash.'],
        ['Plain text', 'Kata sandi mentah yang tidak boleh disimpan.']
      ]
    }
  ],
  recap: [
    'Kata sandi harus di-hash, jangan pernah disimpan asli.',
    'bcrypt lambat dan menambahkan salt secara otomatis.',
    'GenerateFromPassword membuat hash; cost mengatur kekuatannya.',
    'CompareHashAndPassword memverifikasi kata sandi saat login.',
    'Jangan pakai MD5/SHA-1 untuk kata sandi.'
  ]
});
