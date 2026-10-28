/* ============================================================
   Modul sengaja rusak.

   Top-level throw membuat import() ditolak. Shell harus menangkap
   error ini agar halaman utama tetap berjalan.
   ============================================================ */

throw new Error('Modul @lab/remote-rusak sengaja gagal dievaluasi.');
