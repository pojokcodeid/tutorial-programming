// Blog GraphQL — server contoh dari materi "GraphQL dengan Go".
//
// Jalankan:
//	1. Pastikan MariaDB hidup di localhost:3306 (user root, password rootpassword)
//	2. Buat database (sekali saja):  mysql -u root -p < seed.sql
//	   — atau biarkan AutoMigrate membuat tabelnya, lalu isi data lewat Playground
//	3. go run .   lalu buka http://localhost:4000/
//
// DEBUG=1 go run .   — menampilkan SQL GORM di terminal (berguna belajar).
package main

import (
	"log"
	"net/http"
	"os"

	"example.com/graphql-go-blog/graph"
	"example.com/graphql-go-blog/graph/generated"
	"example.com/graphql-go-blog/internal/database"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"gorm.io/gorm"
)

const defaultPort = "4000"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// 1. Koneksi database — fatal-exit bila MariaDB mati
	db := database.Connect()

	// 2. Server GraphQL dari schema hasil generate + resolver milikmu
	srv := handler.NewDefaultServer(
		generated.NewExecutableSchema(generated.Config{
			Resolvers: &graph.Resolver{DB: db},
		}),
	)

	// 3. Middleware autentikasi sederhana: baca header X-User-ID
	//    (simulasi token — produksi wajib JWT, lihat materi Bab 12)
	auth := authMiddleware(db, srv)

	// 4. Playground di "/", endpoint GraphQL di "/graphql"
	http.Handle("/", playground.Handler("Blog GQLGen", "/graphql"))
	http.Handle("/graphql", auth)

	log.Printf("🚀 server jalan di http://localhost:%s/graphql", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// authMiddleware menyuntikkan pengguna login ke context sebelum
// request masuk ke resolver — pola yang sama dengan buildContext Apollo.
func authMiddleware(db *gorm.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := graph.AuthenticateFromHeader(r.Context(), db, r.Header.Get("X-User-ID"))
		// Header CORS sederhana agar Playground lintas-origin tetap jalan
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
