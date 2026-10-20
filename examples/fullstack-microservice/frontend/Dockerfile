# ============================================================
# Dockerfile frontend React — dua tahap:
#   1) node: build Vite → folder dist/
#   2) nginx: sajikan dist/ + meneruskan /api ke service Go.
# ============================================================
FROM docker.io/library/node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ---------- runtime: nginx ----------
FROM docker.io/library/nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
