/**
 * Cache Invalidation Utility
 * Helper functions to invalidate cache when CRUD operations occur
 */

import { invalidateCache } from '../hooks/useApiCache';

/**
 * Invalidate product-related cache
 */
export function invalidateProductCache(): void {
  invalidateCache('products');
  invalidateCache('product-');
}

/**
 * Invalidate category-related cache
 */
export function invalidateCategoryCache(): void {
  invalidateCache('categories');
  invalidateCache('category-');
}

/**
 * Invalidate unit-related cache
 */
export function invalidateUnitCache(): void {
  invalidateCache('units');
  invalidateCache('unit-');
}

/**
 * Invalidate stock-related cache
 */
export function invalidateStockCache(): void {
  invalidateCache('stocks');
  invalidateCache('stock-');
  // Also invalidate products since stock affects product data
  invalidateCache('products');
}

/**
 * Invalidate customer-related cache
 */
export function invalidateCustomerCache(): void {
  invalidateCache('customers');
  invalidateCache('customer-');
}

/**
 * Invalidate transaction-related cache
 */
export function invalidateTransactionCache(): void {
  invalidateCache('transactions');
  invalidateCache('transaction-');
  invalidateCache('dashboard');
  invalidateCache('report-');
  invalidateCache('professional-report');
  invalidateCache('enhanced-report');
}

/**
 * Invalidate expense-related cache
 */
export function invalidateExpenseCache(): void {
  invalidateCache('expenses');
  invalidateCache('expense-');
  invalidateCache('dashboard');
  invalidateCache('report-');
  invalidateTransactionCache(); // Expenses also affect transactions/dashboard
}

/**
 * Invalidate purchase-related cache
 */
export function invalidatePurchaseCache(): void {
  invalidateCache('purchases');
  invalidateCache('purchase-');
  invalidateCache('dashboard');
  invalidateStockCache(); // Stock changes when purchase occurs
}

/**
 * Invalidate outlet-related cache
 */
export function invalidateOutletCache(): void {
  invalidateCache('outlets');
  invalidateCache('outlet-');
}

/**
 * Invalidate settings cache
 */
export function invalidateSettingsCache(): void {
  invalidateCache('settings');
  invalidateCache('setting-');
}

/**
 * Invalidate dashboard cache
 */
export function invalidateDashboardCache(): void {
  invalidateCache('dashboard');
  invalidateCache('dashboard-');
}

/**
 * Invalidate all report caches
 */
export function invalidateReportCache(): void {
  invalidateCache('report-');
  invalidateCache('professional-report');
  invalidateCache('enhanced-report');
}

/**
 * Invalidate all cache (use with caution)
 */
export function invalidateAllCache(): void {
  import('../hooks/useApiCache').then(({ invalidateAllCache }) => {
    invalidateAllCache();
  });
}

/**
 * Helper to invalidate multiple cache types at once
 */
export function invalidateMultipleCache(types: Array<
  'products' | 'categories' | 'units' | 'stocks' | 'customers' | 
  'transactions' | 'purchases' | 'outlets' | 'settings' | 
  'dashboard' | 'reports'
>): void {
  types.forEach(type => {
    switch (type) {
      case 'products':
        invalidateProductCache();
        break;
      case 'categories':
        invalidateCategoryCache();
        break;
      case 'units':
        invalidateUnitCache();
        break;
      case 'stocks':
        invalidateStockCache();
        break;
      case 'customers':
        invalidateCustomerCache();
        break;
      case 'transactions':
        invalidateTransactionCache();
        break;
      case 'purchases':
        invalidatePurchaseCache();
        break;
      case 'outlets':
        invalidateOutletCache();
        break;
      case 'settings':
        invalidateSettingsCache();
        break;
      case 'dashboard':
        invalidateDashboardCache();
        break;
      case 'reports':
        invalidateReportCache();
        break;
    }
  });
}

