#!/usr/bin/env bash
# ============================================================
# test-proxy.sh — uji reverse proxy, load balancing, header,
#                 batas body, error 502/504, dan rate limiting
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
# --max-time 30: skenario "semua backend mati" membuat gateway mencoba
# 3 peer yang timeout (3 x proxy_connect_timeout) sebelum membalas 502.
http_status() {
  local url="$1"; shift
  curl -sk -o /dev/null -w '%{http_code}' --max-time 30 "$@" "$url" 2>/dev/null || true
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
  podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "nginx-lab"
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

reload_gateway() {
  podman exec nginx-lab nginx -t >/dev/null 2>&1 || return 1
  podman exec nginx-lab nginx -s reload >/dev/null 2>&1
}

# Pastikan tidak ada listener uji 504 yang tertinggal di 127.0.0.1:9090
stop_slow_listener() {
  podman exec nginx-lab sh -c 'pkill -f "nc -l -p 9090" >/dev/null 2>&1 || true' \
    >/dev/null 2>&1 || true
}

# Jaring pengaman: selalu hidupkan kembali backend bila skrip keluar
cleanup() {
  if command -v podman >/dev/null 2>&1; then
    podman start backend-1 backend-2 backend-3 >/dev/null 2>&1 || true
    sleep 1
    podman exec nginx-lab nginx -s reload >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "== nginx-lab: uji reverse proxy & load balancing =="
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

# --- 4. Batas ukuran body (client_max_body_size 1m) --------
BIG="$(mktemp)"
dd if=/dev/zero of="$BIG" bs=1048576 count=2 2>/dev/null
assert_status "POST body 2 MB ke /api/ ditolak 413" "$BASE_HTTP/api/" 413 \
  -X POST --data-binary @"$BIG"
rm -f "$BIG"

# --- 5. Error 502 dan 504 (location /slow/) ----------------
echo "--- uji error 502/504 ---"
if podman_available; then
  stop_slow_listener
  assert_status "tanpa backend di 127.0.0.1:9090 -> 502" "$BASE_HTTP/slow/" 502

  # Listener yang menerima koneksi tapi tidak pernah menjawab -> 504
  podman exec -d nginx-lab sh -c 'sleep 60 | nc -l -p 9090' >/dev/null 2>&1 || true
  sleep 1
  assert_status "listener yang tidak menjawab -> 504" "$BASE_HTTP/slow/" 504
  stop_slow_listener
else
  skip "uji 502/504 (podman tidak tersedia)"
fi

# --- 6. Failure handling backend ----------------------------
if podman_available && backend_running backend-1; then
  echo "--- uji backend mati (failure handling) ---"

  podman stop -t 5 backend-1 >/dev/null 2>&1 || true
  all_ok=1
  hit_dead=0
  for i in $(seq 1 8); do
    body="$(fetch_body "$BASE_HTTP/api/")"
    code="$(http_status "$BASE_HTTP/api/")"
    [ "$code" = "200" ] || all_ok=0
    grep -q "backend-1" <<<"$body" && hit_dead=1
  done
  if [ "$all_ok" = "1" ]; then
    pass "backend-1 mati: 8 request /api/ tetap 200 (dilayani backend lain)"
  else
    fail "backend-1 mati: 8 request /api/ tetap 200"
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
  # Di lab Podman, IP backend yang berhenti menjawab dengan timeout (bukan
  # connection refused), sehingga gateway membalas 504. Di lingkungan lain yang
  # menolak koneksi hasilnya 502. Keduanya menandakan upstream tidak tersedia.
  code="$(http_status "$BASE_HTTP/api/")"
  case "$code" in
    502|504) pass "semua backend mati -> /api/ $code (refused=502 / timeout=504)" ;;
    *)       fail "semua backend mati -> /api/ [status $code, diharapkan 502 atau 504]" ;;
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

# --- 7. Rate limiting (harus terakhir: bucket jadi kosong) --
echo "--- uji rate limiting (100 request sekaligus) ---"
codes="$(seq 1 100 | xargs -P 20 -I{} \
  curl -sk -o /dev/null -w '%{http_code}\n' --max-time 15 "$BASE_HTTP/api/" \
  2>/dev/null || true)"
limited="$(grep -c '^503$' <<<"$codes" || true)"
if [ "${limited:-0}" -ge 1 ]; then
  pass "rate limit aktif: $limited dari 100 request dibalas 503"
else
  fail "rate limit aktif: tidak ada 503 dari 100 request"
fi

echo
echo "----------------------------------------"
echo "TOTAL: PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
