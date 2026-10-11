/* ============================================================
   Pelajaran Go Web Examples — Bab 5: Database & JSON
   (materi dari https://gowebexamples.com/)
    - "MySQL Database"
    - "JSON"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 10: Database MySQL (database/sql) ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-mysql',
  title: 'Database MySQL dengan database/sql',
  chapter: 'Database & JSON',
  duration: '13 menit',
  intro: [
    'Aplikasi web dinamis hampir selalu butuh database untuk menyimpan pengguna, pesanan, dan sebagainya. Go menyediakan package <b>database/sql</b> yang menyeragamkan akses ke berbagai jenis SQL database.',
    'Pelajaran ini memakai MySQL: memasang driver, membuka koneksi, membuat tabel, lalu menyimpan dan membaca kembali data.'
  ],
  objectives: [
    'Memahami peran database/sql dan driver',
    'Membuka & menguji koneksi MySQL',
    'Menjalankan perintah SQL (Exec, QueryRow, Query)',
    'Memakai prepared statement agar aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Package <b>database/sql</b> menyediakan API umum untuk semua jenis database SQL. Yang tidak dibawa Go adalah <b>driver</b> — package yang tahu detail teknis database tertentu. Untuk MySQL, kita memakai <code>go-sql-driver/mysql</code>.</p>'
    },
    {
      type: 'example',
      title: 'Memasang driver MySQL',
      lang: 'bash',
      output: false,
      code: `go get -u github.com/go-sql-driver/mysql`,
      explain: [
        'Driver diimpor dengan garis bawah (<code>_</code>) karena kita hanya butuh efek samping pendaftarannya.',
        'Pemisahan driver membuat kode tetap kompatibel dengan database lain.'
      ]
    },
    {
      type: 'example',
      title: 'Membuka & menguji koneksi',
      lang: 'go',
      output: false,
      code: `import (
    "database/sql"
    _ "github.com/go-sql-driver/mysql"
)

// sql.Open tidak langsung menyambung, hanya menyiapkan pool.
db, err := sql.Open("mysql", "username:password@(127.0.0.1:3306)/dbname?parseTime=true")
if err != nil {
    log.Fatal(err)
}

// Ping memastikan koneksi benar-benar bisa dibuat.
if err := db.Ping(); err != nil {
    log.Fatal(err)
}`,
      explain: [
        '<code>sql.Open(namaDriver, DSN)</code> menyiapkan koneksi (belum tentu tersambung).',
        '<code>parseTime=true</code> agar kolom DATETIME otomatis menjadi <code>time.Time</code>.',
        '<code>db.Ping()</code> memeriksa koneksi secara nyata.',
        'Selalu periksa error setelah membuka koneksi.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat tabel users',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE users (
    id INT AUTO_INCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (id)
);`,
      explain: [
        'Setiap baris mewakili satu pengguna.',
        '<code>AUTO_INCREMENT</code> membuat id bertambah otomatis.',
        '<code>PRIMARY KEY (id)</code> menjadikan id penanda unik setiap baris.',
        'Kolom <code>created_at</code> menyimpan waktu pembuatan akun.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan perintah pembuatan tabel',
      lang: 'go',
      output: false,
      code: `query := ` + "`" + `
    CREATE TABLE users (
        id INT AUTO_INCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME,
        PRIMARY KEY (id)
    );` + "`" + `

// Exec dipakai untuk perintah yang tidak mengembalikan baris.
_, err := db.Exec(query)
if err != nil {
    log.Fatal(err)
}`,
      explain: [
        '<code>db.Exec</code> menjalankan perintah tanpa hasil baris (CREATE, INSERT, UPDATE, DELETE).',
        'Nilai kembali pertama adalah <code>sql.Result</code>.',
        'Selalu periksa <code>err</code> untuk memastikan perintah berhasil.'
      ]
    },
    {
      type: 'example',
      title: 'Menyimpan pengguna baru & mengambil id',
      lang: 'go',
      output: false,
      code: `import "time"

username := "johndoe"
password := "secret"
createdAt := time.Now()

result, err := db.Exec(
    ` + "`" + `INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)` + "`" + `,
    username, password, createdAt,
)
if err != nil {
    log.Fatal(err)
}

// Id yang dibuat otomatis oleh MySQL.
userID, err := result.LastInsertId()`,
      explain: [
        'Tanda tanya (<code>?</code>) adalah placeholder untuk data yang dikirim terpisah.',
        'Inilah <b>prepared statement</b> yang melindungi dari SQL Injection.',
        '<code>result.LastInsertId()</code> mengambil id baris yang baru saja dibuat.',
        '<code>result.RowsAffected()</code> memberi jumlah baris yang terpengaruh.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil satu pengguna (QueryRow)',
      lang: 'go',
      output: false,
      code: `var (
    id        int
    username  string
    password  string
    createdAt time.Time
)

query := "SELECT id, username, password, created_at FROM users WHERE id = ?"
err := db.QueryRow(query, 1).Scan(&id, &username, &password, &createdAt)
if err != nil {
    log.Fatal(err)
}`,
      explain: [
        '<code>QueryRow</code> mengambil tepat satu baris.',
        '<code>Scan</code> menyalin nilai kolom ke variabel tujuan lewat pointer (<code>&id</code>, dst.).',
        'Bila tidak ada baris, <code>Scan</code> mengembalikan <code>sql.ErrNoRows</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil semua pengguna (Query)',
      lang: 'go',
      output: false,
      code: `type user struct {
    id        int
    username  string
    password  string
    createdAt time.Time
}

rows, err := db.Query(` + "`" + `SELECT id, username, password, created_at FROM users` + "`" + `)
if err != nil {
    log.Fatal(err)
}
defer rows.Close()

var users []user
for rows.Next() {
    var u user
    if err := rows.Scan(&u.id, &u.username, &u.password, &u.createdAt); err != nil {
        log.Fatal(err)
    }
    users = append(users, u)
}
if err := rows.Err(); err != nil {
    log.Fatal(err)
}`,
      explain: [
        '<code>Query</code> mengembalikan banyak baris untuk diiterasi.',
        '<code>defer rows.Close()</code> wajib agar koneksi dikembalikan ke pool.',
        '<code>for rows.Next()</code> berpindah baris demi baris; Scan mengisinya.',
        'Periksa <code>rows.Err()</code> setelah perulangan untuk menangkap error yang terjadi.'
      ]
    },
    {
      type: 'example',
      title: 'Menghapus pengguna',
      lang: 'go',
      output: false,
      code: `_, err := db.Exec(` + "`" + `DELETE FROM users WHERE id = ?` + "`" + `, 1)
if err != nil {
    log.Fatal(err)
}`,
      explain: [
        'DELETE memakai <code>Exec</code> karena tidak mengembalikan baris.',
        'Selalu pakai placeholder (<code>?</code>) — jangan merangkai id ke dalam string kueri.',
        'Polanya sama untuk UPDATE.'
      ]
    },
    {
      type: 'tip',
      title: 'Coba MySQL dengan Docker',
      text: 'Belum punya MySQL? Jalankan kontainer resminya: <code>docker run --name mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql</code>. Ini cara cepat memulai tanpa memasang server database di komputer.'
    },
    {
      type: 'warn',
      title: 'Selalu gunakan prepared statement',
      text: 'driver mysql memakai prepared statement secara default, tetapi jangan pernah merangkai nilai pengguna ke dalam string kueri. Contoh berbahaya: <code>"... WHERE username = \'" + input + "\'"</code> membuka celah SQL Injection.'
    },
    {
      type: 'vocab',
      items: [
        ['database/sql', 'API standar Go untuk mengakses SQL database.'],
        ['Driver', 'Package penerjemah perintah ke database tertentu.'],
        ['DSN', 'Data Source Name — string alamat & kredensial koneksi.'],
        ['db.Exec', 'Menjalankan perintah tanpa hasil baris.'],
        ['QueryRow / Query', 'Mengambil satu / banyak baris.'],
        ['Scan', 'Menyalin nilai kolom ke variabel lewat pointer.'],
        ['Prepared statement', 'Kueri ber-placeholder yang aman dari injection.']
      ]
    }
  ],
  recap: [
    'database/sql menyediakan API umum; driver menyediakan detail database.',
    'sql.Open + db.Ping memastikan koneksi siap.',
    'Exec untuk perintah tanpa baris; QueryRow/Query untuk membaca.',
    'Scan menyalin kolom ke variabel lewat pointer.',
    'Selalu pakai placeholder (?) untuk mencegah SQL Injection.',
    'Tutup rows dengan defer rows.Close().'
  ]
});

/* ---------- Pelajaran 11: Encoding & Decoding JSON ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-json',
  title: 'Encoding & Decoding JSON',
  chapter: 'Database & JSON',
  duration: '9 menit',
  intro: [
    'API modern bertukar data dalam format <b>JSON</b>. Package <b>encoding/json</b> di Go mengubah struct menjadi JSON (encode) dan sebaliknya (decode) dengan mudah.',
    'Pelajaran ini membuat dua endpoint: satu menerima JSON dari klien, satu lagi mengirim JSON ke klien.'
  ],
  objectives: [
    'Mengubah struct menjadi JSON (encode)',
    'Membaca JSON dari request menjadi struct (decode)',
    'Memakai struct tag untuk nama field JSON',
    'Mengenal json.NewDecoder & json.NewEncoder'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Kita mulai dengan struct <code>User</code>. <b>Struct tag</b> setelah setiap field menentukan nama field saat menjadi JSON. Tanpa tag, nama field Go dipakai apa adanya.</p>'
    },
    {
      type: 'example',
      title: 'Struct dengan tag JSON',
      lang: 'go',
      output: false,
      code: `type User struct {
    Firstname string ` + "`" + `json:"firstname"` + "`" + `
    Lastname  string ` + "`" + `json:"lastname"` + "`" + `
    Age       int    ` + "`" + `json:"age"` + "`" + `
}`,
      explain: [
        'Tag <code>json:"firstname"</code> menentukan nama key di JSON.',
        'Menambahkan <code>,omitempty</code> membuat field dilewati bila kosong.',
        'Tag <code>json:"-"</code> menyembunyikan field sepenuhnya.',
        'Nama field struct tetap harus exported (huruf kapital) agar bisa diakses.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca JSON dari request (decode)',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/decode", func(w http.ResponseWriter, r *http.Request) {
    var user User
    json.NewDecoder(r.Body).Decode(&user)

    fmt.Fprintf(w, "%s %s berumur %d tahun!", user.Firstname, user.Lastname, user.Age)
})`,
      explain: [
        '<code>json.NewDecoder(r.Body)</code> membaca aliran body permintaan.',
        '<code>.Decode(&user)</code> mengisi struct; kirim pointer agar terisi.',
        'Body permintaan harus berisi JSON yang valid.',
        'Di kode sungguhan, periksa error hasil Decode.'
      ]
    },
    {
      type: 'example',
      title: 'Mengirim JSON ke klien (encode)',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/encode", func(w http.ResponseWriter, r *http.Request) {
    john := User{
        Firstname: "John",
        Lastname:  "Doe",
        Age:       25,
    }

    json.NewEncoder(w).Encode(john)
})`,
      explain: [
        '<code>json.NewEncoder(w)</code> menulis JSON langsung ke ResponseWriter.',
        'Header Content-Type sebaiknya diset ke <code>application/json</code>.',
        '<code>Encode</code> menambahkan karakter baris baru di akhir.',
        'Untuk mengubah ke <code>[]byte</code>, gunakan <code>json.Marshal</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap JSON',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type User struct {
    Firstname string ` + "`" + `json:"firstname"` + "`" + `
    Lastname  string ` + "`" + `json:"lastname"` + "`" + `
    Age       int    ` + "`" + `json:"age"` + "`" + `
}

func main() {
    http.HandleFunc("/decode", func(w http.ResponseWriter, r *http.Request) {
        var user User
        json.NewDecoder(r.Body).Decode(&user)
        fmt.Fprintf(w, "%s %s is %d years old!", user.Firstname, user.Lastname, user.Age)
    })

    http.HandleFunc("/encode", func(w http.ResponseWriter, r *http.Request) {
        peter := User{Firstname: "John", Lastname: "Doe", Age: 25}
        json.NewEncoder(w).Encode(peter)
    })

    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Dua endpoint: <code>/decode</code> menerima JSON, <code>/encode</code> mengirim JSON.',
        'Coba: <code>curl -XPOST -d\'{"firstname":"Elon","lastname":"Musk","age":48}\' localhost:8080/decode</code>.',
        'Untuk encode: <code>curl localhost:8080/encode</code> menghasilkan JSON.',
        'Package encoding/json adalah cara standar membuat REST API di Go.'
      ]
    },
    {
      type: 'tip',
      title: 'Set header Content-Type untuk respons JSON',
      text: 'Sebelum menulis JSON, set <code>w.Header().Set("Content-Type", "application/json")</code>. Ini membantu klien memahami format balasan dengan benar.'
    },
    {
      type: 'warn',
      title: 'JSON dari luar selalu berupa interface{} sampai di-decode',
      text: 'Bila struktur JSON tidak diketahui, <code>json.Unmarshal</code> bisa menghasilkan <code>map[string]interface{}</code>. Untuk keamanan dan kemudahan, definisikan struct yang jelas dan tetap validasi nilai setelah decode.'
    },
    {
      type: 'vocab',
      items: [
        ['JSON', 'Format teks untuk bertukar data antar aplikasi.'],
        ['encode', 'Mengubah struct Go menjadi JSON.'],
        ['decode', 'Mengubah JSON menjadi struct Go.'],
        ['json.NewEncoder', 'Menulis JSON ke sebuah writer.'],
        ['json.NewDecoder', 'Membaca JSON dari sebuah reader.'],
        ['Struct tag', 'Metadata nama field JSON, mis. json:"age".'],
        ['Content-Type', 'Header penanda format isi respons.']
      ]
    }
  ],
  recap: [
    'encoding/json mengubah struct ke JSON dan sebaliknya.',
    'Struct tag mengatur nama field di JSON.',
    'json.NewDecoder(r.Body).Decode(&v) membaca JSON dari request.',
    'json.NewEncoder(w).Encode(v) menulis JSON ke respons.',
    'Set Content-Type application/json untuk respons JSON.'
  ]
});
