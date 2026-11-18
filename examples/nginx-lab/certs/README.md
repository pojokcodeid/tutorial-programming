# certs/ — sertifikat TLS untuk lab

Folder ini diisi oleh `scripts/gen-certs.sh`:

```bash
scripts/gen-certs.sh
```

Hasilnya:

| File | Isi | Izin |
|---|---|---|
| `server.crt` | sertifikat self-signed 365 hari | 644 |
| `server.key` | **private key** | 600 |

Subject Alternative Name (SAN) yang dibuat:

- `DNS:localhost`
- `DNS:app.local`
- `DNS:api.local`
- `DNS:docs.local`
- `IP:127.0.0.1`

Kedua file **tidak boleh masuk Git** — sudah diabaikan oleh `.gitignore`
lab (`certs/*.key`, `certs/*.crt`, `*.pem`). Jangan pernah memakai key
ini di luar mesin belajar kamu.

## Menguji sertifikat

```bash
# melihat SAN
openssl x509 -in certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"

# curl yang mempercayai sertifikat lab (bukan -k)
curl --cacert certs/server.crt https://127.0.0.1:8443/
```

## Catatan produksi

Di produksi, jangan memakai sertifikat self-signed. Pakai penerbit
sertifikat tepercaya (misalnya Let's Encrypt via ACME), simpan private
key dengan izin 600, dan otomatiskan perpanjangan sebelum masa berlaku
habis. Materi: pelajaran 13 (HTTPS & TLS).
