/*
============================================================

	Package model — struktur data (entitas) domain aplikasi.
	============================================================
*/
package model

import "time"

// Peran pengguna yang didukung aplikasi.
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// User merepresentasikan baris pada tabel `users`.
type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // tanda "-" = jangan pernah ikut dikirim sebagai JSON
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}
