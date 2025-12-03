# Kasir POS Frontend - Documentation

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Architecture](#architecture)
5. [Components](#components)
6. [Features](#features)
7. [Build & Deployment](#build--deployment)
8. [Electron Build](#electron-build)

---

## 🎯 Overview

**Kasir POS Frontend** adalah aplikasi web frontend untuk sistem Point of Sale yang dibangun dengan **React 19** dan **TypeScript**. Aplikasi ini dapat dijalankan sebagai web application atau sebagai desktop application menggunakan **Electron**.

### Fitur Utama

- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Modern UI dengan Tailwind CSS
- ✅ POS Interface dengan keyboard shortcuts
- ✅ Real-time data dengan caching
- ✅ Receipt printing (PDF & HTML)
- ✅ Electron desktop app support
- ✅ Native printer support (Electron)
- ✅ Offline-ready (dengan caching)

---

## 💻 Tech Stack

### Core Technologies
- **React** 19.1.0
- **TypeScript** 4.9.5
- **React Router** 6.8.0
- **Axios** 1.10.0 (HTTP client)

### UI Libraries
- **Tailwind CSS** 3.x
- **Headless UI** 2.2.4
- **Heroicons** 2.2.0
- **React Hot Toast** 2.5.2 (Notifications)

### Charts & Visualization
- **Recharts** 3.1.0
- **Chart.js** 4.5.0
- **React ChartJS 2** 5.3.0

### Desktop App
- **Electron** (untuk desktop build)
- **Electron Builder** (untuk packaging)

---

## 📦 Installation

### Prerequisites

- Node.js >= 16.x
- npm atau yarn

### Step 1: Install Dependencies

```bash
cd kasir-pos-frontend
npm install
```

### Step 2: Environment Configuration

Create `.env` file:

```env
REACT_APP_API_URL=https://kasir-pos-api.sunnflower.site/api/v1
PORT=4173
```

### Step 3: Run Development Server

```bash
npm start
```

Application akan berjalan di `http://localhost:4173`

---

## 🏗️ Architecture

Lihat [ARCHITECTURE.md](./ARCHITECTURE.md) untuk dokumentasi lengkap arsitektur.

### Folder Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── pos/            # POS interface
│   ├── products/       # Product management
│   ├── transactions/   # Transaction management
│   ├── reports/        # Report components
│   └── ...
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── FullscreenContext.tsx
├── hooks/              # Custom hooks
│   ├── useApiCache.ts
│   ├── useElectron.ts
│   └── ...
├── pages/              # Page components
├── services/           # API services
│   ├── api.ts
│   └── printerService.ts
├── types/              # TypeScript types
├── utils/              # Utility functions
└── App.tsx             # Main app component
```

---

## 🧩 Components

Lihat [COMPONENTS.md](./COMPONENTS.md) untuk dokumentasi lengkap semua components.

### Component Categories

1. **Layout Components**
   - `Layout` - Main layout wrapper
   - `Sidebar` - Navigation sidebar
   - `Header` - Top header bar

2. **Feature Components**
   - `POSInterface` - Point of Sale interface
   - `ProductList` - Product management
   - `TransactionList` - Transaction history
   - `Dashboard` - Dashboard overview
   - Report components (Enhanced, Financial, Advanced)

3. **Common Components**
   - `ProtectedRoute` - Route protection
   - `ErrorBoundary` - Error handling
   - Form components
   - Modal components

---

## ✨ Features

Lihat [FEATURES.md](./FEATURES.md) untuk dokumentasi lengkap semua fitur.

### Key Features

1. **Authentication**
   - Login/Logout
   - Token-based auth
   - Auto token refresh
   - Protected routes

2. **POS Interface**
   - Product search & selection
   - Shopping cart
   - Customer selection
   - Payment processing
   - Receipt printing
   - Keyboard shortcuts

3. **Product Management**
   - Product CRUD
   - Category management
   - Stock management
   - Barcode support

4. **Transaction Management**
   - Transaction history
   - Transaction details
   - Refund processing
   - Receipt reprint

5. **Reporting**
   - Enhanced Report
   - Financial Report
   - Advanced Report
   - Report export

6. **Settings**
   - Application settings
   - Receipt settings
   - Company settings
   - User management
   - Role & permission management

---

## 🚀 Build & Deployment

Lihat [BUILD.md](./BUILD.md) untuk panduan build & deployment lengkap.

### Development Build

```bash
npm start
```

### Production Build

```bash
npm run build
```

Build files akan tersimpan di folder `build/`

### Build for Production (with .htaccess)

```bash
npm run build:prod
```

Script ini akan:
1. Build aplikasi
2. Copy `.htaccess` ke `build/`

---

## 🖥️ Electron Build

### Development Mode

```bash
npm run electron-dev
```

Ini akan menjalankan:
1. React dev server (`npm start`)
2. Electron app yang connect ke dev server

### Build Electron App

**Windows:**
```bash
npm run dist-win
```

**macOS:**
```bash
npm run dist-mac
```

**Linux:**
```bash
npm run dist-linux
```

**All Platforms:**
```bash
npm run dist
```

Output akan tersimpan di folder `dist/`

### Electron Features

- ✅ Native printer support
- ✅ Window management
- ✅ File system access
- ✅ System information
- ✅ Auto-updater ready

---

## 🔧 Configuration

### API Configuration

File: `src/services/api.ts`

```typescript
baseURL: process.env.REACT_APP_API_URL || 'https://kasir-pos-api.sunnflower.site/api/v1'
```

### Electron Configuration

File: `package.json` - `build` section

### Build Configuration

File: `tailwind.config.js` - Tailwind CSS configuration

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [COMPONENTS.md](./COMPONENTS.md) - Components documentation
- [FEATURES.md](./FEATURES.md) - Features documentation
- [BUILD.md](./BUILD.md) - Build & deployment guide

---

**Last Updated**: January 2025

