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

    docker: {
      id: 'docker',
      title: 'Docker',
      tagline: 'Containerisasi Aplikasi',
      icon: 'assets/logos/docker.svg',
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
    }
  };

  const all = Object.values(t);

  function get(id) { return t[id] || null; }

  function readyList() { return all.filter(x => x.status === 'ready'); }

  return { html: t.html, css: t.css, javascript: t.javascript, typescript: t.typescript, git: t.git, sql: t.sql, react: t.react, go: t.go, goweb: t.goweb, docker: t.docker, all, get, readyList };
})();