#!/usr/bin/env bash
# ============================================================
# test-routing.sh — uji routing statis, virtual host, redirect, HTTPS
#
# Jalankan setelah:
#   scripts/gen-certs.sh && podman compose up -d
#
# Keluaran: PASS/FAIL per pemeriksaan. Exit code 1 bila ada FAIL.
# ============================================================
set -euo pipefail

BASE_HTTP="http://localhost:8080"
BASE_HTTPS="https://localhost:8443"
BASE_REDIRECT="http://localhost:8081"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT="$SCRIPT_DIR/../certs/server.crt"

PASS=0
FAIL=0

pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# --- helper -------------------------------------------------
http_status() {
  local url="$1"; shift
  curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$@" "$url" 2>/dev/null || true
}

fetch_body() {
  local url="$1"; shift
  curl -sk --max-time 10 "$@" "$url" 2>/dev/null || true
}

fetch_headers() {
  local url="$1"; shift
  curl -sk -D - -o /dev/null --max-time 10 "$@" "$url" 2>/dev/null || true
}

assert_status() {
  local desc="$1" url="$2" want="$3"; shift 3
  local got
  got="$(http_status "$url" "$@")"
  if [ "$got" = "$want" ]; then
    pass "$desc [status $got]"
  else
    fail "$desc [status $got, diharapkan $want]"
  fi
}

assert_body_contains() {
  local desc="$1" url="$2" needle="$3"; shift 3
  local body
  body="$(fetch_body "$url" "$@")"
  if grep -q "$needle" <<<"$body"; then
    pass "$desc"
  else
    fail "$desc [konten tidak mengandung: $needle]"
  fi
}

assert_header_contains() {
  local desc="$1" url="$2" needle="$3"; shift 3
  local headers
  headers="$(fetch_headers "$url" "$@")"
  if grep -qi "$needle" <<<"$headers"; then
    pass "$desc"
  else
    fail "$desc [header tidak mengandung: $needle]"
  fi
}

echo "== apache-lab: uji routing =="
echo "Target: $BASE_HTTP / $BASE_HTTPS / $BASE_REDIRECT"
echo

# --- 1. Halaman utama & security header --------------------
assert_status   "GET / menghasilkan 200" "$BASE_HTTP/" 200
assert_body_contains "GET / memuat halaman utama" "$BASE_HTTP/" "apache-lab"
assert_header_contains "GET / mengirim X-Content-Type-Options" "$BASE_HTTP/" "X-Content-Type-Options: nosniff"
assert_header_contains "GET / mengirim X-Frame-Options" "$BASE_HTTP/" "X-Frame-Options: SAMEORIGIN"

# --- 2. Alias (dokumen di luar DocumentRoot) ----------------
assert_status        "GET /docs/ menghasilkan 200 (Alias)" "$BASE_HTTP/docs/" 200
assert_body_contains "GET /docs/ memuat halaman dokumentasi" "$BASE_HTTP/docs/" "Dokumentasi"

# --- 3. Path privat diblokir -------------------------------
assert_status "GET /private/ diblokir 403" "$BASE_HTTP/private/" 403
assert_status "GET /private/rahasia.txt diblokir 403" "$BASE_HTTP/private/rahasia.txt" 403

# --- 4. Cache aset statis 30 hari (mod_expires) ------------
assert_status           "GET /assets/style.css menghasilkan 200" "$BASE_HTTP/assets/style.css" 200
assert_header_contains  "/assets/style.css di-cache 30 hari" "$BASE_HTTP/assets/style.css" "Cache-Control: max-age=2592000"

# --- 5. Kompresi (mod_deflate) -----------------------------
assert_header_contains "Accept-Encoding: gzip dijawab Content-Encoding: gzip" \
  "$BASE_HTTP/" "content-encoding: gzip" -H "Accept-Encoding: gzip"

# --- 6. SPA fallback ---------------------------------------
assert_status           "rute SPA /halaman/tentang jatuh ke index.html" "$BASE_HTTP/halaman/tentang" 200
assert_body_contains    "rute SPA memuat konten index.html" "$BASE_HTTP/halaman/tentang" "apache-lab"

# --- 7. 404 untuk aset yang tidak ada ----------------------
assert_status "GET /assets/hilang.css menghasilkan 404" "$BASE_HTTP/assets/hilang.css" 404

# --- 8. Virtual host lewat header Host ---------------------
assert_status           "Host: app.local -> 200" "$BASE_HTTP/" 200 -H "Host: app.local"
assert_body_contains    "Host: app.local -> halaman app" "$BASE_HTTP/" "Gateway Aplikasi" -H "Host: app.local"
assert_status           "Host: api.local -> 200" "$BASE_HTTP/" 200 -H "Host: api.local"
assert_body_contains    "Host: api.local -> vhost API" "$BASE_HTTP/" "api.local" -H "Host: api.local"
assert_status           "Host: docs.local -> 200" "$BASE_HTTP/" 200 -H "Host: docs.local"
assert_body_contains    "Host: docs.local -> vhost dokumentasi" "$BASE_HTTP/" "Dokumentasi" -H "Host: docs.local"

# --- 9. Modul status (monitoring) --------------------------
assert_status        "GET /server-status menghasilkan 200" "$BASE_HTTP/server-status" 200
assert_body_contains "/server-status memuat Apache Server Status" "$BASE_HTTP/server-status" "Apache Server Status"

# --- 10. Redirect HTTP -> HTTPS (port 8081) ----------------
assert_header_contains "port 8081 redirect ke https://localhost:8443/" \
  "$BASE_REDIRECT/" "Location: https://localhost:8443/"
assert_status          "GET / di port 8081 menghasilkan 301" "$BASE_REDIRECT/" 301
assert_header_contains "redirect mempertahankan path (mod_alias Redirect)" \
  "$BASE_REDIRECT/redirect/selanjutnya" "Location: https://localhost:8443/redirect/selanjutnya"

# --- 11. HTTPS ---------------------------------------------
assert_status           "GET https://8443/ menghasilkan 200 (abaikan -k)" "$BASE_HTTPS/" 200
assert_body_contains    "GET https://8443/ memuat halaman utama" "$BASE_HTTPS/" "apache-lab"
assert_header_contains  "HTTPS juga mengirim security header" "$BASE_HTTPS/" "X-Content-Type-Options: nosniff"
assert_header_contains  "HTTPS mengirim HSTS" "$BASE_HTTPS/" "Strict-Transport-Security"

# --- 12. HTTP/2 (mod_http2 via ALPN) -----------------------
h2="$(curl -sk -o /dev/null -w '%{http_version}' --http2 --max-time 10 "$BASE_HTTPS/" 2>/dev/null || true)"
if [ "$h2" = "2" ]; then
  pass "HTTPS memakai HTTP/2 (h2)"
else
  fail "HTTPS memakai HTTP/2 [versi $h2, diharapkan 2 — cek Protocols h2 / dukungan curl --http2]"
fi

# --- 13. Sertifikat (SAN & kepercayaan) --------------------
if [ -f "$CERT" ]; then
  got="$(curl -s -o /dev/null -w '%{http_code}' --cacert "$CERT" --max-time 10 \
        "https://127.0.0.1:8443/" 2>/dev/null || true)"
  if [ "$got" = "200" ]; then
    pass "sertifikat dipercaya curl --cacert (SAN IP 127.0.0.1 cocok)"
  else
    fail "sertifikat dipercaya curl --cacert [status $got]"
  fi

  san="$(openssl x509 -in "$CERT" -noout -text 2>/dev/null || true)"
  for name in localhost app.local api.local docs.local; do
    if grep -q "$name" <<<"$san"; then
      pass "SAN sertifikat memuat $name"
    else
      fail "SAN sertifikat memuat $name"
    fi
  done
else
  fail "file $CERT tidak ada — jalankan scripts/gen-certs.sh dahulu"
fi

echo
echo "----------------------------------------"
echo "TOTAL: PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
