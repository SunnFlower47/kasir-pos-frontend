# Build & Deployment Guide

## 📦 Build Commands

### Development

```bash
npm start
```

Runs development server di `http://localhost:4173`

### Production Build

```bash
npm run build
```

Builds production-ready files di folder `build/`

### Build with .htaccess

```bash
npm run build:prod
```

Builds dan copy `.htaccess` ke `build/` folder (untuk Apache servers)

---

## 🏗️ Build Process

### 1. Code Compilation

- TypeScript compilation
- React compilation
- Asset optimization
- Code minification
- Source maps generation (production)

### 2. Asset Processing

- CSS compilation (Tailwind)
- Image optimization
- Font bundling
- Static asset copying

### 3. Output

Build output structure:
```
build/
├── index.html
├── static/
│   ├── css/
│   │   └── main.[hash].css
│   ├── js/
│   │   ├── main.[hash].js
│   │   └── [chunk].[hash].js
│   └── media/
│       └── [assets]
└── .htaccess (if copied)
```

---

## 🌐 Web Deployment

### Method 1: Traditional Web Hosting

#### Step 1: Build Application

```bash
npm run build:prod
```

#### Step 2: Upload Files

Upload seluruh isi folder `build/` ke web server (via FTP/SFTP).

#### Step 3: Configure Web Server

**Apache (.htaccess)**

File `.htaccess` sudah include di build:

```apache
# React Router support
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Static files
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
</IfModule>
```

**Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 4: Environment Variables

Set environment variable untuk API URL:

```env
REACT_APP_API_URL=https://kasir-pos-api.sunnflower.site/api/v1
```

Atau edit `build/static/js/*.js` (tidak disarankan) atau gunakan build-time env vars.

---

### Method 2: Static Hosting (Netlify, Vercel, etc.)

#### Netlify

**netlify.toml**:
```toml
[build]
  command = "npm run build:prod"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🖥️ Electron Build

### Development

```bash
npm run electron-dev
```

Menjalankan React dev server + Electron app.

### Build Electron App

#### Windows

```bash
npm run dist-win
```

Output: `dist/Kasir POS System Setup.exe`

#### macOS

```bash
npm run dist-mac
```

Output: `dist/Kasir POS System-[version].dmg`

#### Linux

```bash
npm run dist-linux
```

Output: `dist/Kasir POS System-[version].AppImage`

#### All Platforms

```bash
npm run dist
```

Builds untuk semua platform yang didukung.

### Electron Build Configuration

**File**: `package.json` - `build` section

```json
{
  "build": {
    "appId": "com.kasirpos.app",
    "productName": "Kasir POS System",
    "directories": {
      "buildResources": "build"
    },
    "files": [
      "build/**/*",
      "public/electron.js",
      "public/preload.js"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icon.png"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/icon.png"
    }
  }
}
```

---

## 🔧 Build Configuration

### Environment Variables

**Development** (`.env`):
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
PORT=4173
```

**Production** (set saat build):
```bash
REACT_APP_API_URL=https://api.example.com/api/v1 npm run build
```

### API URL Configuration

API URL dapat dikonfigurasi via:
1. Environment variable `REACT_APP_API_URL`
2. Default fallback di `src/services/api.ts`

---

## 📁 Build Output

### Web Build

```
build/
├── index.html              # Main HTML file
├── static/
│   ├── css/
│   │   └── main.[hash].css
│   ├── js/
│   │   ├── main.[hash].js
│   │   └── [chunk].[hash].js
│   └── media/
└── .htaccess              # Apache config (if copied)
```

### Electron Build

```
dist/
├── win-unpacked/          # Windows unpacked
│   └── Kasir POS System.exe
├── mac-unpacked/          # macOS unpacked
├── linux-unpacked/        # Linux unpacked
└── Kasir POS System Setup.exe  # Windows installer
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Update `.env` dengan production API URL
- [ ] Test build locally
- [ ] Check all routes working
- [ ] Test API connection
- [ ] Test authentication flow

### Build

- [ ] Run `npm run build:prod`
- [ ] Verify build output
- [ ] Check `.htaccess` exists (for Apache)
- [ ] Test build locally

### Deployment

- [ ] Upload build files to server
- [ ] Configure web server (Apache/Nginx)
- [ ] Set correct file permissions
- [ ] Test application in production
- [ ] Check API connectivity
- [ ] Test authentication
- [ ] Verify all routes working

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check performance
- [ ] Test critical features
- [ ] Setup monitoring (optional)

---

## 🔍 Troubleshooting

### Issue: Blank Page

**Check:**
1. Browser console untuk errors
2. Network tab untuk failed requests
3. API URL configuration
4. `.htaccess` configuration (Apache)

### Issue: 404 on Routes

**Solution**: Pastikan web server dikonfigurasi untuk SPA routing.

**Apache**: Pastikan `.htaccess` ada dan aktif.

**Nginx**: Tambahkan redirect rules.

### Issue: API Connection Failed

**Check:**
1. API URL di environment variables
2. CORS configuration di backend
3. Network connectivity
4. SSL certificates (HTTPS)

### Issue: Assets Not Loading

**Check:**
1. File permissions
2. Web server MIME types
3. Static file serving configuration
4. Base path configuration

### Issue: Electron Build Fails

**Check:**
1. Dependencies installed
2. Build tools installed (for native modules)
3. Electron builder configuration
4. Platform-specific requirements

---

## 📊 Performance Optimization

### Build Optimization

- ✅ Code splitting (automatic)
- ✅ Tree shaking (automatic)
- ✅ Minification (automatic)
- ✅ Asset optimization (automatic)

### Runtime Optimization

- ✅ Lazy loading components
- ✅ API response caching
- ✅ Debounced search
- ✅ Pagination

---

## 🔒 Security Considerations

### Build Security

- ✅ No sensitive data in build
- ✅ Environment variables at build time
- ✅ No source maps in production (optional)

### Deployment Security

- ✅ HTTPS enforcement
- ✅ Security headers
- ✅ CORS configuration
- ✅ API authentication

---

**Last Updated**: January 2025

