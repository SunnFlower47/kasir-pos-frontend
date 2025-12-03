# Panduan Deployment Frontend ke Hosting

## File .htaccess untuk Hosting

File `.htaccess` telah disediakan untuk deployment ke hosting Apache. File ini akan:
- Mengatasi routing React Router (SPA)
- Mengaktifkan kompresi Gzip
- Mengatur caching untuk static assets
- Menambahkan security headers
- Mengoptimalkan performa

## Cara Penggunaan

### 1. Build Project
```bash
npm run build
```

### 2. Copy File .htaccess ke Build Folder

**Opsi 1: Copy Manual**
Setelah build, copy file `.htaccess` dari root folder atau `public/` folder ke folder `build/`:
```bash
# Windows (PowerShell)
Copy-Item .htaccess build/.htaccess

# Linux/Mac
cp .htaccess build/.htaccess
# atau
cp public/.htaccess build/.htaccess
```

**Opsi 2: Auto Copy dengan Script**
Tambahkan script di `package.json`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:deploy": "react-scripts build && copy .htaccess build\\.htaccess"
  }
}
```

Kemudian jalankan:
```bash
npm run build:deploy
```

### 3. Upload ke Hosting

Upload semua isi folder `build/` ke root domain atau subfolder di hosting Anda.

**Struktur di Hosting:**
```
public_html/
├── .htaccess          ← File ini penting!
├── index.html
├── static/
│   ├── css/
│   └── js/
├── favicon.ico
└── ... (file lainnya)
```

### 4. Konfigurasi HTTPS (Opsional)

Jika hosting Anda sudah support HTTPS, uncomment baris berikut di `.htaccess`:
```apache
# Redirect HTTP to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 5. Test Deployment

1. Buka website Anda di browser
2. Test navigasi (semua route harus berfungsi)
3. Test refresh halaman (tidak ada error 404)
4. Cek di Developer Tools > Network untuk memastikan kompresi Gzip aktif

## Troubleshooting

### Error 404 saat refresh halaman
- Pastikan `.htaccess` sudah ada di folder yang benar
- Pastikan mod_rewrite aktif di Apache
- Cek permission file `.htaccess` (harus readable)

### Gzip tidak aktif
- Pastikan mod_deflate aktif di Apache
- Cek dengan tools seperti https://www.giftofspeed.com/gzip-test/

### Routing tidak bekerja
- Pastikan semua request redirect ke `index.html`
- Cek console browser untuk error
- Pastikan base URL di `package.json` sesuai

## Catatan Penting

- File `.htaccess` hanya bekerja di server Apache
- Untuk Nginx, gunakan konfigurasi Nginx yang berbeda
- Pastikan PHP dan mod_rewrite sudah aktif di hosting
- Backup file `.htaccess` sebelum mengubah konfigurasi

