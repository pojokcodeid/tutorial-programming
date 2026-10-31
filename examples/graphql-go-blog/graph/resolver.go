// Package graph menyediakan resolver GraphQL blog.
// Struct Resolver menjadi "tas dependency" — disuntikkan dari main.go.
package graph

import "gorm.io/gorm"

// Resolver menampung semua dependency bersama resolver
// (dependency injection sederhana gaya Go — tanpa framework container).
type Resolver struct {
	DB *gorm.DB
}
