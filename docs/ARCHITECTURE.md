# Frontend Architecture Documentation

## 🏗️ Architecture Overview

Frontend aplikasi menggunakan **React 19** dengan arsitektur berbasis komponen yang modular dan reusable. Aplikasi ini mengikuti pattern **Component-Based Architecture** dengan pemisahan concerns yang jelas.

---

## 📁 Project Structure

```
kasir-pos-frontend/
├── public/                 # Static files
│   ├── index.html
│   ├── electron.js        # Electron main process
│   ├── preload.js         # Electron preload script
│   └── ...
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication
│   │   ├── dashboard/    # Dashboard
│   │   ├── pos/          # POS interface
│   │   ├── products/     # Product management
│   │   ├── transactions/ # Transaction management
│   │   ├── reports/      # Reports
│   │   ├── settings/     # Settings
│   │   └── ...
│   ├── contexts/         # React Contexts
│   │   ├── AuthContext.tsx
│   │   └── FullscreenContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useApiCache.ts
│   │   ├── useElectron.ts
│   │   ├── useDebounce.ts
│   │   └── ...
│   ├── pages/            # Page components
│   ├── services/         # API & services
│   │   ├── api.ts
│   │   └── printerService.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Root component
│   └── index.tsx         # Entry point
├── docs/                 # Documentation
└── package.json
```

---

## 🔄 Data Flow

### 1. API Service Layer

**Location**: `src/services/api.ts`

Semua API calls dilakukan melalui `ApiService` class yang:
- Menggunakan Axios untuk HTTP requests
- Menambahkan authentication token ke headers
- Menangani error responses
- Menyediakan type-safe methods

```typescript
// Example usage
const response = await apiService.getProducts({ search: 'test' });
```

### 2. State Management

#### Local State (useState)
Untuk state komponen lokal:
```typescript
const [products, setProducts] = useState<Product[]>([]);
```

#### Context API
Untuk global state:
- `AuthContext` - Authentication state
- `FullscreenContext` - Fullscreen mode state

#### Custom Hooks
Untuk reusable logic:
- `useApiCache` - API caching
- `useElectron` - Electron integration
- `useDebounce` - Debounced values

### 3. Caching Strategy

**Location**: `src/hooks/useApiCache.ts`

Caching menggunakan:
- **In-memory cache** - Fast access
- **localStorage** - Persistent cache (optional)
- **TTL-based expiration** - Auto cleanup
- **Cache invalidation** - Manual clear on CRUD

```typescript
const { data, loading, refetch } = useApiCache(
  'products-list',
  () => apiService.getProducts(),
  { ttl: 5 * 60 * 1000 } // 5 minutes
);
```

---

## 🧩 Component Architecture

### Component Types

#### 1. **Layout Components**
- `Layout` - Main layout wrapper dengan sidebar & header
- `Sidebar` - Navigation sidebar
- `Header` - Top header bar

#### 2. **Page Components**
- Halaman utama (routes)
- Menggunakan layout components
- Mengatur data fetching

#### 3. **Feature Components**
- Domain-specific components
- POS, Products, Transactions, Reports, etc.

#### 4. **Shared Components**
- Reusable UI components
- Forms, Modals, Buttons, etc.

### Component Hierarchy

```
App
├── AuthProvider
├── FullscreenProvider
├── ErrorBoundary
└── Router
    ├── Login (Public)
    └── ProtectedRoute
        └── Layout
            ├── Sidebar
            ├── Header
            └── Routes
                ├── Dashboard
                ├── POS
                ├── Products
                └── ...
```

---

## 🔐 Authentication Flow

### 1. Login Process

```
User Input → Login Component → ApiService.login()
    ↓
Backend validates → Returns token
    ↓
Save token to localStorage
    ↓
Update AuthContext
    ↓
Redirect to Dashboard
```

### 2. Protected Routes

```typescript
<ProtectedRoute permission="products.view">
  <ProductList />
</ProtectedRoute>
```

`ProtectedRoute` checks:
- User authentication (token exists)
- User permissions (if specified)
- Redirects to login if unauthorized

### 3. Token Management

- Token stored in `localStorage`
- Token added to all API requests via Axios interceptor
- Auto logout on 401 response
- Token refresh support

---

## 📡 API Integration

### Request Flow

```
Component → useApiCache / direct call
    ↓
ApiService method
    ↓
Axios request with token
    ↓
Backend API
    ↓
Response handling
    ↓
Update state / cache
```

### Error Handling

```typescript
try {
  const response = await apiService.getProducts();
  if (response.success) {
    setProducts(response.data);
  }
} catch (error) {
  toast.error('Failed to load products');
}
```

Error types:
- `401` - Unauthorized → Auto logout
- `403` - Forbidden → Show permission error
- `422` - Validation error → Show field errors
- `500` - Server error → Show generic error

---

## 🎨 Styling Architecture

### Tailwind CSS

Menggunakan **Tailwind CSS** untuk styling:

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Submit
</button>
```

### Custom Styles

- `src/index.css` - Global styles
- `src/styles/responsive.css` - Responsive utilities
- Component-level Tailwind classes

### Theme

Tidak ada theme system built-in, tetapi dapat ditambahkan dengan Tailwind config.

---

## 🖥️ Electron Integration

### Main Process

**File**: `public/electron.js`

Responsibilities:
- Window management
- File system access
- Printer integration
- System information

### Preload Script

**File**: `public/preload.js`

Exposes safe API to renderer:
```typescript
window.electronAPI.printReceipt(...)
```

### Renderer Integration

**Hook**: `src/hooks/useElectron.ts`

```typescript
const { isElectron, printReceipt } = useElectron();
```

---

## 🔄 Routing

### React Router

**File**: `src/App.tsx`

Routes configuration:
- Public routes (Login)
- Protected routes (Dashboard, POS, etc.)
- Lazy loading untuk code splitting

```typescript
<Route path="/pos" element={
  <ProtectedRoute>
    <POSInterface />
  </ProtectedRoute>
} />
```

---

## 📦 Code Splitting

### Lazy Loading

```typescript
const ProfessionalReports = lazy(() => import('./pages/ProfessionalReports'));
```

Benefits:
- Smaller initial bundle
- Faster initial load
- On-demand loading

---

## 🎯 Performance Optimizations

### 1. Caching
- API response caching
- localStorage persistence
- TTL-based expiration

### 2. Debouncing
- Search input debounce (300ms)
- Reduces API calls

### 3. Memoization
- `useMemo` untuk expensive calculations
- `useCallback` untuk function references
- `React.memo` untuk component memoization (where applicable)

### 4. Pagination
- Server-side pagination
- Reduces data transfer

### 5. Lazy Loading
- Component lazy loading
- Route-based code splitting

---

## 🔒 Security

### Frontend Security

1. **Token Storage**
   - Stored in `localStorage`
   - Not accessible via XSS (HttpOnly not available for localStorage)

2. **XSS Protection**
   - React escapes by default
   - No `dangerouslySetInnerHTML` usage

3. **CORS**
   - Handled by backend
   - Frontend validates responses

4. **Input Validation**
   - Client-side validation
   - Backend validation (always enforced)

---

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Component logic
- **Integration Tests**: API integration
- **E2E Tests**: User flows (recommended)

### Test Files Location

```
src/
├── components/
│   └── __tests__/
└── services/
    └── __tests__/
```

---

## 📚 Best Practices

### 1. Component Structure

```typescript
// ✅ Good
const ProductList: React.FC = () => {
  // Hooks
  const [products, setProducts] = useState([]);
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return <div>...</div>;
};
```

### 2. Type Safety

```typescript
// ✅ Good - Use TypeScript types
interface Product {
  id: number;
  name: string;
}

const [product, setProduct] = useState<Product | null>(null);
```

### 3. Error Handling

```typescript
// ✅ Good - Handle errors properly
try {
  const response = await apiService.getProducts();
  if (response.success) {
    setProducts(response.data);
  } else {
    toast.error(response.message);
  }
} catch (error) {
  toast.error('Failed to load products');
}
```

### 4. Performance

```typescript
// ✅ Good - Use useCallback for handlers
const handleSubmit = useCallback(() => {
  // ...
}, [dependencies]);

// ✅ Good - Use useMemo for expensive calculations
const filteredProducts = useMemo(() => {
  return products.filter(p => p.name.includes(search));
}, [products, search]);
```

---

**Last Updated**: January 2025

