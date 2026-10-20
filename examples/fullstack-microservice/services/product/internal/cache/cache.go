/*
Package cache — lapisan cache Redis untuk product-service.

Pola yang dipakai: cache-aside.
 1. Baca: coba Redis dulu; kalau miss, baca MariaDB lalu tulis ke Redis.
 2. Tulis/ubah/hapus: langsung ke MariaDB, lalu buang kunci cache
    (invalidation) supaya pembaca berikutnya mendapat data baru.

Bila Redis sedang mati, semua metode diam-diam diperlakukan sebagai "miss" —
service tetap memberi jawaban benar dari database (hanya lebih lambat).
*/
package cache

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"example.com/tokokita/services/product/internal/store"
)

type Cache struct {
	rdb *redis.Client
}

func New(rdb *redis.Client) *Cache { return &Cache{rdb: rdb} }

func keyProduk(id int64) string { return "product:" + strconv.FormatInt(id, 10) }

const keyDaftar = "product:list"

// GetProduk mengambil satu produk dari cache; false berarti miss.
func (c *Cache) GetProduk(ctx context.Context, id int64) (store.Product, bool) {
	val, err := c.rdb.Get(ctx, keyProduk(id)).Result()
	if err != nil {
		return store.Product{}, false
	}
	var p store.Product
	if json.Unmarshal([]byte(val), &p) != nil {
		return store.Product{}, false
	}
	return p, true
}

// SetProduk menyimpan satu produk ke cache dengan TTL.
func (c *Cache) SetProduk(ctx context.Context, p store.Product, ttl time.Duration) {
	data, err := json.Marshal(p)
	if err != nil {
		return
	}
	c.rdb.Set(ctx, keyProduk(p.ID), data, ttl)
}

// GetDaftar mengambil seluruh daftar produk dari cache.
func (c *Cache) GetDaftar(ctx context.Context) ([]store.Product, bool) {
	val, err := c.rdb.Get(ctx, keyDaftar).Result()
	if err != nil {
		return nil, false
	}
	var list []store.Product
	if json.Unmarshal([]byte(val), &list) != nil {
		return nil, false
	}
	return list, true
}

// SetDaftar menyimpan seluruh daftar produk sebagai satu blob JSON.
func (c *Cache) SetDaftar(ctx context.Context, list []store.Product, ttl time.Duration) {
	data, err := json.Marshal(list)
	if err != nil {
		return
	}
	c.rdb.Set(ctx, keyDaftar, data, ttl)
}

// Invalidate membuang entri cache satu produk SEKALIGUS daftar lengkapnya,
// supaya tidak ada pembaca yang mendapat data basi setelah sebuah tulis.
func (c *Cache) Invalidate(ctx context.Context, id int64) {
	c.rdb.Del(ctx, keyProduk(id), keyDaftar)
}
