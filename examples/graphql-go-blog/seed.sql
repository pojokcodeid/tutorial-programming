-- Contoh data awal (seed) untuk blog GraphQL + Go.
-- Jalankan sekali setelah server pertama kali dijalankan (tabel sudah dibuat AutoMigrate):
--
--   mysql -u root -p blog_go < seed.sql
--
-- Atau tanpa client mysql — langsung dari GraphQL Playground (mutation createPost).

USE blog_go;

INSERT INTO users (name, email, role, created_at) VALUES
  ('Budi Santoso', 'budi@email.com',   'ADMIN', NOW()),
  ('Ani Rahayu',    'ani@email.com',    'USER',  NOW()),
  ('Citra Lestari', 'citra@email.com',  'USER',  NOW());

INSERT INTO posts (title, content, published, author_id, created_at) VALUES
  ('Halo GraphQL di Go',       'Post pertama dari server GQLGen + GORM.',         1, 1, NOW()),
  ('GORM untuk Pemula',        'Cara kerja Preload, Where, Create, dan Save.',    0, 1, NOW()),
  ('REST vs GraphQL: Revisit', 'Mengapa GraphQL dipilih untuk API beragam klien.', 1, 2, NOW()),
  ('Draf: Microservices Go',   'Tulisan setengah jadi tentang memecah monolit.',  0, 3, NOW());
