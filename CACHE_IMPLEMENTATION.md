# Dokumentasi Sistem Cache - Kasir POS Frontend

## 📋 Overview

Sistem cache di aplikasi ini menggunakan **dual-layer caching**:
1. **In-Memory Cache** (JavaScript Map) - Cepat, reset saat reload
2. **localStorage Cache** (Optional) - Persist data across reloads

## 🏗️ Arsitektur

### 1. Core Cache System (`useApiCache.ts`)

**Class ApiCache:**
- Menyimpan data di memory (Map) dan localStorage (optional)
- TTL (Time To Live) untuk auto-expiry
- Pattern-based clearing untuk invalidation

**Hook `useApiCache`:**
```typescript
const { data, loading, error, refetch } = useApiCache<T>(
  'cache-key',
  async () => {
    // Fetch function
    const response = await apiService.getData();
    return response.data;
  },
  {
    ttl: 5 * 60 * 1000,        // 5 menit (default)
    useLocalStorage: false,     // Persist ke localStorage?
    refetchOnMount: false,      // Force refetch setiap mount?
    enabled: true               // Enable/disable cache
  }
);
```

### 2. Cache Invalidation (`cacheInvalidation.ts`)

Helper functions untuk invalidate cache berdasarkan pattern:
- `invalidateProductCache()` - Clear semua cache terkait products
- `invalidateCustomerCache()` - Clear semua cache terkait customers
- `invalidateTransactionCache()` - Clear transactions + dashboard + reports
- dll.

## 📝 Cara Penggunaan

### A. Basic Usage (In-Memory Only)

```typescript
import { useApiCache } from '../../hooks/useApiCache';

const MyComponent: React.FC = () => {
  const { data, loading, error } = useApiCache<Product[]>(
    'products-list', // Cache key
    async () => {
      const response = await apiService.getProducts();
      return response.data || [];
    },
    { ttl: 2 * 60 * 1000 } // 2 menit
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
};
```

### B. With localStorage Persistence

Untuk data yang jarang berubah (categories, units, settings):

```typescript
const { data: categories } = useApiCache<Category[]>(
  'categories-list',
  async () => {
    const response = await apiService.getCategories();
    return response.data || [];
  },
  { 
    ttl: 30 * 60 * 1000,      // 30 menit
    useLocalStorage: true      // Persist ke localStorage
  }
);
```

### C. Cache dengan Dynamic Key

Untuk data yang tergantung parameter (outlet_id, dll):

```typescript
const cacheKey = `dashboard-${selectedOutletId || 'global'}`;
const { data } = useApiCache<DashboardData>(
  cacheKey,
  async () => {
    const response = await apiService.getDashboard({ 
      outlet_id: selectedOutletId 
    });
    return response.data;
  },
  { ttl: 2 * 60 * 1000 }
);
```

### D. Manual Refetch

```typescript
const { data, refetch } = useApiCache<Product[]>(
  'products-list',
  fetchProducts
);

// Manual refresh
const handleRefresh = () => {
  refetch(); // Ini akan clear cache dan fetch ulang
};
```

## 🔄 Cache Invalidation Strategy

### Kapan Invalidate Cache?

Cache harus di-invalidate setelah **CRUD operations** untuk memastikan data selalu fresh:

```typescript
import { invalidateProductCache } from '../../utils/cacheInvalidation';

const handleCreateProduct = async (productData: Product) => {
  const response = await apiService.createProduct(productData);
  
  if (response.success) {
    // Invalidate cache agar data fresh
    invalidateProductCache();
    
    // Refresh list (atau cukup invalidate, akan auto-refresh)
    fetchData();
    
    toast.success('Product created successfully');
  }
};
```

### Invalidation Pattern

Setiap invalidate function menggunakan **pattern matching**:

```typescript
// Invalidates:
// - 'products-list'
// - 'products-detail-123'
// - 'product-stock-456'
// - dll yang mengandung "products" atau "product-"
invalidateProductCache();
```

### Cascade Invalidation

Beberapa invalidate functions juga invalidate related caches:

```typescript
// invalidateStockCache() juga invalidate:
invalidateStockCache();
// ✅ stocks-*
// ✅ products-* (karena stock affect products)
// ✅ dashboard (karena stock alerts)
// ✅ reports-* (karena stock reports)
```

## 📊 Cache Configuration by Data Type

### Static Data (Long TTL + localStorage)
- **Categories**: 30 menit, localStorage ✅
- **Units**: 30 menit, localStorage ✅
- **Outlets**: 30 menit, localStorage ✅
- **Settings**: 30 menit, localStorage ✅

### Dynamic Data (Short TTL, no localStorage)
- **Products**: 2-5 menit
- **Customers**: 2-5 menit
- **Dashboard**: 2 menit
- **Transactions**: 1-2 menit
- **Reports**: 5 menit

## 🎯 Best Practices

### 1. Cache Key Naming Convention

```
{entity}-{type}-{identifier}
```

Contoh:
- `products-list` - List semua products
- `product-detail-123` - Detail product ID 123
- `dashboard-5` - Dashboard untuk outlet ID 5
- `categories-list` - List categories
- `customer-456` - Customer ID 456

### 2. TTL Selection

- **Static/Seldom Changed**: 30 menit+ dengan localStorage
- **Moderately Changed**: 5-10 menit
- **Frequently Changed**: 1-2 menit
- **Real-time Critical**: Tidak di-cache (atau cache sangat singkat)

### 3. Always Invalidate After Mutations

```typescript
// ✅ BENAR
const handleUpdate = async () => {
  await apiService.updateProduct(id, data);
  invalidateProductCache(); // Invalidate
  refetch(); // Refresh
};

// ❌ SALAH
const handleUpdate = async () => {
  await apiService.updateProduct(id, data);
  // Missing invalidation - data akan stale
  refetch();
};
```

### 4. Use localStorage Wisely

**Gunakan localStorage untuk:**
- Data yang jarang berubah (categories, units, settings)
- Data yang penting untuk offline experience
- Data yang expensive untuk fetch

**Jangan gunakan localStorage untuk:**
- Data yang sering berubah (transactions, real-time data)
- Data sensitif (meskipun sudah secure, lebih baik tidak)
- Data besar (max 5MB limit)

## 🔧 Maintenance & Cleanup

### Auto Cleanup

Di `App.tsx`, ada auto cleanup setiap 1 menit:

```typescript
useEffect(() => {
  const cleanup = startCacheCleanup(60 * 1000); // Clean every minute
  return cleanup;
}, []);
```

### Manual Cleanup

```typescript
import { invalidateAllCache } from '../../hooks/useApiCache';

// Clear semua cache (hati-hati!)
invalidateAllCache();
```

## 📍 Current Implementation Status

### ✅ Sudah Implemented

1. **ProductList** - Cache categories & units (localStorage)
2. **Dashboard** - Cache dengan outlet-specific key
3. **CustomerList** - (Akan diimplementasikan jika perlu)
4. **Cache Invalidation** - Di semua CRUD operations:
   - ProductForm (create/update)
   - CategoryForm (create/update/delete)
   - UnitForm (create/update/delete)
   - StockList (adjust/transfer/opname)
   - CustomerForm (create/update/delete)
   - PaymentModal (transaction)

### 🔄 Bisa Dioptimasi

1. **TransactionHistory** - Bisa ditambah cache dengan filter key
2. **Report Dashboards** - Bisa cache dengan date range key
3. **CustomerList** - Bisa cache customer list
4. **POS Interface** - Cache products untuk quick search

## 🐛 Troubleshooting

### Cache tidak invalidate
- Pastikan import `invalidateXXXCache` dari `cacheInvalidation.ts`
- Cek pattern matching (cache key harus match pattern)

### Data stale setelah update
- Pastikan invalidate dipanggil setelah mutation
- Cek TTL - mungkin terlalu lama
- Cek apakah ada cache dengan key berbeda yang tidak ter-invalidate

### localStorage quota exceeded
- Kurangi data yang di-persist ke localStorage
- Implement size check sebelum store
- Cleanup expired entries lebih sering

## 📚 Contoh Lengkap

```typescript
import { useApiCache } from '../../hooks/useApiCache';
import { invalidateProductCache } from '../../utils/cacheInvalidation';

const ProductList: React.FC = () => {
  // Cache dengan localStorage untuk categories (static data)
  const { data: categories } = useApiCache<Category[]>(
    'categories-list',
    async () => {
      const response = await apiService.getCategories();
      return response.data || [];
    },
    { ttl: 30 * 60 * 1000, useLocalStorage: true }
  );

  // Cache products (no localStorage, frequently updated)
  const { data: products, refetch } = useApiCache<Product[]>(
    'products-list',
    async () => {
      const response = await apiService.getProducts();
      return response.data || [];
    },
    { ttl: 2 * 60 * 1000 } // 2 menit
  );

  const handleDelete = async (id: number) => {
    await apiService.deleteProduct(id);
    
    // Invalidate cache
    invalidateProductCache();
    
    // Refetch (akan ambil dari API karena cache sudah di-clear)
    refetch();
    
    toast.success('Product deleted');
  };

  return <div>{/* Render products */}</div>;
};
```

## 🎉 Kesimpulan

Sistem cache ini memberikan:
- ✅ **Performance** - Mengurangi API calls
- ✅ **Offline Support** - Dengan localStorage untuk static data
- ✅ **Data Consistency** - Dengan invalidation yang tepat
- ✅ **Flexibility** - TTL dan storage options dapat dikustomisasi

