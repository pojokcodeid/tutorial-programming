/* ============================================================
   Pelajaran RabbitMQ — Bab 13: Integrasi Go (amqp091-go)
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'integrasi-go',
  title: 'Integrasi RabbitMQ dengan Go (amqp091-go)',
  chapter: 'Integrasi Aplikasi',
  duration: '20–22 menit',
  intro: [
    'Bahasa Go dikenal karena performanya yang tinggi dan model konkurensinya yang rapi, sehingga menjadi pilihan populer untuk layanan pemrosesan pesan berskala besar. Untuk berbicara dengan RabbitMQ, ekosistem Go memakai pustaka <b>amqp091-go</b> — fork dari pustaka streadway/amqp yang aktif dirawat dan mengikuti perkembangan AMQP 0-9-1.',
    'Bab ini akan membangun kembali pola yang sama persis dengan bab Node.js, tetapi dengan idiom Go: struct untuk memodelkan pesan, goroutine dan channel untuk menangani beberapa worker, serta <code>defer</code> untuk memastikan koneksi selalu ditutup dengan rapi. Dengan membandingkan kedua implementasi, kamu akan melihat bahwa konsep AMQP bersifat universal — hanya sintaks dan gaya penanganan konkurensinya yang berbeda.',
    'Setelah bab ini, kamu akan memiliki dua program Go siap jalankan: publisher tugas dan worker dengan acknowledgment serta graceful shutdown. Kedua program ini menjadi contoh bagaimana membangun layanan antrean yang andal di Go tanpa framework berat.'
  ],
  objectives: [
    'Memasang pustaka amqp091-go dengan modul Go (go mod).',
    'Menulis program publisher yang mengirim pesan JSON ke antrean RabbitMQ.',
    'Menulis program consumer yang memakai goroutine, manual acknowledgment, dan prefetch.',
    'Menerapkan graceful shutdown dengan signal handling dan defer.'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Siapkan proyek Go dan pasang pustaka amqp091-go. Pastikan kamu memiliki instalasi Go versi 1.21 atau lebih baru di mesinmu.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Alur worker queue Go dengan goroutine, Qos prefetch, dan signal handling untuk graceful shutdown">
        <rect x="30" y="40" width="130" height="50" rx="8" class="u-box"/>
        <text x="95" y="70" class="u-title" text-anchor="middle">main.go</text>

        <line x1="165" y1="65" x2="245" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="205" y="53" class="u-lbl" text-anchor="middle">PublishWithContext</text>

        <rect x="250" y="40" width="170" height="50" rx="8" class="u-hd"/>
        <text x="335" y="60" class="u-title" text-anchor="middle">Queue: tasks</text>
        <text x="335" y="80" class="u-lbl" text-anchor="middle">durable</text>

        <line x1="425" y1="65" x2="505" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="465" y="53" class="u-lbl" text-anchor="middle">ch.Qos(1,0,false)</text>

        <rect x="510" y="40" width="150" height="50" rx="8" class="u-box"/>
        <text x="585" y="70" class="u-title" text-anchor="middle">worker.go</text>
        <text x="585" y="90" class="u-lbl" text-anchor="middle">goroutine</text>

        <line x1="585" y1="95" x2="585" y2="135" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="660" y="118" class="u-lbl" text-anchor="middle">d.Ack / d.Nack</text>

        <rect x="30" y="145" width="700" height="45" rx="8" class="u-box"/>
        <text x="380" y="172" class="u-lbl" text-anchor="middle">Graceful shutdown: signal.Notify(SIGINT/SIGTERM) → defer tutup channel &amp; koneksi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Worker queue Go: publisher memakai PublishWithContext, worker memakai goroutine dengan Qos prefetch</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menyiapkan modul Go dan memasang amqp091-go',
      lang: 'bash',
      output: false,
      code: `# Buat folder proyek dan inisialisasi modul
mkdir rabbitmq-go && cd rabbitmq-go
go mod init rabbitmq-go

# Pasang pustaka AMQP untuk Go
go get github.com/rabbitmq/amqp091-go

# Pastikan RabbitMQ sudah berjalan
podman ps --filter name=rabbitmq-server`,
      explain: [
        '<code>go mod init</code> membuat file go.mod yang mendefinisikan modul dan dependensi proyekmu.',
        '<code>github.com/rabbitmq/amqp091-go</code> adalah pustaka AMQP 0-9-1 yang dirawat komunitas RabbitMQ; ini penerus dari streadway/amqp yang sudah tidak dirawat.',
        'Memeriksa container memastikan broker aktif sebelum program mencoba koneksi — kegagalan koneksi Go akan langsung terlihat sebagai error yang harus ditangani.'
      ]
    },
    {
      type: 'example',
      title: 'main.go (publisher) — mengirim tugas ke antrean',
      lang: 'go',
      output: false,
      code: `package main

import (
  "encoding/json"
  "fmt"
  "log"

  amqp "github.com/rabbitmq/amqp091-go"
)

type Task struct {
  ID     int    \`json:"id"\`
  Action string \`json:"action"\`
  File   string \`json:"file"\`
}

func main() {
  conn, err := amqp.Dial("amqp://admin:admin123@localhost:5672/")
  if err != nil {
    log.Fatal("Gagal koneksi:", err)
  }
  defer conn.Close()

  ch, err := conn.Channel()
  if err != nil {
    log.Fatal("Gagal buat channel:", err)
  }
  defer ch.Close()

  q, err := ch.QueueDeclare(
    "tasks",  // nama
    true,     // durable
    false,    // autoDelete
    false,    // exclusive
    false,    // noWait
    nil,      // args
  )
  if err != nil {
    log.Fatal("Gagal deklarasi antrean:", err)
  }

  task := Task{ID: 1, Action: "resize-image", File: "photo.jpg"}
  body, _ := json.Marshal(task)

  err = ch.PublishWithContext(
    "",     // default exchange
    q.Name, // routing key = nama antrean
    false,  // mandatory
    false,  // immediate
    amqp.Publishing{
      ContentType:  "application/json",
      DeliveryMode: amqp.Persistent,
      Body:         body,
    },
  )
  if err != nil {
    log.Fatal("Gagal kirim pesan:", err)
  }

  fmt.Println("Tugas terkirim:", task.Action)
}`,
      explain: [
        '<code>defer conn.Close()</code> dan <code>defer ch.Close()</code> memastikan koneksi dan channel ditutup walau program keluar lebih awal karena error — idiom Go untuk pembersihan sumber daya.',
        '<code>QueueDeclare</code> mendeklarasikan antrean tasks dengan durable=true, sama dengan implementasi Node.js — antrean akan selamat dari restart broker.',
        '<code>PublishWithContext</code> mengirim pesan dengan DeliveryMode: amqp.Persistent agar ikut terdorong ke disk; fungsi ini juga menerima context untuk membatasi waktu kirim bila diperlukan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Jalankan publisher dengan <code>go run main.go</code>. Pesan masuk ke antrean dan menunggu worker. Sekarang bangun sisi consumer-nya, kali ini dengan sentuhan konkurensi khas Go.</p>'
    },
    {
      type: 'example',
      title: 'worker.go — memproses tugas dengan goroutine dan acknowledgment',
      lang: 'go',
      output: false,
      code: `package main

import (
  "encoding/json"
  "fmt"
  "log"
  "os"
  "os/signal"
  "syscall"
  "time"

  amqp "github.com/rabbitmq/amqp091-go"
)

type Task struct {
  ID     int    \`json:"id"\`
  Action string \`json:"action"\`
}

func main() {
  conn, err := amqp.Dial("amqp://admin:admin123@localhost:5672/")
  if err != nil { log.Fatal("Gagal koneksi:", err) }
  defer conn.Close()

  ch, err := conn.Channel()
  if err != nil { log.Fatal("Gagal channel:", err) }
  defer ch.Close()

  q, _ := ch.QueueDeclare("tasks", true, false, false, false, nil)

  // Batasi pesan unacknowledged per worker
  if err := ch.Qos(1, 0, false); err != nil {
    log.Fatal("Gagal set prefetch:", err)
  }

  msgs, err := ch.Consume(
    q.Name, // antrean
    "",     // consumer tag otomatis
    false,  // autoAck: false — manual ack
    false,  // exclusive
    false,  // noLocal
    false,  // noWait
    nil,    // args
  )
  if err != nil { log.Fatal("Gagal konsumsi:", err) }

  // Tangani sinyal berhenti (SIGINT/SIGTERM)
  stop := make(chan os.Signal, 1)
  signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

  go func() {
    for d := range msgs {
      var task Task
      if err := json.Unmarshal(d.Body, &task); err != nil {
        fmt.Println("Body tidak valid, ditolak:", err)
        d.Nack(false, false)
        continue
      }
      fmt.Println("Memproses:", task.Action, "id", task.ID)
      time.Sleep(2 * time.Second) // simulasi kerja
      d.Ack(false)
      fmt.Println("Selesai:", task.ID)
    }
  }()

  fmt.Println("Worker siap, menunggu tugas...")
  <-stop // blokir sampai sinyal berhenti diterima

  fmt.Println("Menerima sinyal berhenti, menutup koneksi dengan rapi...")
}`,
      explain: [
        '<code>ch.Qos(1, 0, false)</code> adalah padanan Go dari prefetch=1 — membatasi satu pesan unacknowledged per worker agar beban terdistribusi adil.',
        'Parameter <code>autoAck:false</code> pada ch.Consume menyalakan mode manual acknowledgment; worker memanggil d.Ack(false) hanya setelah pekerjaan benar-benar selesai.',
        'Goroutine berjalan memproses pesan sementara goroutine utama menunggu sinyal OS pada &lt;-stop; ketika SIGINT/SIGTERM tiba, defer menutup channel dan koneksi dengan rapi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Jalankan worker dengan <code>go run worker.go</code> di beberapa terminal. Setiap instance akan menerima tugas secara adil. Perhatikan di dashboard RabbitMQ: kolom <i>Consumers</i> bertambah dan <i>Unacknowledged</i> bergerak mengikuti pekerjaan yang sedang berjalan.</p>'
    },
    {
      type: 'tip',
      title: 'Sesuaikan Qos dengan Profil Tugas',
      text: 'Dalam produksi, pertimbangkan memanggil ch.Qos dengan nilai prefetch lebih besar (misal 10–50) bila tugasnya ringan dan I/O-bound. Untuk tugas berat atau yang memakai sumber daya terbatas (koneksi database, GPU), pertahankan prefetch kecil agar tidak membanjiri worker.'
    },
    {
      type: 'text',
      html: '<p>Perhatikan bahwa meski bahasanya berbeda, struktur programnya identik dengan versi Node.js: koneksikan, buat channel, deklarasikan antrean, atur prefetch, konsumsi dengan manual ack, lalu tutup dengan rapi. Konsep AMQP — channel, queue, acknowledgment — memang tidak terikat bahasa tertentu. Inilah yang membuat RabbitMQ mudah diadopsi lintas teknologi.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Abaikan Error',
      text: 'Hati-hati dengan nilai kembali error yang diabaikan (menggunakan tanda _). Di contoh ini disederhanakan untuk kejelasan, tetapi pada kode produksi selalu periksa error deklarasi antrean dan seterusnya — kesalahan konfigurasi yang senyap jauh lebih sulit didebug daripada yang langsung fatal.'
    },
    {
      type: 'text',
      html: '<p>Kamu kini memiliki contoh Go yang lengkap untuk pola worker queue. Konsep yang sama — deklarasi antrean, prefetch, manual ack, graceful shutdown — akan kita lihat lagi pada bab Java, di mana ekosistem Spring AMQP menyediakan lapisan abstraksi lebih tinggi yang mempermudah integrasi dengan aplikasi enterprise.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['amqp091-go', 'Pustaka Go untuk protokol AMQP 0-9-1, dirawat oleh organisasi RabbitMQ sebagai penerus streadway/amqp.'],
        ['Qos (Quality of Service)', 'Konfigurasi prefetch pada Go; membatasi jumlah pesan unacknowledged per consumer.'],
        ['DeliveryMode amqp.Persistent', 'Penanda pesan yang harus disimpan ke disk agar bertahan restart broker.'],
        ['goroutine', 'Unit eksekusi ringan khas Go; dipakai untuk memproses pesan secara konkuren di worker.'],
        ['Graceful Shutdown', 'Berhenti tertib dengan membatalkan consumer lebih dulu, lalu menutup channel dan koneksi.']
      ]
    }
  ],
  recap: [
    'Pustaka amqp091-go adalah penerus amqp yang aktif dirawat untuk RabbitMQ di ekosistem Go.',
    'Publisher Go memakai QueueDeclare untuk membuat antrean durable dan PublishWithContext dengan DeliveryMode amqp.Persistent.',
    'Consumer memakai ch.Qos(1, 0, false) sebagai padanan prefetch dan ch.Consume dengan autoAck:false untuk manual acknowledgment.',
    'Graceful shutdown dicapai dengan menangani sinyal SIGINT/SIGTERM lalu memanfaatkan defer untuk menutup channel dan koneksi.'
  ]
});
