/* ============================================================
   Pelajaran RabbitMQ — Bab 14: Integrasi Java (Spring AMQP)
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'integrasi-java',
  title: 'Integrasi RabbitMQ dengan Java (Spring AMQP)',
  chapter: 'Integrasi Aplikasi',
  duration: '22–24 menit',
  intro: [
    'Di dunia enterprise, Java masih menjadi salah satu bahasa paling dominan, dan integrasi pesan adalah bagian tak terpisahkan dari arsitektur microservice di sana. RabbitMQ menyediakan dua jalur utama di Java: pustaka rendah level <b>amqp-client</b> dari broker itu sendiri, dan lapisan abstraksi tingkat tinggi <b>Spring AMQP</b> yang mempermudah konfigurasi deklaratif serta integrasi dengan ekosistem Spring.',
    'Bab ini akan memakai Spring AMQP sebagai pilihan utama karena pendekatan konfigurasinya yang rapi dan banyak dipakai di proyek nyata. Kita akan membangun publisher yang mengirim objek Java sebagai JSON, dan listener (consumer) yang memprosesnya dengan mekanisme acknowledgment bawaan, retry, serta penanganan pesan gagal ke dead letter queue.',
    'Meski fokus pada Spring AMQP, kamu akan melihat bahwa prinsip yang sama berlaku: deklarasi antrean, kontrak JSON, acknowledgment, dan penanganan error. Setelah bab ini, kamu bisa menyesuaikan pola ini dengan proyek Spring Boot milikmu sendiri, atau turun ke level amqp-client bila membutuhkan kontrol penuh.'
  ],
  objectives: [
    'Menyiapkan proyek Spring Boot dengan dependensi spring-boot-starter-amqp.',
    'Mengonfigurasi koneksi RabbitMQ, deklarasi antrean, dan pengonversi pesan JSON.',
    'Membuat publisher yang mengirim objek Java dan listener yang memprosesnya.',
    'Menerapkan retry otomatis dan dead letter queue untuk pesan yang terus gagal.'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Siapkan proyek Spring Boot. Kamu bisa memakai Spring Initializr (start.spring.io) atau membuatnya manual. Berikut dependensi utama yang dibutuhkan pada file <code>pom.xml</code>:</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Integrasi Spring AMQP: RabbitTemplate mengirim, @RabbitListener memproses, dengan konverter JSON dan retry DLQ">
        <rect x="30" y="40" width="150" height="50" rx="8" class="u-box"/>
        <text x="105" y="60" class="u-title" text-anchor="middle">RabbitTemplate</text>
        <text x="105" y="80" class="u-lbl" text-anchor="middle">convertAndSend</text>

        <line x1="185" y1="65" x2="265" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="225" y="53" class="u-lbl" text-anchor="middle">JSON</text>

        <rect x="270" y="40" width="150" height="50" rx="8" class="u-hd"/>
        <text x="345" y="60" class="u-title" text-anchor="middle">Queue: tasks</text>
        <text x="345" y="80" class="u-lbl" text-anchor="middle">+ DLX tasks.dlq</text>

        <line x1="425" y1="65" x2="505" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="465" y="53" class="u-lbl" text-anchor="middle">@RabbitListener</text>

        <rect x="510" y="40" width="150" height="50" rx="8" class="u-box"/>
        <text x="585" y="60" class="u-title" text-anchor="middle">TaskListener</text>
        <text x="585" y="80" class="u-lbl" text-anchor="middle">retry otomatis</text>

        <line x1="585" y1="95" x2="585" y2="135" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="660" y="118" class="u-lbl" text-anchor="middle">gagal → retry</text>

        <rect x="30" y="145" width="700" height="45" rx="8" class="u-box"/>
        <text x="380" y="172" class="u-lbl" text-anchor="middle">Spring AMQP mengelola ack, retry, dan DLQ secara deklaratif — tanpa boilerplate</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Integrasi Spring AMQP: RabbitTemplate mengirim JSON, @RabbitListener memproses dengan retry dan DLQ</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Dependensi Spring Boot untuk AMQP',
      lang: 'xml',
      output: false,
      code: `<dependencies>
  <!-- Starter AMQP inti -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
  </dependency>

  <!-- Konversi pesan ke/from JSON -->
  <dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
  </dependency>
</dependencies>`,
      explain: [
        '<code>spring-boot-starter-amqp</code> membawa pustaka amqp-client beserta konfigurasi otomatis Spring untuk koneksi dan template RabbitMQ.',
        '<code>jackson-databind</code> dipakai untuk mengonversi objek Java menjadi JSON dan sebaliknya, sehingga publisher dan listener tidak perlu menangani byte secara manual.',
        'Dengan starter ini, kamu cukup menyediakan properti koneksi dan deklarasi antrean — sisanya ditangani Spring.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi koneksi dan antrean (RabbitConfig.java)',
      lang: 'java',
      output: false,
      code: `import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

  @Bean
  public Queue taskQueue() {
    return new Queue("tasks", true);
  }

  @Bean
  public Jackson2JsonMessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory cf,
                                        Jackson2JsonMessageConverter converter) {
    RabbitTemplate t = new RabbitTemplate(cf);
    t.setMessageConverter(converter);
    return t;
  }
}`,
      explain: [
        'Bean Queue mendeklarasikan antrean tasks dengan durable=true, otomatis dibuat saat aplikasi mulai.',
        'Jackson2JsonMessageConverter mengubah objek Java menjadi JSON saat publish dan mengembalikannya menjadi objek saat diterima listener.',
        'RabbitTemplate adalah padanan Spring dari publisher; dengan mengatur konverter, kamu cukup memanggil convertAndSend dengan objek biasa.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi aplikasi (application.properties)',
      lang: 'properties',
      output: false,
      code: `spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=admin
spring.rabbitmq.password=admin123`,
      explain: [
        'spring.rabbitmq.host dan port menunjuk ke instance RabbitMQ yang berjalan di Podman pada localhost:5672.',
        'Username dan password disetel sesuai kredensial yang kita buat saat setup awal.',
        'Dengan properti ini, Spring membuat ConnectionFactory otomatis — tidak perlu konfigurasi koneksi manual.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sekarang bangun publisher yang mengirim objek tugas, lalu listener yang memprosesnya. Pada Spring AMQP, listener ditandai dengan anotasi <code>@RabbitListener</code> dan Spring yang mengelola thread, acknowledgment, serta retry secara otomatis.</p>'
    },
    {
      type: 'example',
      title: 'Publisher dan Listener (TaskPublisher.java, TaskListener.java)',
      lang: 'java',
      output: false,
      code: `// --- Task.java: model pesan ---
public class Task {
  private int id;
  private String action;
  // constructor, getter, setter
}

// --- TaskPublisher.java ---
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class TaskPublisher {
  private final RabbitTemplate rabbit;

  public TaskPublisher(RabbitTemplate rabbit) {
    this.rabbit = rabbit;
  }

  public void kirim(Task task) {
    rabbit.convertAndSend("tasks", task);
    System.out.println("Tugas terkirim: " + task.getAction());
  }
}

// --- TaskListener.java ---
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class TaskListener {
  @RabbitListener(queues = "tasks")
  public void terima(Task task) throws Exception {
    System.out.println("Memproses: " + task.getAction());
    Thread.sleep(2000); // simulasi kerja
    System.out.println("Selesai: id " + task.getId());
  }
}`,
      explain: [
        'RabbitTemplate.convertAndSend("tasks", task) mengirim objek Task; konverter JSON mengubahnya menjadi byte sebelum masuk antrean.',
        '@RabbitListener(queues = "tasks") mendaftarkan metode sebagai consumer; Spring mengelola acknowledgment secara otomatis — metode sukses berarti pesan diakui.',
        'Bila metode listener melempar exception, Spring menangkapnya dan memicu mekanisme retry yang akan kita konfigurasi berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Retry Otomatis dan DLQ</h3><p>Salah satu keunggulan Spring AMQP adalah kemudahan menambahkan <b>retry otomatis</b> dan <b>dead letter queue</b> tanpa menulis kode boilerplate. Berikut konfigurasi yang membuat listener mencoba ulang tiga kali sebelum mengirim pesan gagal ke antrean dead letter:</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi retry dan DLQ (RabbitConfig.java tambahan)',
      lang: 'java',
      output: false,
      code: `import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RetryConfig {

  @Bean
  public Queue tasksQueueWithDlq() {
    return QueueBuilder.durable("tasks")
      .withArgument("x-dead-letter-exchange", "")
      .withArgument("x-dead-letter-routing-key", "tasks.dlq")
      .build();
  }

  @Bean
  public Queue tasksDlq() {
    return QueueBuilder.durable("tasks.dlq").build();
  }
}`,
      explain: [
        'QueueBuilder dengan withArgument mendeklarasikan antrean yang otomatis mengalirkan pesan gagal ke tasks.dlq melalui default exchange.',
        'Antrean DLQ tasks.dlq dibuat terpisah agar menampung pesan yang terus gagal setelah melewati percobaan retry.',
        'Kombinasi retry interceptor dan DLX inilah pola retry-and-dlq klasik yang menjadi tulang punggung sistem pesan enterprise yang andal.'
      ]
    },
    {
      type: 'tip',
      title: 'Aktifkan Log AMQP saat Pengembangan',
      text: 'Untuk pengembangan lokal, aktifkan log verbose AMQP dengan menambahkan property logging.level.org.springframework.amqp=DEBUG pada application.properties. Ini membantumu melihat detail koneksi, deklarasi antrean, dan alur pesan tanpa harus membuka dashboard terus-menerus.'
    },
    {
      type: 'warn',
      title: 'Kontrak JSON Harus Konsisten',
      text: 'Konversi JSON membutuhkan kontrak yang jelas. Bila struktur JSON di publisher tidak cocok dengan field kelas Java di listener, konversi akan gagal dan pesan masuk ke mekanisme retry lalu DLQ. Selalu pantau DLQ dan log konversi ketika mengubah bentuk pesan antarlayanan.'
    },
    {
      type: 'text',
      html: '<p>Dengan Spring AMQP, kamu telah mengintegrasikan RabbitMQ ke dalam aplikasi Java dengan konfigurasi deklaratif: antrean dan DLQ dideklarasikan sebagai bean, pesan berbentuk JSON berkat konverter, dan listener bekerja tanpa boilerplate acknowledgment. Pola ini siap dipakai langsung di proyek Spring Boot milikmu. Dari sini kita naik ke topik yang lebih besar: menjalankan RabbitMQ sebagai cluster yang tangguh dan bertahan tinggi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Spring AMQP', 'Proyek Spring yang menyediakan abstraksi tingkat tinggi untuk protokol AMQP pada aplikasi Java.'],
        ['amqp-client', 'Pustaka Java resmi dari RabbitMQ untuk AMQP 0-9-1, dipakai langsung tanpa Spring.'],
        ['RabbitTemplate', 'Kelas Spring yang mempermudah mengirim pesan dari kode aplikasi Java.'],
        ['Jackson2JsonMessageConverter', 'Konverter yang mengubah objek Java menjadi JSON dan sebaliknya untuk pesan AMQP.'],
        ['@RabbitListener', 'Anotasi Spring yang mendaftarkan sebuah metode sebagai consumer pesan dari antrean tertentu.']
      ]
    }
  ],
  recap: [
    'Spring AMQP menyediakan konfigurasi deklaratif di atas amqp-client untuk integrasi RabbitMQ pada aplikasi Java/Spring Boot.',
    'RabbitTemplate dengan Jackson2JsonMessageConverter mengirim objek Java sebagai JSON tanpa manipulasi byte manual.',
    '@RabbitListener mendaftarkan metode sebagai consumer; Spring mengelola acknowledgment secara otomatis.',
    'Retry otomatis dan dead letter queue dapat dikonfigurasi lewat QueueBuilder.withArgument dan retry interceptor tanpa kode boilerplate.'
  ]
});
