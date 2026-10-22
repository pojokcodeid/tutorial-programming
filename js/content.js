/* ============================================================
   content.js — registry semua tutorial
   Tutorial baru cukup ditambahkan di sini + file pelajarannya.
   ============================================================ */
'use strict';

const CONTENT = (() => {

  const t = {
    html: {
      id: 'html',
      title: 'HTML',
      tagline: 'Bahasa Markah untuk Web',
      icon: 'assets/logos/html.svg',
      color: '#E34F26',
      desc: 'Mulai dari nol: pahami cara menyusun struktur halaman web dengan HTML. Cocok untuk pemula total.',
      status: 'ready',
      sequential: true,
      lessons: (window.HTML_LESSONS || []).slice(),
      quizPool: (window.HTML_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'MDN Web Docs — HTML', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
        { label: 'W3Schools — HTML', url: 'https://www.w3schools.com/Html/' },
        { label: 'web.dev — Belajar HTML', url: 'https://web.dev/learn/html/welcome' }
      ]
    },

    css: {
      id: 'css',
      title: 'CSS',
      tagline: 'Menghias Halaman Web',
      icon: 'assets/logos/css.svg',
      color: '#1572B6',
      desc: 'Belajar mempercantik halaman HTML: warna, tata letak, dan desain responsif.',
      status: 'ready',
      sequential: true,
      lessons: (window.CSS_LESSONS || []).slice(),
      quizPool: (window.CSS_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'MDN Web Docs — CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
        { label: 'W3Schools — CSS', url: 'https://www.w3schools.com/css/' },
        { label: 'web.dev — Belajar CSS', url: 'https://web.dev/learn/css/welcome' }
      ]
    },

    javascript: {
      id: 'javascript',
      title: 'JavaScript',
      tagline: 'Memberi Interaksi ke Halaman',
      icon: 'assets/logos/javascript.svg',
      color: '#F7DF1E',
      desc: 'Bahasa pemrograman untuk membuat halaman web menjadi hidup dan interaktif.',
      status: 'ready',
      sequential: true,
      lessons: (window.JS_LESSONS || []).slice(),
      quizPool: (window.JS_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'JavaScript.info — Tutorial', url: 'https://javascript.info/' },
        { label: 'MDN Web Docs — JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
        { label: 'JavaScript Tutorial', url: 'https://www.javascripttutorial.net/' },
        { label: 'W3Schools — JavaScript', url: 'https://www.w3schools.com/js/' }
      ]
    },

    typescript: {
      id: 'typescript',
      title: 'TypeScript',
      tagline: 'JavaScript yang Lebih Aman',
      icon: 'assets/logos/typescript.svg',
      color: '#3178C6',
      desc: 'JavaScript dengan tipe data yang ketat — hemat bug saat menulis kode berskala besar.',
      status: 'ready',
      sequential: true,
      lessons: (window.TS_LESSONS || []).slice(),
      quizPool: (window.TS_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'TypeScript Tutorial', url: 'https://www.typescripttutorial.net/' },
        { label: 'W3Schools — TypeScript', url: 'https://www.w3schools.com/typescript/' },
        { label: 'Dokumentasi Resmi TypeScript', url: 'https://www.typescriptlang.org/docs/' }
      ]
    },

    git: {
      id: 'git',
      title: 'Git & GitHub',
      tagline: 'Mengelola Versi Kode',
      icon: 'assets/logos/git.svg',
      color: '#F05032',
      desc: 'Menyimpan riwayat perubahan kode dan bekerja sama dalam tim.',
      status: 'ready',
      sequential: true,
      lessons: (window.GIT_LESSONS || []).slice(),
      quizPool: (window.GIT_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Pro Git — Bab Memulai (ID)', url: 'https://git-scm.com/book/id/v2/Memulai-Tentang-Version-Control' },
        { label: 'W3Schools — Git', url: 'https://www.w3schools.com/git/' },
        { label: 'Dokumentasi Resmi Git', url: 'https://git-scm.com/doc' }
      ]
    },

    sql: {
      id: 'sql',
      title: 'SQL',
      tagline: 'Berbicara dengan Database',
      icon: 'assets/logos/sql.svg',
      color: '#4479A1',
      desc: 'Membaca dan mengolah data di database menggunakan bahasa query SQL.',
      status: 'ready',
      sequential: true,
      lessons: (window.SQL_LESSONS || []).slice(),
      quizPool: (window.SQL_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'W3Schools — SQL', url: 'https://www.w3schools.com/sql/default.asp' },
        { label: 'SQL Tutorial', url: 'https://www.sqltutorial.org/' }
      ]
    },

    react: {
      id: 'react',
      title: 'React JS',
      tagline: 'Antarmuka Web Berbasis Komponen',
      icon: 'assets/logos/react.svg',
      color: '#61DAFB',
      desc: 'Membangun aplikasi web modern berbasis komponen dengan React — dari JSX, Hooks, routing, hingga Next.js.',
      status: 'ready',
      sequential: true,
      lessons: (window.REACT_LESSONS || []).slice(),
      quizPool: (window.REACT_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi React — Learn', url: 'https://react.dev/learn' },
        { label: 'W3Schools — React', url: 'https://www.w3schools.com/react/default.asp' },
        { label: 'JavaScript Tutorial — React', url: 'https://www.javascripttutorial.net/react-tutorial/' }
      ]
    },

    reactproject: {
      id: 'reactproject',
      title: 'Contoh Project React JS',
      tagline: 'Satu Proyek Nyata: React + Ant Design + JWT',
      icon: 'assets/logos/react.svg',
      color: '#1677FF',
      desc: 'Proyek praktis membangun Dashboard Toko lengkap dengan React: custom component, routing, Context API, axios, json-server sebagai dummy backend, authentication & authorization, hingga access dan refresh token otomatis — memakai component library Ant Design.',
      status: 'ready',
      sequential: true,
      lessons: (window.REACTPROJECT_LESSONS || []).slice(),
      quizPool: (window.REACTPROJECT_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi React — Learn', url: 'https://react.dev/learn' },
        { label: 'Ant Design — Dokumentasi', url: 'https://ant.design/' },
        { label: 'React Router — Dokumentasi', url: 'https://reactrouter.com/' },
        { label: 'Axios — Dokumentasi', url: 'https://axios-http.com/docs/intro' },
        { label: 'json-server (GitHub typicode)', url: 'https://github.com/typicode/json-server' }
      ]
    },

    go: {
      id: 'go',
      title: 'Go (Golang)',
      tagline: 'Bahasa Cepat untuk Backend & Cloud',
      icon: 'assets/logos/go.svg',
      color: '#00ADD8',
      desc: 'Belajar Go dari nol: dasar bahasa, struct, interface, error handling, concurrency, web & REST API, microservices, hingga Docker & keamanan.',
      status: 'ready',
      sequential: true,
      lessons: (window.GO_LESSONS || []).slice(),
      quizPool: (window.GO_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Go Tutorial — gotutorial.org', url: 'https://www.gotutorial.org/' },
        { label: 'Dokumentasi & Tutorial Resmi Go', url: 'https://go.dev/doc/tutorial/' },
        { label: 'W3Schools — Go', url: 'https://www.w3schools.com/go/index.php' }
      ]
    },

    goweb: {
      id: 'goweb',
      title: 'Go Web Examples',
      tagline: 'Web Go dari Contoh Nyata',
      icon: 'assets/logos/go.svg',
      color: '#00A6C0',
      desc: 'Belajar pengembangan web di Go lewat contoh: HTTP server, routing gorilla/mux, template, form, middleware, sesi, MySQL, JSON, WebSocket, dan hashing password.',
      status: 'ready',
      sequential: true,
      lessons: (window.GOWEB_LESSONS || []).slice(),
      quizPool: (window.GOWEB_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Go Web Examples (sumber materi)', url: 'https://gowebexamples.com/' },
        { label: 'Dokumentasi Resmi net/http', url: 'https://pkg.go.dev/net/http' },
        { label: 'Dokumentasi html/template', url: 'https://pkg.go.dev/html/template' }
      ]
    },

    gorestapi: {
      id: 'gorestapi',
      title: 'Go REST API',
      tagline: 'RESTful API Produksi dengan Go',
      icon: 'assets/logos/go.svg',
      color: '#00838F',
      desc: 'Membangun RESTful API end-to-end dengan Go: arsitektur modular & scalable, database MariaDB, autentikasi JWT + otorisasi berbasis peran, unit testing, hingga integration testing.',
      status: 'ready',
      sequential: true,
      lessons: (window.GORESTAPI_LESSONS || []).slice(),
      quizPool: (window.GORESTAPI_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi net/http', url: 'https://pkg.go.dev/net/http' },
        { label: 'golang-jwt/jwt v5 (GitHub)', url: 'https://github.com/golang-jwt/jwt' },
        { label: 'go-sql-driver/mysql (GitHub)', url: 'https://github.com/go-sql-driver/mysql' },
        { label: 'Dokumentasi MariaDB', url: 'https://mariadb.com/kb/en/documentation/' }
      ]
    },

    gogui: {
      id: 'gogui',
      title: 'Contoh Project Go GUI',
      tagline: 'Todo App Desktop dengan Fyne + Database Bebas',
      icon: 'assets/logos/go.svg',
      color: '#0E7490',
      desc: 'Bangun aplikasi desktop nyata dengan Go: GUI Fyne, arsitektur repository untuk database bebas (SQLite/MySQL/in-memory), CRUD dengan validasi, pencarian & filter, background task aman, testing unit & integrasi, hingga build & rilis aplikasi.',
      status: 'ready',
      sequential: true,
      lessons: (window.GOGUI_LESSONS || []).slice(),
      quizPool: (window.GOGUI_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Situs Resmi Fyne', url: 'https://fyne.io/' },
        { label: 'Dokumentasi Fyne — Getting Started', url: 'https://docs.fyne.io/started/' },
        { label: 'Go Reference — fyne.io/fyne/v2', url: 'https://pkg.go.dev/fyne.io/fyne/v2' }
      ]
    },

    docker: {
      id: 'docker',      title: 'Docker',
      tagline: 'Containerisasi Aplikasi',
      icon: 'assets/logos/docker.png',
      color: '#2496ED',
      desc: 'Belajar Docker dari nol: konsep container, image, Dockerfile, volume, network, Docker Compose, hingga praktik multi-container.',
      status: 'ready',
      sequential: true,
      lessons: (window.DOCKER_LESSONS || []).slice(),
      quizPool: (window.DOCKER_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'The Docker Handbook – freeCodeCamp', url: 'https://www.freecodecamp.org/news/the-docker-handbook/' },
        { label: 'Docker Docs – Get Started', url: 'https://docs.docker.com/get-started/' },
        { label: 'Docker Docs – Reference', url: 'https://docs.docker.com/reference/' }
      ]
    },

    kubernetes: {
      id: 'kubernetes', title: 'Kubernetes',
      tagline: 'Orkestrasi Container',
      icon: 'assets/logos/kubernetes.svg',
      color: '#326CE5',
      desc: 'Belajar Kubernetes dari nol dengan Podman: arsitektur cluster, Pod, Deployment, Service, Ingress, storage, autoscaling, RBAC, hingga Helm, GitOps, dan praktik deploy nyata.',
      status: 'ready',
      sequential: true,
      lessons: (window.KUBERNETES_LESSONS || []).slice(),
      quizPool: (window.KUBERNETES_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi Kubernetes', url: 'https://kubernetes.io/docs/home/' },
        { label: 'Kubernetes Tutorial – Kubernetes.io', url: 'https://kubernetes.io/docs/tutorials/' },
        { label: 'Helm Docs', url: 'https://helm.sh/docs/' },
        { label: 'Podman – generate/play kube', url: 'https://docs.podman.io/en/latest/markdown/podman-generate-kube.1.html' }
      ]
    },

    jenkins: {
      id: 'jenkins', title: 'Jenkins',
      tagline: 'CI/CD dengan Pipeline as Code',
      icon: 'assets/logos/jenkins.svg',
      color: '#D24939',
      desc: 'Belajar Jenkins dari nol secara gratis dengan Podman: konsep CI/CD, instalasi lokal, administrasi & keamanan, Freestyle, Declarative & Scripted Pipeline, webhook dan Multibranch, validasi pull request, agent statis & dinamis container, Shared Library, Configuration as Code, integrasi SonarQube/registry/ArgoCD, hingga 3 proyek praktik ujung ke ujung.',
      status: 'ready',
      sequential: true,
      lessons: (window.JENKINS_LESSONS || []).slice(),
      quizPool: (window.JENKINS_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi Jenkins', url: 'https://www.jenkins.io/doc/' },
        { label: 'Jenkins — Belajar (Tutorial)', url: 'https://www.jenkins.io/learn/tutorials/' },
        { label: 'Jenkinsfile Reference', url: 'https://www.jenkins.io/doc/pipeline/reference/' },
        { label: 'Jenkins Configuration as Code', url: 'https://www.jenkins.io/projects/jcasc/' }
      ]
    },

    rabbitmq: {
      id: 'rabbitmq', title: 'RabbitMQ',
      tagline: 'Message Broker & Antrean Pesan',
      icon: 'assets/logos/rabbitmq.svg',
      color: '#FF6600',
      desc: 'Belajar RabbitMQ dari nol dengan Podman: konsep message broker & AMQP, arsitektur exchange-queue-binding, pola routing (direct, fanout, topic, headers), keandalan pesan (durability, ACK, prefetch, dead letter, TTL, priority), praktik kode Node.js/Go/Java, hingga high availability, keamanan, monitoring, dan production readiness.',
      status: 'ready',
      sequential: true,
      lessons: (window.RABBITMQ_LESSONS || []).slice(),
      quizPool: (window.RABBITMQ_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi RabbitMQ', url: 'https://www.rabbitmq.com/docs' },
        { label: 'RabbitMQ Tutorials', url: 'https://www.rabbitmq.com/tutorials' },
        { label: 'RabbitMQ Management Plugin', url: 'https://www.rabbitmq.com/docs/management' },
        { label: 'RabbitMQ Clustering & Quorum Queues', url: 'https://www.rabbitmq.com/docs/clustering' }
      ]
    },

    k6: {
      id: 'k6', title: 'Grafana k6',
      tagline: 'Performance Testing & Observability',
      icon: 'assets/logos/k6.svg',
      color: '#FF671D',
      desc: 'Belajar performance testing dengan Grafana k6 dari nol hingga mahir: fondasi metrik & SLO, tes pertama, lifecycle & modularisasi script, checks/thresholds/custom metrics, skenario beban (executor VU & arrival rate), API testing lanjutan (autentikasi, correlation, alur multi-langkah), data uji & test suite, membaca hasil, integrasi Prometheus & Grafana, Docker dan CI/CD, hingga analisis bottleneck dan proyek akhir end-to-end.',
      status: 'ready',
      sequential: true,
      lessons: (window.K6_LESSONS || []).slice(),
      quizPool: (window.K6_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Grafana k6 Documentation', url: 'https://grafana.com/docs/k6/latest/' },
        { label: 'Get started with k6', url: 'https://grafana.com/docs/k6/latest/get-started/' },
        { label: 'k6 JavaScript API', url: 'https://grafana.com/docs/k6/latest/javascript-api/' },
        { label: 'k6 Scenarios & Executors', url: 'https://grafana.com/docs/k6/latest/using-k6/scenarios/' },
        { label: 'Grafana Cloud k6', url: 'https://grafana.com/docs/grafana-cloud/testing/k6/' }
      ]
    },

    microservice: {
      id: 'microservice', title: 'Microservices',
      tagline: 'Arsitektur Layanan Terdistribusi dengan Go',
      icon: 'assets/logos/microservices.svg',
      color: '#0EA5E9',
      desc: 'Belajar membangun microservices dari nol dengan Go: REST API & clean architecture, database per service, komunikasi antar-service (timeout, retry, circuit breaker, idempotency), saga & transactional outbox, keamanan JWT, testing, Docker Compose, observability (Prometheus, Grafana, OpenTelemetry), CI/CD, message broker, Kubernetes, hingga proyek akhir Order Management System.',
      status: 'ready',
      sequential: true,
      lessons: (window.MICROSERVICE_LESSONS || []).slice(),
      quizPool: (window.MICROSERVICE_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Microservices — Martin Fowler', url: 'https://martinfowler.com/articles/microservices.html' },
        { label: 'Microsoft — Microservices architecture guide', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices' },
        { label: 'The Twelve-Factor App', url: 'https://12factor.net/' },
        { label: 'Go Documentation', url: 'https://go.dev/doc/' },
        { label: 'OpenTelemetry Documentation', url: 'https://opentelemetry.io/docs/' }
      ]
    },

    redis: {
      id: 'redis',
      title: 'Redis',
      tagline: 'Database In-Memory Cepat untuk Cache & Data',
      icon: 'assets/logos/redis.svg',
      color: '#DC382D',
      desc: 'Belajar Redis dari nol hingga mahir dengan Docker dan Go: fondasi in-memory database & key-value store, redis-cli, struktur data, expiration & key design, pola cache di depan database, integrasi go-redis, transaksi & Lua scripting, pub/sub, streams & distributed locking, session store & rate limiting, persistence, manajemen memori, high availability (sentinel & cluster), monitoring Prometheus + Grafana, Docker & CI/CD, peran Redis di microservices, hingga proyek akhir API produk yang cepat.',
      status: 'ready',
      sequential: true,
      lessons: (window.REDIS_LESSONS || []).slice(),
      quizPool: (window.REDIS_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi Redis', url: 'https://redis.io/docs/latest/' },
        { label: 'Redis Commands Reference', url: 'https://redis.io/docs/latest/commands/' },
        { label: 'go-redis (GitHub redis/go-redis)', url: 'https://github.com/redis/go-redis' },
        { label: 'Redis on Docker Hub', url: 'https://hub.docker.com/_/redis' }
      ]
    },

    fullstack: {
      id: 'fullstack',
      title: 'Contoh Fullstack Microservices',
      tagline: 'Proyek Nyata: TokoKita dengan Go, MariaDB, Redis & RabbitMQ',
      icon: 'assets/logos/microservices.svg',
      color: '#0EA5E9',
      desc: 'Belajar membangun proyek fullstack microservices end-to-end lewat contoh nyata TokoKita: arsitektur & keputusan komunikasi, container Podman rootless, MariaDB per service, backend Go tiga service (product, order, notification), cache Redis cache-aside, RabbitMQ publisher & konsumer idempoten, frontend React + Ant Design di balik proxy nginx, integrasi polling & uji end-to-end, hingga containerisasi multi-stage dan rilis tujuh container.',
      status: 'ready',
      sequential: true,
      lessons: (window.FULLSTACK_LESSONS || []).slice(),
      quizPool: (window.FULLSTACK_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Microservices — Martin Fowler', url: 'https://martinfowler.com/articles/microservices.html' },
        { label: 'The Twelve-Factor App', url: 'https://12factor.net/' },
        { label: 'Podman Documentation', url: 'https://podman.io/docs' },
        { label: 'MariaDB Server Documentation', url: 'https://mariadb.com/kb/en/documentation/' },
        { label: 'Go Documentation', url: 'https://go.dev/doc/' },
        { label: 'Redis Documentation', url: 'https://redis.io/docs/latest/' },
        { label: 'RabbitMQ Documentation', url: 'https://www.rabbitmq.com/docs' },
        { label: 'React Documentation', url: 'https://react.dev/' },
        { label: 'Ant Design Documentation', url: 'https://ant.design/docs/react/introduce' },
        { label: 'Vite Documentation', url: 'https://vite.dev/guide/' }
      ]
    },

    microfrontend: {
      id: 'microfrontend',
      title: 'Micro-Frontend',
      tagline: 'Frontend Banyak Tim, Satu Aplikasi',
      icon: 'assets/logos/microfrontend.svg',
      color: '#6366F1',
      desc: 'Belajar arsitektur micro-frontend dari nol hingga proyek nyata: konsep & teknik komposisi, shell dengan routing dan lazy loading, event bus serta shared state, isolasi gaya dengan design tokens, data/API/BFF/autentikasi, build monorepo & Module Federation, pengujian dan error boundary, tim CI/CD dengan migrasi strangler fig, ditutup proyek contoh TokoMicro yang bisa langsung dijalankan.',
      status: 'ready',
      sequential: true,
      lessons: (window.MICROFRONTEND_LESSONS || []).slice(),
      quizPool: (window.MICROFRONTEND_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Micro Frontends — Martin Fowler', url: 'https://martinfowler.com/articles/micro-frontends.html' },
        { label: 'Cam Jackson — Micro Frontends in Action (Manning)', url: 'https://www.manning.com/books/micro-frontends-in-action' },
        { label: 'Module Federation Documentation', url: 'https://webpack.js.org/concepts/module-federation/' },
        { label: 'MDN — Web Components', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components' },
        { label: 'Vite Documentation', url: 'https://vite.dev/guide/' },
        { label: 'Single-spa Documentation', url: 'https://single-spa.js.org/docs/getting-started-overview/' }
      ]
    },

    uml: {
      id: 'uml',
      title: 'UML',
      tagline: 'Merancang Sistem dengan Diagram',
      icon: 'assets/logos/uml.svg',
      color: '#7C3AED',
      desc: 'Belajar Unified Modeling Language dari nol hingga lanjutan: analisis & desain OO, 14 diagram UML 2.0 (struktural & perilaku), lengkap dengan contoh dan studi kasus nyata.',
      status: 'ready',
      sequential: true,
      lessons: (window.UML_LESSONS || []).slice(),
      quizPool: (window.UML_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Introduction to UML — Starter Tutorials', url: 'https://www.startertutorials.com/uml/introduction-to-uml.html' },
        { label: 'Wikipedia — Unified Modeling Language', url: 'https://en.wikipedia.org/wiki/Unified_Modeling_Language' },
        { label: 'freeCodeCamp — UML Diagrams Full Course', url: 'https://www.freecodecamp.org/news/uml-diagrams-full-course/' },
        { label: 'TutorialsPoint — UML', url: 'https://www.tutorialspoint.com/uml/index.htm' }
      ]
    },

    lucee: {
      id: 'lucee',
      title: 'Lucee CFML',
      tagline: 'Bahasa Server CFML Open Source',
      icon: 'assets/logos/cfml.svg',
      color: '#01798A',
      desc: 'Belajar Lucee CFML dari nol hingga mahir: sintaks tag & cfscript, variabel dan scope, database dengan CRUD aman, ORM, CFC & OOP, REST API, lifecycle Application.cfc, konfigurasi & cache, integrasi Java, testing, hingga Docker, deployment & keamanan. Untuk proyek praktis membangun framework MVC sendiri, lanjut ke materi Framework MVC (Lucee CFML).',
      status: 'ready',
      sequential: true,
      lessons: (window.LUCEE_LESSONS || []).slice(),
      quizPool: (window.LUCEE_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi Lucee', url: 'https://docs.lucee.org/index.html' },
        { label: 'Lucee GitBook — Rory Laitila', url: 'https://rorylaitila.gitbooks.io/lucee/content/' },
        { label: 'CommandBox Book — Ortus Solutions', url: 'https://commandbox.ortusbooks.com/' }
      ]
    },

    luceemvc: {
      id: 'luceemvc',
      title: 'Framework MVC (Lucee CFML)',
      tagline: 'Proyek Praktis: Framework Buatan Sendiri',
      icon: 'assets/logos/cfml.svg',
      color: '#026E7E',
      desc: 'Proyek praktis membangun framework MVC ringan dari nol dengan Lucee CFML: struktur folder & front controller, URL rewrite CommandBox, konfigurasi .env, mesin routing berparameter, controller & view dengan flash message, model dengan query aman & validasi bergaya Laravel, hingga checklist rilis produksi.',
      status: 'ready',
      sequential: true,
      lessons: (window.LUCEEMVC_LESSONS || []).slice(),
      quizPool: (window.LUCEEMVC_QUIZ_POOL || []).slice(),
      refs: [
        { label: 'Dokumentasi Resmi Lucee', url: 'https://docs.lucee.org/index.html' },
        { label: 'CommandBox Book — Ortus Solutions', url: 'https://commandbox.ortusbooks.com/' },
        { label: 'cfml-mvc-framework — GitHub (pojokcodeid)', url: 'https://github.com/pojokcodeid/cfml-mvc-framework' }
      ]
    }
  };

  const all = Object.values(t);

  function get(id) { return t[id] || null; }

  function readyList() { return all.filter(x => x.status === 'ready'); }

  return { html: t.html, css: t.css, javascript: t.javascript, typescript: t.typescript, git: t.git, sql: t.sql, react: t.react, reactproject: t.reactproject, go: t.go, goweb: t.goweb, gorestapi: t.gorestapi, gogui: t.gogui, docker: t.docker, kubernetes: t.kubernetes, jenkins: t.jenkins, rabbitmq: t.rabbitmq, k6: t.k6, microservice: t.microservice, redis: t.redis, fullstack: t.fullstack, microfrontend: t.microfrontend, uml: t.uml, lucee: t.lucee, luceemvc: t.luceemvc, all, get, readyList };
})();