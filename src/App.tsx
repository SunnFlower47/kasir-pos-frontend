import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import POSInterface from './components/pos/POSInterface';
import ProductList from './components/products/ProductList';
import StockList from './components/stocks/StockList';
import CustomerList from './components/customers/CustomerList';
import SupplierList from './components/suppliers/SupplierList';
import PurchaseList from './components/purchases/PurchaseList';
import CreatePurchase from './pages/CreatePurchase';
import EditPurchase from './pages/EditPurchase';
import OutletList from './components/outlets/OutletList';
import UserList from './components/users/UserList';
import RolePermissionPage from './pages/RolePermissionPage';
import TransactionHistory from './components/transactions/TransactionHistory';
import TransactionDetailPage from './components/transactions/TransactionDetailPage';
import ReportDashboard from './components/reports/ReportDashboardMain';
import SettingsPage from './pages/SettingsPage';
import Settings from './components/settings/Settings';
import TestReports from './components/TestReports';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
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
                    <POSInterface />
                  </ProtectedRoute>
                }
              />

              {/* Products Route */}
              <Route
                path="products"
                element={
                  <ProtectedRoute permission="products.view">
                    <ProductList />
                  </ProtectedRoute>
                }
              />

              {/* Stocks Route */}
              <Route
                path="stocks"
                element={
                  <ProtectedRoute permission="stocks.view">
                    <StockList />
                  </ProtectedRoute>
                }
              />

              {/* Customers Route */}
              <Route
                path="customers"
                element={
                  <ProtectedRoute permission="customers.view">
                    <CustomerList />
                  </ProtectedRoute>
                }
              />

              {/* Suppliers Route */}
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute permission="suppliers.view">
                    <SupplierList />
                  </ProtectedRoute>
                }
              />

              {/* Purchases Route */}
              <Route
                path="purchases"
                element={
                  <ProtectedRoute permission="purchases.view">
                    <PurchaseList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases/create"
                element={
                  <ProtectedRoute permission="purchases.create">
                    <CreatePurchase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases/:id/edit"
                element={
                  <ProtectedRoute permission="purchases.update">
                    <EditPurchase />
                  </ProtectedRoute>
                }
              />

              {/* Transactions Routes */}
              <Route
                path="transactions"
                element={
                  <ProtectedRoute permission="transactions.view">
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transactions/:id"
                element={
                  <ProtectedRoute permission="transactions.view">
                    <TransactionDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Reports Route */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute permission="reports.sales">
                    <ReportDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Outlets Route */}
              <Route
                path="outlets"
                element={
                  <ProtectedRoute role="Super Admin">
                    <OutletList />
                  </ProtectedRoute>
                }
              />

              {/* User Management Route */}
              <Route
                path="users"
                element={
                  <ProtectedRoute role={['Super Admin', 'Admin']}>
                    <UserList />
                  </ProtectedRoute>
                }
              />

              {/* Role & Permission Management Route */}
              <Route
                path="role-permissions"
                element={
                  <ProtectedRoute role={['Super Admin', 'Admin']}>
                    <RolePermissionPage />
                  </ProtectedRoute>
                }
              />

              {/* Settings Route */}
              <Route
                path="settings"
                element={
                  <ProtectedRoute permission="settings.view">
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Test Reports Route */}
              <Route
                path="test-reports"
                element={<TestReports />}
              />

              {/* Settings Route */}
              <Route
                path="settings"
                element={<SettingsPage />}
              />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
