# ============================================================
# Dockerfile bersama untuk ketiga service Go (product, order, notification).
# Pola multi-stage: tahap build memakai image Go lengkap, tahap akhir
# hanya berisi biner + sertifikat — image akhir jadi kecil (±20 MB).
#
# Build per service:
#   podman build --build-arg SERVICE=product -t tokokita/product .
# ============================================================
FROM docker.io/library/golang:1.27-alpine AS build

# Parameter nama service: product | order | notification
ARG SERVICE

WORKDIR /src

# Salin berkas modul dulu agar lapisan cache Docker tetap terpakai
# selama go.sum tidak berubah (build ulang jadi jauh lebih cepat).
COPY go.mod go.sum ./
RUN go mod download

COPY services/ services/
# Paket bersama ketiga service (mis. internal/logx untuk logging JSON)
COPY internal/ internal/

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath \
    -ldflags="-s -w" \
    -o /out/app ./services/${SERVICE}/cmd

# ---------- tahap runtime ----------
FROM docker.io/library/alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -u 10001 app

USER app
COPY --from=build /out/app /usr/local/bin/app

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
