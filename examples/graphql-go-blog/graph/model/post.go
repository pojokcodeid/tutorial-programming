package model

import "time"

// Post adalah struct GORM milik kita (model kustom, bukan hasil generate).
// AuthorID adalah foreign key — tanpa field ini GORM tidak bisa memetakan
// relasi Author ↔ Posts (kesalahan paling umum pemula Go + GORM).
type Post struct {
	ID        int       `json:"ID" gorm:"primaryKey"`
	Title     string    `json:"Title" gorm:"size:200;not null"`
	Content   string    `json:"Content" gorm:"type:text"`
	Published bool      `json:"Published" gorm:"default:false"`
	CreatedAt time.Time `json:"CreatedAt"`

	// Relasi banyak-ke-satu: post punya satu penulis.
	AuthorID int   `json:"-" gorm:"not null;index"` // kolom di DB, tidak diekspos ke GraphQL
	Author   *User `json:"Author" gorm:"foreignKey:AuthorID;references:ID"`
}
