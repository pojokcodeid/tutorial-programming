// Program seed menanam beberapa todo contoh ke database aplikasi.
// Aman dijalankan berulang: bila database sudah berisi, program berhenti
// tanpa menambah apa pun.
//
// Contoh pemakaian:
//
//	go run ./cmd/seed
//	TODO_DB_DRIVER=mysql go run ./cmd/seed
package main

import (
	"context"
	"log"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/service"
	"example.com/go-todo-app/internal/storage"
)

func main() {
	repo, err := storage.FromEnv()
	if err != nil {
		log.Fatalf("gagal menyiapkan database: %v", err)
	}
	defer repo.Close()

	ctx := context.Background()
	svc := service.New(repo)

	st, err := svc.Stats(ctx)
	if err != nil {
		log.Fatalf("membaca statistik: %v", err)
	}
	if st.Total > 0 {
		log.Printf("database sudah berisi %d todo — tidak ada yang ditanam.", st.Total)
		return
	}

	contoh := []model.TodoInput{
		{Title: "Pelajari widget dasar Fyne (Label, Button, Entry)", Category: "Kerja", Priority: model.PriorityHigh},
		{Title: "Bangun daftar todo dengan widget.List", Category: "Kerja", Priority: model.PriorityMedium},
		{Title: "Beli beras dan minyak goreng", Category: "Belanja", Priority: model.PriorityLow},
		{Title: "Rapikan folder proyek Go", Category: "Pribadi", Priority: model.PriorityMedium},
		{Title: "Tulis README proyek", Category: "Kerja", Priority: model.PriorityMedium},
	}

	var tersimpan []int64
	for _, in := range contoh {
		t, err := svc.Add(ctx, in)
		if err != nil {
			log.Fatalf("menanam %q: %v", in.Title, err)
		}
		tersimpan = append(tersimpan, t.ID)
	}

	// Tandai satu todo sebagai selesai agar tampilan "sudah selesai"
	// langsung terlihat saat aplikasi dibuka.
	if _, err := svc.Toggle(ctx, tersimpan[len(tersimpan)-1]); err != nil {
		log.Fatalf("menandai selesai: %v", err)
	}
	log.Printf("%d todo contoh berhasil ditanam.", len(contoh))
}
