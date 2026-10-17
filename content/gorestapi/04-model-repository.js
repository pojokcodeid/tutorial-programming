/* ============================================================
   Pelajaran Go REST API — Bab 4: Model & Repository Pattern
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-model-repository',
  title: 'Model, Repository Pattern & Prepared Statement',
  chapter: 'Database',
  duration: '12 menit',
  intro: [
    '<b>Repository</b> adalah lapisan yang bertugas "bicara" dengan database: menjalankan SQL dan memetakan hasilnya ke struct. Dengan memisahkan SQL ke repository, lapisan service bebas dari detail database.',
    'Pelajaran ini membangun model entitas, kontrak repository berbasis <b>interface</b>, implementasi MariaDB dengan <b>prepared statement</b>, serta menangani khas error database seperti "tidak ditemukan" dan "duplikat".'
  ],
  objectives: [
    'Mendefinisikan struct model dengan tag JSON',
    'Membuat kontrak repository berbasis interface',
    'Menulis query dengan QueryRowContext dan QueryContext',
    'Memahami prepared statement (?) sebagai penangkal SQL injection',
    'Menerjemahkan error database ke error sentinel Go'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Struct Model + Tag JSON</h3><p>Model adalah cerminan tabel dalam bentuk struct. Tag <code>json:"..."</code> menentukan nama field saat di-encode menjadi JSON — inilah "kontrak" bentuk respons API kamu.</p>'
    },
    {
      type: 'example',
      title: 'Model User dengan tag JSON',
      lang: 'go',
      output: false,
      code: `type User struct {
    ID           int64     \`json:"id"\`
    Username     string    \`json:"username"\`
    Email        string    \`json:"email"\`
    PasswordHash string    \`json:"-"\` // "-" = jangan ikut dikirim sebagai JSON
    Role         string    \`json:"role"\`
    CreatedAt    time.Time \`json:"created_at"\`
}`,
      explain: [
        'Tag ditulis dalam backtick (raw string literal) — kutip biasa akan bermasalah dengan tanda kutip di dalamnya.',
        '<code>json:"-"</code> menyembunyikan password hash dari respons API (praktik keamanan wajib!).',
        'Struktur ini menjadi sumber kebenaran bentuk respons untuk seluruh klien.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kontrak Repository (Interface)</h3><p>Kita tidak menulis SQL di mana-mana — cukup di repository. Lapisan lain hanya melihat <b>interface</b> (kontrak) yang menyebutkan operasi apa yang tersedia. Manfaatnya besar: service bisa diuji dengan repository palsu (mock) tanpa menyentuh database.</p>'
    },
    {
      type: 'example',
      title: 'Kontrak UserRepository',
      lang: 'go',
      output: false,
      code: `type UserRepository interface {
    Create(ctx context.Context, u *model.User) error
    FindByUsername(ctx context.Context, username string) (*model.User, error)
    FindByID(ctx context.Context, id int64) (*model.User, error)
}`,
      explain: [
        'Interface di sini adalah "janji": siapa pun yang memenuhi ketiga method ini layak disebut UserRepository.',
        'Karena Go interface bersifat implisit, implementasi cukup "memenuhi" — tidak perlu kata kunci implements.',
        'Semua method menerima <code>ctx</code> agar query bisa dibatalkan (timeout/cancel).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Prepared Statement & SQL Injection</h3><p>Jangan pernah menyusun query dengan menyisipkan string dari pengguna! Itulah celah <b>SQL injection</b>. Go mencegahnya dengan <b>parameter bertanda <code>?</code></b> — nilainya dikirim terpisah oleh driver, tidak pernah menjadi bagian dari teks query.</p>'
    },
    {
      type: 'example',
      title: 'SALAH vs BENAR',
      lang: 'go',
      output: false,
      code: `// ✗ SALAH — SQL injection! username bisa berisi: ' OR '1'='1
q := "SELECT * FROM users WHERE username = '" + username + "'"

// ✓ BENAR — parameter dikirim terpisah (prepared statement)
row := db.QueryRowContext(ctx,
    "SELECT id, username FROM users WHERE username = ?", username)`,
      explain: [
        'Pada cara benar, driver mengirim query template dan nilai secara terpisah ke database.',
        'Database memperlakukan nilai sebagai DATA, bukan perintah — username aneh tidak bisa mengubah struktur query.',
        'Ini juga biasanya lebih cepat karena query template bisa dipakai ulang oleh database.'
      ]
    },
    {
      type: 'example',
      title: 'Implementasi Create dengan LastInsertId',
      lang: 'go',
      output: false,
      code: `func (r *mysqlUserRepository) Create(ctx context.Context, u *model.User) error {
    res, err := r.db.ExecContext(ctx,
        \`INSERT INTO users (username, email, password_hash, role)
          VALUES (?, ?, ?, ?)\`,
        u.Username, u.Email, u.PasswordHash, u.Role,
    )
    if err != nil {
        var mysqlErr *mysql.MySQLError
        if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
            return ErrDuplicate // username/email sudah dipakai
        }
        return fmt.Errorf("insert user: %w", err)
    }

    id, err := res.LastInsertId() // baca AUTO_INCREMENT hasil insert
    if err != nil {
        return fmt.Errorf("membaca id hasil insert: %w", err)
    }
    u.ID = id
    return nil
}`,
      explain: [
        '<code>ExecContext</code> dipakai untuk INSERT/UPDATE/DELETE (tidak mengembalikan baris).',
        'Error <b>1062</b> = duplicate entry, diterjemahkan menjadi error sentinel <code>ErrDuplicate</code>.',
        '<code>LastInsertId()</code> mengisi kembali ID hasil AUTO_INCREMENT ke struct.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca satu baris dengan QueryRowContext',
      lang: 'go',
      output: false,
      code: `func (r *mysqlUserRepository) FindByUsername(
    ctx context.Context, username string,
) (*model.User, error) {
    row := r.db.QueryRowContext(ctx,
        \`SELECT id, username, email, password_hash, role, created_at
         FROM users WHERE username = ?\`, username,
    )

    var u model.User
    err := row.Scan(&u.ID, &u.Username, &u.Email,
        &u.PasswordHash, &u.Role, &u.CreatedAt)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNotFound // bukan error fatal: memang tidak ada
    }
    if err != nil {
        return nil, fmt.Errorf("scan user: %w", err)
    }
    return &u, nil
}`,
      explain: [
        '<code>QueryRowContext</code> untuk mengambil tepat satu baris.',
        '<code>Scan</code> memindahkan kolom ke variabel berdasarkan urutan — wajib sesuai urutan SELECT.',
        '<code>sql.ErrNoRows</code> bukan kegagalan teknis, tapi "tidak ada datanya" → diterjemahkan ke ErrNotFound.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menangani Banyak Baris (List)</h3><p>Untuk query yang mengembalikan banyak baris, gunakan <code>QueryContext</code> yang menghasilkan <code>*sql.Rows</code>. Ada dua aturan wajib: <b>tutup rows</b> dengan <code>defer rows.Close()</code>, dan periksa <code>rows.Err()</code> setelah iterasi selesai.</p>'
    },
    {
      type: 'example',
      title: 'Iterasi banyak baris dengan pagination',
      lang: 'go',
      output: false,
      code: `func (r *mysqlProductRepository) List(
    ctx context.Context, limit, offset int,
) ([]model.Product, error) {
    rows, err := r.db.QueryContext(ctx,
        \`SELECT id, name, description, price, stock, created_by
         FROM products ORDER BY id DESC LIMIT ? OFFSET ?\`,
        limit, offset,
    )
    if err != nil {
        return nil, fmt.Errorf("query products: %w", err)
    }
    defer rows.Close() // WAJIB: tutup rows agar kembali ke pool

    var products []model.Product
    for rows.Next() { // maju ke baris berikutnya
        var p model.Product
        if err := rows.Scan(&p.ID, &p.Name, &p.Description,
            &p.Price, &p.Stock, &p.CreatedBy); err != nil {
            return nil, fmt.Errorf("scan product: %w", err)
        }
        products = append(products, p)
    }
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("iterasi products: %w", err)
    }
    return products, nil
}`,
      explain: [
        '<code>rows.Close()</code> dengan defer menutup rows walau terjadi error di tengah.',
        '<code>rows.Err()</code> menangkap error yang muncul SAAT iterasi (mis. koneksi putus).',
        '<code>LIMIT ? OFFSET ?</code> adalah pagination bawaan MariaDB.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Error Sentinel sebagai Kontrak Lintas Lapisan</h3><p>Repository tidak boleh "bocorkan" error mentah database ke lapisan atas. Ia menerjemahkannya menjadi <b>error sentinel</b> yang sederhana dan stabil — lapisan service cukup memeriksanya dengan <code>errors.Is</code>.</p>'
    },
    {
      type: 'example',
      title: 'Deklarasi error sentinel',
      lang: 'go',
      output: false,
      code: `var (
    ErrNotFound      = errors.New("data tidak ditemukan")
    ErrDuplicate     = errors.New("data duplikat (username/email sudah dipakai)")
)`,
      explain: [
        'Error sentinel dibuat dengan <code>errors.New</code> di level package.',
        'Lapisan service memeriksa dengan <code>errors.Is(err, repository.ErrNotFound)</code> lalu menerjemahkan ke 404.',
        'Jika suatu hari ganti database, cukup ubah repository — service tidak tersentuh.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa pattern ini scalable?',
      text: 'Karena service hanya mengenal interface, kamu bisa membuat implementasi kedua (mis. untuk testing, cache Redis, atau database lain) tanpa mengubah satupun kode service. Inilah kekuatan "depend on abstractions" yang membuat proyek tetap ringkas saat tim dan fitur bertambah.'
    },
    {
      type: 'vocab',
      items: [
        ['Repository', 'Lapisan yang mengisolasi akses database dari logika bisnis.'],
        ['Interface', 'Kontrak method; implementasi bersifat implisit di Go.'],
        ['Prepared statement', 'Query dengan parameter (?) yang dikirim terpisah — aman dari SQL injection.'],
        ['Scan', 'Memindahkan kolom hasil query ke variabel Go sesuai urutan.'],
        ['sql.ErrNoRows', 'Error bawaan saat QueryRow tidak menemukan baris.'],
        ['Error sentinel', 'Error tetap (errors.New) sebagai penanda kondisi lintas lapisan.'],
        ['LastInsertId', 'Membaca ID hasil AUTO_INCREMENT dari operasi insert.']
      ]
    }
  ],
  recap: [
    'Struct model + tag json menjadi kontrak bentuk respons API.',
    'Interface repository memisahkan SQL dari logika bisnis dan memudahkan mocking.',
    'Prepared statement (?) adalah penangkal SQL injection.',
    'Error database diterjemahkan ke sentinel: ErrNotFound, ErrDuplicate.',
    'rows.Close() wajib dipanggil (defer) dan rows.Err() diperiksa setelah iterasi.'
  ]
});
