# Sertifikat TLS lab — private key tidak boleh masuk Git

Jalankan `bash scripts/gen-certs.sh` untuk membuat:

- `server.crt` — sertifikat self-signed 365 hari dengan SAN
  (`localhost`, `app.local`, `api.local`, `docs.local`, `127.0.0.1`)
- `server.key` — private key (izin 600)

Keduanya **tidak masuk ke Git** (lihat `.gitignore`).
