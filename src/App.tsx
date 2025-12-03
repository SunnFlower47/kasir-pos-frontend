import React, { lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { FullscreenProvider } from './contexts/FullscreenContext';
import ErrorBoundary from './components/ErrorBoundary';
import LazyWrapper from './components/LazyWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import GlobalHotkeys from './components/GlobalHotkeys';
import { startCacheCleanup } from './hooks/useApiCache';

// Lazy load components
const POSInterface = lazy(() => import('./components/pos/POSInterface'));
const ProductList = lazy(() => import('./components/products/ProductList'));
const StockList = lazy(() => import('./components/stocks/StockList'));
const CustomerList = lazy(() => import('./components/customers/CustomerList'));
const CategoryList = lazy(() => import('./components/categories/CategoryList'));
const UnitList = lazy(() => import('./components/units/UnitList'));
const AddCustomer = lazy(() => import('./pages/customers/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/customers/EditCustomer'));
const SupplierList = lazy(() => import('./components/suppliers/SupplierList'));
const PurchaseList = lazy(() => import('./components/purchases/PurchaseList'));
const CreatePurchase = lazy(() => import('./pages/CreatePurchase'));
const EditPurchase = lazy(() => import('./pages/EditPurchase'));
const PurchaseDetail = lazy(() => import('./pages/PurchaseDetail'));
const ExpenseList = lazy(() => import('./components/expenses/ExpenseList'));
const OutletList = lazy(() => import('./components/outlets/OutletList'));
const AddOutlet = lazy(() => import('./pages/outlets/AddOutlet'));
const EditOutlet = lazy(() => import('./pages/outlets/EditOutlet'));
const UserList = lazy(() => import('./components/users/UserList'));
const RolePermissionPage = lazy(() => import('./pages/RolePermissionPage'));
const TransactionHistory = lazy(() => import('./components/transactions/TransactionHistory'));
const TransactionDetailPage = lazy(() => import('./components/transactions/TransactionDetailPage'));
const EnhancedReportDashboard = lazy(() => import('./components/reports/EnhancedReportDashboard'));
const FinancialReportDashboard = lazy(() => import('./components/reports/FinancialReportDashboard'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TestReports = lazy(() => import('./components/TestReports'));
const ProfessionalReports = lazy(() => import('./pages/ProfessionalReports'));
const AuditLogList = lazy(() => import('./components/audit/AuditLogList'));
const ExportImport = lazy(() => import('./pages/ExportImport'));

function App() {
  // Start cache cleanup on app mount
  useEffect(() => {
    const cleanup = startCacheCleanup(60 * 1000); // Clean every minute
    return cleanup;
  }, []);

  // Suppress ResizeObserver loop errors (harmless browser warning)
  // This error occurs when ResizeObserver detects size changes that trigger
  // layout changes, creating a loop. It's safe to ignore in most cases.
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (
        event.message &&
        event.message.includes('ResizeObserver loop completed with undelivered notifications')
      ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      return true;
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason?.toString() || '';
      if (message.includes('ResizeObserver loop')) {
        event.preventDefault();
        return;
      }
    };

    // Catch error events
    window.addEventListener('error', errorHandler);
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Suppress console errors for ResizeObserver (optional, more aggressive)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      
      if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
        // Silently ignore - this is a harmless browser warning
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FullscreenProvider>
          <Router>
            <GlobalHotkeys />
          <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* POS Route */}
              <Route
                path="pos"
                element={
                  <ProtectedRoute permission="transactions.create">
                    <LazyWrapper>
                      <POSInterface />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Products Route */}
              <Route
                path="products"
                element={
                  <ProtectedRoute permission="products.view">
                    <LazyWrapper>
                      <ProductList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Categories Route */}
              <Route
                path="categories"
                element={
                  <ProtectedRoute permission="categories.view">
                    <LazyWrapper>
                      <CategoryList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Units Route */}
              <Route
                path="units"
                element={
                  <ProtectedRoute permission="units.view">
                    <LazyWrapper>
                      <UnitList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Stocks Route */}
              <Route
                path="stocks"
                element={
                  <ProtectedRoute permission="stocks.view">
                    <LazyWrapper>
                      <StockList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Customers Routes */}
              <Route
                path="customers"
                element={
                  <ProtectedRoute permission="customers.view">
                    <LazyWrapper>
                      <CustomerList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/new"
                element={
                  <ProtectedRoute permission="customers.create">
                    <LazyWrapper>
                      <AddCustomer />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/:id/edit"
                element={
                  <ProtectedRoute permission="customers.edit">
                    <LazyWrapper>
                      <EditCustomer />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Suppliers Route */}
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute permission="suppliers.view">
                    <LazyWrapper>
                      <SupplierList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Purchases Route */}
              <Route
                path="purchases"
                element={
                  <ProtectedRoute permission="purchases.view">
                    <LazyWrapper>
                      <PurchaseList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases/create"
                element={
                  <ProtectedRoute permission="purchases.create">
                    <LazyWrapper>
                      <CreatePurchase />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases/:id/edit"
                element={
                  <ProtectedRoute permission="purchases.edit">
                    <LazyWrapper>
                      <EditPurchase />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases/:id"
                element={
                  <ProtectedRoute permission="purchases.view">
                    <LazyWrapper>
                      <PurchaseDetail />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Expenses Routes */}
              <Route
                path="expenses"
                element={
                  <ProtectedRoute permission="expenses.view">
                    <LazyWrapper>
                      <ExpenseList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Transactions Routes */}
              <Route
                path="transactions"
                element={
                  <ProtectedRoute permission="transactions.view">
                    <LazyWrapper>
                      <TransactionHistory />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="transactions/:id"
                element={
                  <ProtectedRoute permission="transactions.view">
                    <LazyWrapper>
                      <TransactionDetailPage />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Reports Route */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute permission="reports.sales">
                    <LazyWrapper>
                      <EnhancedReportDashboard />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              <Route
                path="reports/financial"
                element={
                  <ProtectedRoute permission="reports.profit">
                    <LazyWrapper>
                      <FinancialReportDashboard />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />


              {/* Professional Reports Route */}
              <Route
                path="professional-reports"
                element={
                  <ProtectedRoute permission="reports.sales">
                    <LazyWrapper>
                      <ProfessionalReports />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Export/Import Route */}
              <Route
                path="export-import"
                element={
                  <ProtectedRoute permission="export.view">
                    <LazyWrapper>
                      <ExportImport />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Outlets Routes */}
              <Route
                path="outlets"
                element={
                  <ProtectedRoute role="Super Admin">
                    <LazyWrapper>
                      <OutletList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="outlets/new"
                element={
                  <ProtectedRoute role="Super Admin">
                    <LazyWrapper>
                      <AddOutlet />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="outlets/:id/edit"
                element={
                  <ProtectedRoute role="Super Admin">
                    <LazyWrapper>
                      <EditOutlet />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* User Management Route */}
              <Route
                path="users"
                element={
                  <ProtectedRoute role={['Super Admin', 'Admin']}>
                    <LazyWrapper>
                      <UserList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Role & Permission Management Route */}
              <Route
                path="role-permissions"
                element={
                  <ProtectedRoute role="Super Admin">
                    <LazyWrapper>
                      <RolePermissionPage />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Settings Route */}
              <Route
                path="settings"
                element={
                  <ProtectedRoute permission="settings.view">
                    <LazyWrapper>
                      <SettingsPage />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Audit Logs Route */}
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute permission="audit-logs.view">
                    <LazyWrapper>
                      <AuditLogList />
                    </LazyWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Test Reports Route */}
              <Route
                path="test-reports"
                element={
                  <LazyWrapper>
                    <TestReports />
                  </LazyWrapper>
                }
              />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
        </FullscreenProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
