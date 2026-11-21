#!/usr/bin/env bash
# ============================================================
# test-proxy.sh — uji reverse proxy, load balancing, header,
#                 batas body, error 502/504, dan kompresi
#
# Jalankan setelah:
#   scripts/gen-certs.sh && podman compose up -d
#
# Keluaran: PASS/FAIL per pemeriksaan. Exit code 1 bila ada FAIL.
# ============================================================
set -euo pipefail

BASE_HTTP="http://localhost:8080"
BASE_HTTPS="https://localhost:8443"
PASS=0
FAIL=0

pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
skip() { echo "SKIP: $1"; }

# --- helper -------------------------------------------------
# --max-time 30: skenario "semua backend mati" membuat gateway menunggu
# connectiontimeout/timeout sebelum membalas 502/503/504.
http_status() {
  local url="$1"; shift
  curl -sk -o /dev/null -w '%{http_code}' --max-time 30 "$@" "$url" 2>/dev/null || true
}

# "status waktu" — dipakai uji 502/503 (cepat) vs timeout (lambat)
http_code_time() {
  local url="$1"; shift
  curl -sk -o /dev/null -w '%{http_code} %{time_total}' --max-time 30 "$@" "$url" 2>/dev/null || true
}

fetch_body() {
  local url="$1"; shift
  curl -sk --max-time 30 "$@" "$url" 2>/dev/null || true
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

podman_available() {
  command -v podman >/dev/null 2>&1 || return 1
  podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "apache-lab"
}

backend_running() {
  podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$1"
}

# Tunggu gateway kembali menjawab 200 di /api/ (setelah backend dihidupkan)
wait_gateway_ready() {
  local i
  for i in $(seq 1 20); do
    if [ "$(http_status "$BASE_HTTP/api/")" = "200" ]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# Validasi konfigurasi lalu graceful reload (memaksa resolusi ulang
# nama backend bila IP container berubah setelah restart).
reload_gateway() {
  podman exec apache-lab httpd -t >/dev/null 2>&1 || return 1
  podman exec apache-lab httpd -k graceful >/dev/null 2>&1 || return 1
}

# Listener uji 504 dijalankan pada container backend (alpine) yang punya
# nc — image httpd tidak menyertakan nc maupun curl.
stop_slow_listener() {
  podman exec backend-1 sh -c 'pkill -f "nc -l -p 9090" >/dev/null 2>&1 || true' \
    >/dev/null 2>&1 || true
}

# Jaring pengaman: selalu hidupkan kembali backend bila skrip keluar
cleanup() {
  if command -v podman >/dev/null 2>&1; then
    podman start backend-1 backend-2 backend-3 >/dev/null 2>&1 || true
    sleep 1
    stop_slow_listener
    podman exec apache-lab httpd -k graceful >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "== apache-lab: uji reverse proxy & load balancing =="
echo "Target: $BASE_HTTP / $BASE_HTTPS"
echo

# --- 1. /api/ dan /app/ dilayani backend -------------------
assert_status        "GET /api/ menghasilkan 200" "$BASE_HTTP/api/" 200
assert_body_contains "GET /api/ memuat konten backend" "$BASE_HTTP/api/" "backend-"
assert_status        "GET /app/ menghasilkan 200" "$BASE_HTTP/app/" 200
assert_body_contains "GET /app/ memuat konten backend" "$BASE_HTTP/app/" "backend-"
assert_body_contains "Host: api.local + /api/ tetap lewat proxy" \
  "$BASE_HTTP/api/" "backend-" -H "Host: api.local"

# --- 2. Header yang diteruskan ke backend ------------------
echo "--- header yang diteruskan ke backend ---"
hdrs="$(fetch_body "$BASE_HTTP/api/headers/")"
for field in server= host= x-real-ip= x-forwarded-for= x-forwarded-proto=http; do
  if grep -q "$field" <<<"$hdrs"; then
    pass "backend menerima $field"
  else
    fail "backend menerima $field [respons: $(tr '\n' ' ' <<<"$hdrs")]"
  fi
done

hdrs="$(fetch_body "$BASE_HTTPS/api/headers/")"
if grep -q "x-forwarded-proto=https" <<<"$hdrs"; then
  pass "lewat HTTPS, backend menerima x-forwarded-proto=https"
else
  fail "lewat HTTPS, backend menerima x-forwarded-proto=https [respons: $(tr '\n' ' ' <<<"$hdrs")]"
fi

# --- 3. Distribusi load balancing ---------------------------
echo "--- distribusi round-robin (9 request) ---"
seen=""
for i in $(seq 1 9); do
  body="$(fetch_body "$BASE_HTTP/api/")"
  for b in backend-1 backend-2 backend-3; do
    if grep -q "$b" <<<"$body"; then
      case " $seen " in
        *" $b "*) ;;
        *) seen="$seen $b" ;;
      esac
    fi
  done
done
count="$(wc -w <<<"$seen" | tr -d ' ')"
if [ "$count" -ge 2 ]; then
  pass "round-robin memakai $count backend berbeda:$seen"
else
  fail "round-robin memakai minimal 2 backend berbeda [dapat:$seen]"
fi

# --- 4. Batas ukuran body (LimitRequestBody 1m) -------------
BIG="$(mktemp)"
dd if=/dev/zero of="$BIG" bs=1048576 count=2 2>/dev/null
assert_status "POST body 2 MB ke /api/ ditolak 413" "$BASE_HTTP/api/" 413 \
  -X POST --data-binary @"$BIG"
rm -f "$BIG"

# --- 5. Error proxy: backend tak terjangkau & timeout --------
# Pemetaan status Apache (beda dengan nginx):
#   - koneksi ditolak (tidak ada listener) -> 503 (kadang 502),
#     terjadi CEPAT karena connectiontimeout=2
#   - koneksi terbuka tapi tidak pernah dijawab -> 502 (AH01102),
#     terjadi SETELAH timeout=3
echo "--- uji error proxy (503 cepat vs timeout lambat) ---"
if podman_available; then
  stop_slow_listener
  res="$(http_code_time "$BASE_HTTP/slow/")"
  code="${res%% *}" time="${res##* }"
  case "$code" in
    502|503) pass "tanpa listener di backend-1:9090 -> $code (backend tak terjangkau)" ;;
    *)       fail "tanpa listener di backend-1:9090 -> [status $code, diharapkan 502 atau 503]" ;;
  esac
  awk -v t="$time" 'BEGIN{exit !(t+0 < 2.5)}' </dev/null \
    && pass "penolakan terjadi cepat (${time}s < 2.5s = connectiontimeout)" \
    || fail "penolakan seharusnya cepat [waktu ${time}s]"

  # Listener yang menerima koneksi tapi tidak pernah menjawab -> timeout
  podman exec -d backend-1 sh -c 'sleep 60 | nc -l -p 9090' >/dev/null 2>&1 || true
  sleep 1
  res="$(http_code_time "$BASE_HTTP/slow/")"
  code="${res%% *}" time="${res##* }"
  case "$code" in
    502|504) pass "listener yang tidak menjawab -> $code (timeout ${time}s)" ;;
    *)       fail "listener yang tidak menjawab -> [status $code, diharapkan 502 atau 504]" ;;
  esac
  awk -v t="$time" 'BEGIN{exit !(t+0 >= 2.5)}' </dev/null \
    && pass "gateway menunggu timeout=3 detik (${time}s)" \
    || fail "gateway seharusnya menunggu ±3 detik [waktu ${time}s]"
  stop_slow_listener
else
  skip "uji error proxy (podman tidak tersedia)"
fi

# --- 6. Failure handling backend ----------------------------
if podman_available && backend_running backend-1; then
  echo "--- uji backend mati (failure handling) ---"

  podman stop -t 5 backend-1 >/dev/null 2>&1 || true
  # Saat container dihentikan, nama DNS "backend-1" ikut hilang dari
  # jaringan Podman. Apache mem-resolve nama backend pada saat request,
  # sehingga request pertama menuju member itu gagal (500/503) dan baru
  # setelahnya balancer menyingkirkannya dari rotasi. Beda dengan nginx
  # yang mencoba upstream berikutnya DALAM request yang sama.
  ok=0
  hit_dead=0
  for i in $(seq 1 8); do
    body="$(fetch_body "$BASE_HTTP/api/")"
    code="$(http_status "$BASE_HTTP/api/")"
    [ "$code" = "200" ] && ok=$((ok + 1))
    grep -q "backend-1" <<<"$body" && hit_dead=1
  done
  if [ "$ok" -ge 7 ]; then
    pass "backend-1 mati: $ok/8 request /api/ tetap 200 (maks 1 gagal saat member dikeluarkan)"
  else
    fail "backend-1 mati: minimal 7 dari 8 request /api/ harus 200 [dapat $ok]"
  fi
  if [ "$hit_dead" = "0" ]; then
    pass "backend-1 mati: tidak ada respons yang datang dari backend-1"
  else
    fail "backend-1 mati: masih ada respons dari backend-1"
  fi

  podman start backend-1 >/dev/null 2>&1 || true
  if reload_gateway && wait_gateway_ready; then
    pass "backend-1 dihidupkan kembali dan gateway melayani 200"
  else
    fail "backend-1 dihidupkan kembali dan gateway melayani 200"
  fi

  recovered=0
  for i in $(seq 1 6); do
    if grep -q "backend-1" <<<"$(fetch_body "$BASE_HTTP/api/")"; then
      recovered=1
      break
    fi
  done
  if [ "$recovered" = "1" ]; then
    pass "backend-1 kembali masuk rotasi round-robin"
  else
    fail "backend-1 kembali masuk rotasi round-robin"
  fi

  echo "--- uji 502 (semua backend mati) ---"
  podman stop -t 5 backend-1 backend-2 backend-3 >/dev/null 2>&1 || true
  # Dengan semua container dihentikan, nama DNS backend hilang dan
  # Apache membalas 500 (AH00898 DNS lookup failure). Di lingkungan
  # yang tetap bisa meresolve namanya hasilnya 502/503 (koneksi ditolak)
  # atau 504 (timeout). Semuanya menandakan upstream tidak tersedia.
  code="$(http_status "$BASE_HTTP/api/")"
  case "$code" in
    500|502|503|504) pass "semua backend mati -> /api/ $code (upstream tidak tersedia)" ;;
    *)               fail "semua backend mati -> /api/ [status $code, diharapkan salah satu 500/502/503/504]" ;;
  esac

  podman start backend-1 backend-2 backend-3 >/dev/null 2>&1 || true
  if reload_gateway && wait_gateway_ready; then
    pass "semua backend dihidupkan kembali dan gateway melayani 200"
  else
    fail "semua backend dihidupkan kembali dan gateway melayani 200"
  fi
else
  skip "uji failure handling (container backend tidak tersedia)"
fi

# --- 7. Harus BUKAN forward proxy (ProxyRequests Off) --------
# Klien mengirim request absolut (gaya forward proxy) ke port 8080.
# Karena ProxyRequests Off, Apache tidak meneruskannya ke example.com —
# URL-path ("/") dipetakan ke DocumentRoot lokal.
body="$(fetch_body "http://example.com/" -x "$BASE_HTTP")"
if grep -q "apache-lab" <<<"$body"; then
  pass "forward proxy mati: request absolut dilayani lokal (bukan diteruskan)"
else
  fail "forward proxy mati: isi respons bukan halaman lokal"
fi
if grep -q "Example Domain" <<<"$body"; then
  fail "forward proxy mati: contoh.com diteruskan = ProxyRequests terbuka!"
else
  pass "forward proxy mati: example.com tidak diteruskan"
fi

echo
echo "----------------------------------------"
echo "TOTAL: PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
