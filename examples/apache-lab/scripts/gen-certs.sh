#!/usr/bin/env bash
# ============================================================
# gen-certs.sh — membuat sertifikat self-signed untuk apache-lab
# Aman dijalankan berulang (file lama ditimpa).
# Prasyarat: openssl
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../certs"

mkdir -p "$CERT_DIR"

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl tidak ditemukan di PATH." >&2
  exit 1
fi

umask 077

# Sertifikat self-signed 365 hari dengan SAN agar curl tidak menolak
# hostname (localhost, app.local, api.local, docs.local).
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -keyout "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -subj "/CN=localhost/O=apache-lab/C=ID" \
  -addext "subjectAltName=DNS:localhost,DNS:app.local,DNS:api.local,DNS:docs.local,IP:127.0.0.1" \
  >/dev/null 2>&1

chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"

echo "OK  : sertifikat dibuat di $CERT_DIR"
echo "      server.crt (SAN: localhost, app.local, api.local, docs.local, 127.0.0.1)"
echo "      server.key (izin 600, tidak masuk Git)"
openssl x509 -in "$CERT_DIR/server.crt" -noout -subject -dates
