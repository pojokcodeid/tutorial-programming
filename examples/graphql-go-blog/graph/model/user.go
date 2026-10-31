package model

import "time"

// User adalah struct GORM milik kita (model kustom, bukan hasil generate).
// GQLGen diarahkan ke struct ini lewat blok `models` di gqlgen.yml,
// sehingga kita bebas menambahkan tag relasi & konvensi GORM.
type User struct {
	ID        int       `json:"ID" gorm:"primaryKey"`
	Name      string    `json:"Name" gorm:"size:100;not null"`
	Email     string    `json:"Email" gorm:"size:100;uniqueIndex;not null"`
	Role      string    `json:"Role" gorm:"size:10;not null;default:USER"`
	CreatedAt time.Time `json:"CreatedAt"`

	// Relasi satu-ke-banyak: satu user punya banyak post.
	// GORM memetakan lewat foreign key AuthorID di tabel posts.
	Posts []*Post `json:"Posts" gorm:"foreignKey:AuthorID;references:ID"`
}
