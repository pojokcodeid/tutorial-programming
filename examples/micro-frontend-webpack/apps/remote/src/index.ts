/**
 * Async boundary untuk halaman standalone remote.
 * Saat host memuat `remote/App`, berkas ini tidak dieksekusi — yang dieksekusi
 * adalah modul yang diekspos (src/App.tsx). Boundary ini hanya dipakai saat
 * kamu membuka remote sendiri di http://localhost:4182.
 */
import('./bootstrap');
