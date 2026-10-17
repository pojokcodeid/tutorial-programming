/* ============================================================
   Unit testing ProductService — TANPA database (mock repository).
   ============================================================ */
package service

import (
	"context"
	"errors"
	"testing"

	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/repository"
)

/* ---------- mock repository ---------- */

type mockProductRepo struct {
	products map[int64]*model.Product
	nextID   int64
}

func newMockProductRepo() *mockProductRepo {
	return &mockProductRepo{products: map[int64]*model.Product{}, nextID: 1}
}

func (m *mockProductRepo) Create(ctx context.Context, p *model.Product) error {
	p.ID = m.nextID
	m.nextID++
	cp := *p
	m.products[p.ID] = &cp
	return nil
}

func (m *mockProductRepo) FindByID(ctx context.Context, id int64) (*model.Product, error) {
	p, ok := m.products[id]
	if !ok {
		return nil, repository.ErrNotFound
	}
	cp := *p
	return &cp, nil
}

func (m *mockProductRepo) List(ctx context.Context, limit, offset int) ([]model.Product, error) {
	var out []model.Product
	for _, p := range m.products {
		out = append(out, *p)
	}
	if offset >= len(out) {
		return nil, nil
	}
	end := offset + limit
	if end > len(out) {
		end = len(out)
	}
	return out[offset:end], nil
}

func (m *mockProductRepo) Count(ctx context.Context) (int64, error) {
	return int64(len(m.products)), nil
}

func (m *mockProductRepo) Update(ctx context.Context, p *model.Product) error {
	if _, ok := m.products[p.ID]; !ok {
		return repository.ErrNotFound
	}
	cp := *p
	m.products[p.ID] = &cp
	return nil
}

func (m *mockProductRepo) Delete(ctx context.Context, id int64) error {
	if _, ok := m.products[id]; !ok {
		return repository.ErrNotFound
	}
	delete(m.products, id)
	return nil
}

/* ---------- validasi input ---------- */

func TestProductInput_Validate(t *testing.T) {
	tests := []struct {
		name    string
		input   model.ProductInput
		wantErr bool
	}{
		{"valid", model.ProductInput{Name: "Laptop", Price: 100, Stock: 5}, false},
		{"nama kosong", model.ProductInput{Name: "", Price: 100, Stock: 1}, true},
		{"nama terlalu pendek", model.ProductInput{Name: "ab", Price: 100, Stock: 1}, true},
		{"harga negatif", model.ProductInput{Name: "Laptop", Price: -1, Stock: 1}, true},
		{"stok negatif", model.ProductInput{Name: "Laptop", Price: 100, Stock: -1}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.input.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate(%+v) error = %v, wantErr = %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

/* ---------- operasi CRUD ---------- */

func TestCreateProduct_Valid(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	p, err := svc.Create(context.Background(), 42, model.ProductInput{Name: "Laptop", Price: 9_500_000, Stock: 3})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if p.ID == 0 {
		t.Error("ID produk belum terisi")
	}
	if p.CreatedBy != 42 {
		t.Errorf("CreatedBy = %d, want 42", p.CreatedBy)
	}
}

func TestCreateProduct_TanpaValidasi(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	_, err := svc.Create(context.Background(), 1, model.ProductInput{Name: "X", Price: -100, Stock: -1})
	if !errors.Is(err, ErrValidation) {
		t.Errorf("Create() error = %v, want ErrValidation", err)
	}
}

func TestGetProduct_TidakAda(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	_, err := svc.Get(context.Background(), 999)
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("Get() error = %v, want ErrNotFound", err)
	}
}

func TestUpdateProduct_TidakAda(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	_, err := svc.Update(context.Background(), 999, model.ProductInput{Name: "Baru", Price: 1, Stock: 1})
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("Update() error = %v, want ErrNotFound", err)
	}
}

func TestDeleteProduct_TidakAda(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	if err := svc.Delete(context.Background(), 999); !errors.Is(err, ErrNotFound) {
		t.Errorf("Delete() error = %v, want ErrNotFound", err)
	}
}

/* ---------- pagination ---------- */

func TestListProduct_PaginationDefault(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	// Isi 5 produk.
	for i := 0; i < 5; i++ {
		if _, err := svc.Create(context.Background(), 1, model.ProductInput{Name: "Produk", Price: 1000, Stock: 1}); err != nil {
			t.Fatal(err)
		}
	}

	res, err := svc.List(context.Background(), 0, 0) // 0,0 → default page=1, limit=20
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if res.Page != 1 || res.Limit != 20 {
		t.Errorf("Page/Limit = %d/%d, want 1/20", res.Page, res.Limit)
	}
	if res.Total != 5 {
		t.Errorf("Total = %d, want 5", res.Total)
	}
	if len(res.Items) != 5 {
		t.Errorf("len(Items) = %d, want 5", len(res.Items))
	}
}

func TestListProduct_LimitDibatasi(t *testing.T) {
	svc := NewProductService(newMockProductRepo())

	res, err := svc.List(context.Background(), 1, 10_000) // limit terlalu besar
	if err != nil {
		t.Fatal(err)
	}
	if res.Limit != 20 {
		t.Errorf("Limit = %d, want dibatasi ke 20", res.Limit)
	}
}
