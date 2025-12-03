# Fix untuk ChunkLoadError di Production

## Masalah

Error `ChunkLoadError` terjadi di production saat mengakses route seperti `/transactions/:id`. Error ini muncul karena:

1. Server mengirim JavaScript chunk dengan MIME type `text/html` bukan `application/javascript`
2. Route `/transactions/static/js/793.79f84577.chunk.js` tidak dikenali sebagai file statis
3. React Router mengintercept request ke file statis dan mengembalikan `index.html` sebagai HTML

## Solusi

### 1. File .htaccess sudah diperbaiki

File `.htaccess` di root folder sudah diperbaiki untuk:
- Mengecualikan file statis (`/static/` dan ekstensi `.js`, `.css`, dll) dari rewrite rule
- Mengatur MIME type yang benar untuk JavaScript dan CSS files
- Hanya mengembalikan `index.html` untuk route non-static

### 2. Script Build

Script build sudah diupdate untuk secara otomatis mengcopy `.htaccess` ke folder `build/` setelah build:

```json
"build": "react-scripts build && npm run copy-htaccess",
"copy-htaccess": "node -e \"const fs = require('fs'); if (fs.existsSync('.htaccess')) { fs.copyFileSync('.htaccess', 'build/.htaccess'); console.log('✅ .htaccess copied to build folder'); } else { console.log('⚠️  .htaccess not found'); }\"",
```

## Langkah Deployment

### Untuk Production Web Hosting:

1. **Build aplikasi:**
   ```bash
   npm run build
   ```
   Script ini akan otomatis mengcopy `.htaccess` ke folder `build/`

2. **Upload semua file dari folder `build/` ke root web hosting:**
   - Pastikan `.htaccess` ikut ter-upload
   - Struktur folder di hosting harus sama dengan folder `build/`

3. **Pastikan Apache mod_rewrite aktif:**
   - Kontak hosting provider jika perlu
   - Atau cek di cPanel apakah mod_rewrite enabled

4. **Verifikasi:**
   - Buka browser dan akses aplikasi
   - Buka DevTools → Network tab
   - Cek apakah file JavaScript memiliki MIME type `application/javascript`
   - Cek apakah route seperti `/transactions/:id` berfungsi

## Struktur File di Hosting

```
/ (root web hosting)
├── .htaccess          ← File ini HARUS ada!
├── index.html
├── static/
│   ├── css/
│   │   └── *.css
│   └── js/
│       └── *.js
└── ... (file lainnya)
```

## Troubleshooting

### Jika masih error:

1. **Cek apakah `.htaccess` ada di root hosting:**
   - Pastikan file ter-upload dengan benar
   - Nama file harus persis `.htaccess` (tidak ada ekstensi lain)

2. **Cek apakah mod_rewrite aktif:**
   - Bisa test dengan membuat file `.htaccess` sederhana:
     ```apache
     RewriteEngine On
     ```
   - Jika tidak error, berarti mod_rewrite aktif

3. **Cek MIME types:**
   - Di cPanel → MIME Types
   - Pastikan `.js` → `application/javascript`
   - Pastikan `.css` → `text/css`

4. **Clear browser cache:**
   - Hard refresh: Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
   - Atau clear cache browser

5. **Cek error log hosting:**
   - Lihat error log di cPanel untuk detail error

## Catatan Penting

- File `.htaccess` SANGAT PENTING untuk production
- Tanpa file ini, React Router tidak akan berfungsi dengan benar
- Pastikan file ini selalu ikut ter-upload saat deploy

