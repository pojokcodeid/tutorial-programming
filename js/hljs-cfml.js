/* ============================================================
   hljs-cfml.js — mendaftarkan bahasa CFML (ColdFusion Markup
   Language / Lucee) ke highlight.js lokal.
   Highlight.js bawaan tidak memuat grammar CFML, sehingga kode
   <cfset>, <cfif>, blok cfscript, dan ekspresi #variabel# akan
   tampil polos tanpa pewarnaan. File ini menambahkannya.

   Dipakai oleh atribut class="language-cfml" pada contoh materi.
   Aman dilewati bila hljs tidak tersedia (aplikasi tetap jalan).
   ============================================================ */
'use strict';

(function () {
  var h = window.hljs;
  if (!h || typeof h.registerLanguage !== 'function') return;

  try {
    h.registerLanguage('cfml', function () {
      /* Ekspresi #expression# (interpolasi khas CFML). */
      var interpolation = {
        className: 'variable',
        begin: /#[a-zA-Z_][\w.]*\s*(?:\([^)]*\))?#/,
        relevance: 0
      };

      var dqString = { className: 'string', begin: '"', end: '"', contains: [interpolation], relevance: 0 };
      var sqString = { className: 'string', begin: "'", end: "'", contains: [interpolation], relevance: 0 };
      var number = { className: 'number', begin: /\b\d+(?:\.\d+)?\b/, relevance: 0 };

      /* Atribut tag: kata yang diikuti tanda "=" (nilai di sebelah kanan). */
      var attribute = { className: 'attr', begin: /[a-zA-Z_][\w-]*(?=\s*=)/, relevance: 0 };

      /* Isi tag setelah namanya: hanya atribut, nilai, dan ekspresi. */
      var tagBody = {
        end: /\/?>/,
        endsParent: true,
        relevance: 0,
        contains: [interpolation, attribute, dqString, sqString, number]
      };

      /* Tag: <cfset>, </cfif>, <h1>, <table>, ... Huruf pertama wajib
         mengikuti "<" agar perbandingan seperti  a < b  tidak ikut
         ditangkap sebagai tag. */
      var tag = {
        begin: /<\/?(?=[a-z])/i,
        relevance: 0,
        contains: [
          { className: 'name', begin: /[a-z][\w-]*/i, relevance: 3, starts: tagBody }
        ],
        end: /\/?>/
      };

      /* Komentar: <!--- khas CFML --->, // dan /* ... *​/ milik script. */
      var cfmlComment = { className: 'comment', begin: /<!---/, end: /--->/, relevance: 0 };
      var lineComment = { className: 'comment', begin: /\/\/.*$/, relevance: 0 };
      var blockComment = { className: 'comment', begin: /\/\*/, end: /\*\//, relevance: 0 };

      /* Kata kunci script. Hanya kata yang jarang muncul dalam teks prosa
         yang dipilih agar penjelasan berbahasa Indonesia tidak ikut
         terwarnai keliru. */
      var keyword = {
        className: 'keyword',
        begin:
          /\b(?:cfset|cfif|cfelseif|cfelse|cfloop|cffunction|cfreturn|cfargument|cfoutput|cfquery|cfparam|cfcomponent|cfproperty|cfinclude|cfmodule|cftry|cfcatch|cffinally|cfthrow|cfabort|cfbreak|cfcontinue|cfswitch|cfcase|cfdefaultcase|cfscript|cfthread|cffile|cfhttp|cfdump|cfdocument|cfspreadsheet|if|else|elseif|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|rethrow|function|var|in|this|public|private|package|protected|remote|static|true|false|null|eq|neq|gte|lte)\b/,
        relevance: 0
      };

      var fnTitle = { className: 'title', begin: /function\s+[a-zA-Z_][\w]*/, relevance: 0 };

      return {
        name: 'CFML',
        aliases: ['coldfusion', 'lucee'],
        case_insensitive: false,
        contains: [
          cfmlComment,
          lineComment,
          blockComment,
          tag,
          dqString,
          sqString,
          fnTitle,
          keyword,
          interpolation,
          number
        ]
      };
    });
  } catch (e) {
    /* Gagal mendaftar bukan masalah fatal — aplikasi tetap berjalan. */
    if (window.console && console.warn) console.warn('hljs-cfml:', e);
  }
})();
