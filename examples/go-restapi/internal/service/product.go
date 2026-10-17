/*
============================================================

	Package service (lanjutan) — logika bisnis Product.
	============================================================
*/
package service

import (
	"context"
	"errors"
	"fmt"

	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/repository"
)

// PageResult membungkus hasil list + metadata pagination.
type PageResult struct {
	Items []model.Product `json:"items"`
	Total int64           `json:"total"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
}

// ProductService adalah kontrak layanan produk.
type ProductService interface {
	List(ctx context.Context, page, limit int) (*PageResult, error)
	Get(ctx context.Context, id int64) (*model.Product, error)
	Create(ctx context.Context, creatorID int64, in model.ProductInput) (*model.Product, error)
	Update(ctx context.Context, id int64, in model.ProductInput) (*model.Product, error)
	Delete(ctx context.Context, id int64) error
}

type productService struct {
	products repository.ProductRepository
}

// NewProductService membuat ProductService dengan repository produk.
func NewProductService(products repository.ProductRepository) ProductService {
	return &productService{products: products}
}

func (s *productService) List(ctx context.Context, page, limit int) (*PageResult, error) {
	// Beri nilai default & batas pagination agar tidak disalahgunakan.
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	items, err := s.products.List(ctx, limit, offset)
	if err != nil {
		return nil, err
	}
	total, err := s.products.Count(ctx)
	if err != nil {
		return nil, err
	}
	return &PageResult{Items: items, Total: total, Page: page, Limit: limit}, nil
}

func (s *productService) Get(ctx context.Context, id int64) (*model.Product, error) {
	product, err := s.products.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, fmt.Errorf("%w: produk dengan id %d", ErrNotFound, id)
		}
		return nil, err
	}
	return product, nil
}

func (s *productService) Create(ctx context.Context, creatorID int64, in model.ProductInput) (*model.Product, error) {
	if err := in.Validate(); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrValidation, err.Error())
	}
	product := &model.Product{
		Name:        in.Name,
		Description: in.Description,
		Price:       in.Price,
		Stock:       in.Stock,
		CreatedBy:   creatorID,
	}
	if err := s.products.Create(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *productService) Update(ctx context.Context, id int64, in model.ProductInput) (*model.Product, error) {
	// Pastikan produk ada sebelum update.
	product, err := s.products.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, fmt.Errorf("%w: produk dengan id %d", ErrNotFound, id)
		}
		return nil, err
	}

	if err := in.Validate(); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrValidation, err.Error())
	}
	product.Name = in.Name
	product.Description = in.Description
	product.Price = in.Price
	product.Stock = in.Stock

	if err := s.products.Update(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *productService) Delete(ctx context.Context, id int64) error {
	if err := s.products.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return fmt.Errorf("%w: produk dengan id %d", ErrNotFound, id)
		}
		return err
	}
	return nil
}
