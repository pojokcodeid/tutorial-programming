package graph

// Context helper — menyimpan "pengguna login" pada context request.
// Pola ini sama dengan GraphQL context di Apollo Server (materi Bab 12):
// token diverifikasi sekali di middleware, hasilnya dibawa lewat context
// ke semua resolver yang berjalan pada request tersebut.

import (
	"context"
	"strconv"

	"example.com/graphql-go-blog/graph/model"

	"gorm.io/gorm"
)

type ctxKey int

const currentUserKey ctxKey = 1

// WithCurrentUser menyuntikkan pengguna ke context (dipanggil middleware).
func WithCurrentUser(ctx context.Context, u *model.User) context.Context {
	return context.WithValue(ctx, currentUserKey, u)
}

// CurrentUserFrom mengambil pengguna login dari context; nil bila anonim.
func CurrentUserFrom(ctx context.Context) *model.User {
	u, _ := ctx.Value(currentUserKey).(*model.User)
	return u
}

// AuthenticateFromHeader membaca header sederhana "X-User-ID" sebagai
// simulasi token (contoh belajar — produksi wajib memakai JWT sungguhan,
// lihat materi Bab 12 Keamanan & Otorisasi).
func AuthenticateFromHeader(ctx context.Context, db *gorm.DB, header string) context.Context {
	if header == "" {
		return ctx
	}
	id, err := strconv.Atoi(header)
	if err != nil || id <= 0 {
		return ctx
	}
	var u model.User
	if err := db.First(&u, id).Error; err != nil {
		return ctx // id tidak ada di database → tetap anonim
	}
	return WithCurrentUser(ctx, &u)
}
