/**
 * Async boundary.
 *
 * Entry ini sengaja hanya melakukan dynamic import ke bootstrap. Dengan begitu
 * Webpack/Rspack bisa memuat shared module React terlebih dahulu, lalu baru
 * menjalankan kode yang memakai React. Tanpa boundary ini kamu bisa melihat
 * error "Shared module is not available for eager consumption".
 */
import('./bootstrap');
