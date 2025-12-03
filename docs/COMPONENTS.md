# Components Documentation

## 📋 Component Overview

Dokumentasi ini menjelaskan semua komponen React yang ada di aplikasi.

---

## 🧩 Component Categories

### 1. Authentication Components

#### `Login`
**Location**: `src/components/auth/Login.tsx`

Login form component.

**Props**: None

**Features**:
- Email & password login
- Remember me option
- Error handling
- Loading states

---

#### `ProtectedRoute`
**Location**: `src/components/auth/ProtectedRoute.tsx`

Route protection wrapper.

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string; // Optional permission check
  role?: string;       // Optional role check
}
```

**Features**:
- Authentication check
- Permission check (optional)
- Role check (optional)
- Auto redirect to login

---

### 2. Layout Components

#### `Layout`
**Location**: `src/components/layout/Layout.tsx`

Main layout wrapper.

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- Sidebar navigation
- Header bar
- Responsive design

---

#### `Sidebar`
**Location**: `src/components/layout/Sidebar.tsx`

Navigation sidebar.

**Features**:
- Menu items with icons
- Permission-based visibility
- Active route highlighting
- Collapsible (mobile)

---

#### `Header`
**Location**: `src/components/layout/Header.tsx`

Top header bar.

**Features**:
- User menu
- Notifications
- Search (optional)
- Fullscreen toggle

---

### 3. Dashboard Components

#### `Dashboard`
**Location**: `src/components/dashboard/Dashboard.tsx`

Main dashboard component.

**Features**:
- Overview statistics
- Revenue metrics
- Transaction metrics
- Stock alerts
- Recent transactions
- Top products

---

### 4. POS Components

#### `POSInterface`
**Location**: `src/components/pos/POSInterface.tsx`

Point of Sale interface.

**Features**:
- Product search & selection
- Shopping cart
- Customer selection
- Payment processing
- Receipt printing
- Keyboard shortcuts

---

#### `ProductGrid`
**Location**: `src/components/pos/ProductGrid.tsx`

Product grid untuk POS.

**Features**:
- Product cards
- Search & filter
- Category filter
- Quick add to cart

---

#### `Cart`
**Location**: `src/components/pos/Cart.tsx`

Shopping cart component.

**Features**:
- Cart items display
- Quantity adjustment
- Item removal
- Subtotal calculation
- Discount input

---

### 5. Product Components

#### `ProductList`
**Location**: `src/components/products/ProductList.tsx`

Product management list.

**Features**:
- Product table
- Search & filter
- Category filter
- Stock information
- CRUD operations
- Bulk actions (planned)

---

#### `ProductForm`
**Location**: `src/components/products/ProductForm.tsx`

Product form (create/edit).

**Features**:
- Product form fields
- Category selection
- Unit selection
- Image upload
- Validation
- Stock settings

---

### 6. Transaction Components

#### `TransactionList`
**Location**: `src/components/transactions/TransactionList.tsx`

Transaction history list.

**Features**:
- Transaction table
- Search & filter
- Date range filter
- Status filter
- Payment method filter
- Transaction details

---

#### `TransactionDetailModal`
**Location**: `src/components/transactions/TransactionDetailModal.tsx`

Transaction detail modal.

**Features**:
- Transaction details
- Item list
- Customer information
- Receipt preview
- Refund action

---

#### `TransactionDetailPage`
**Location**: `src/components/transactions/TransactionDetailPage.tsx`

Full-page transaction detail.

**Features**:
- Full transaction details
- Item list
- Receipt print
- Refund functionality

---

### 7. Customer Components

#### `CustomerList`
**Location**: `src/components/customers/CustomerList.tsx`

Customer management list.

**Features**:
- Customer table
- Search & filter
- Loyalty level filter
- CRUD operations
- Loyalty points management

---

#### `CustomerForm`
**Location**: `src/components/customers/CustomerForm.tsx`

Customer form (create/edit).

**Features**:
- Customer form fields
- Loyalty level selection
- Validation

---

### 8. Report Components

#### `EnhancedReportDashboard`
**Location**: `src/components/reports/EnhancedReportDashboard.tsx`

Enhanced sales report.

**Features**:
- Revenue analytics
- Top products
- Customer segmentation
- Revenue trends
- Growth metrics

---

#### `FinancialReportDashboard`
**Location**: `src/components/reports/FinancialReportDashboard.tsx`

Financial report (laba/rugi).

**Features**:
- Net revenue
- Gross profit
- Operating expenses
- Net profit
- Revenue vs expenses chart
- Cash flow analysis

---

#### `AdvancedReportDashboard`
**Location**: `src/components/reports/AdvancedReportDashboard.tsx`

Advanced business intelligence report.

**Features**:
- KPI metrics
- Financial health
- Revenue analytics
- Product analytics
- Customer analytics
- Trend analysis

---

### 9. Settings Components

#### `SettingsPage`
**Location**: `src/pages/SettingsPage.tsx`

Main settings page dengan tabs.

**Tabs**:
- General Settings
- Receipt Settings
- Printer Settings
- Company Settings
- Loyalty Settings
- Refund Settings
- Backup & System

---

#### `ReceiptSettings`
**Location**: `src/components/settings/ReceiptSettings.tsx`

Receipt template settings.

**Features**:
- Template selection
- Company information
- Receipt fields configuration

---

#### `PrinterSettings`
**Location**: `src/components/settings/PrinterSettings.tsx`

Printer configuration.

**Features**:
- Printer selection
- Printer test
- Print settings

---

#### `CompanyOutletSettings`
**Location**: `src/components/settings/CompanyOutletSettings.tsx`

Company & outlet information.

**Features**:
- Company information
- Outlet information
- Logo upload

---

### 10. Stock Components

#### `StockList`
**Location**: `src/components/stocks/StockList.tsx`

Stock management list.

**Features**:
- Stock table per outlet
- Low stock alerts
- Stock adjustments
- Stock movements

---

#### `StockAdjustmentModal`
**Location**: `src/components/stocks/StockAdjustmentModal.tsx`

Stock adjustment form.

**Features**:
- Quantity adjustment
- Adjustment type
- Notes

---

#### `StockMovementList`
**Location**: `src/components/stocks/StockMovementList.tsx`

Stock movement history.

**Features**:
- Movement history table
- Filter by type
- Filter by date
- Movement details

---

### 11. Purchase Components

#### `PurchaseList`
**Location**: `src/components/purchases/PurchaseList.tsx`

Purchase order list.

**Features**:
- Purchase table
- Status filter
- Supplier filter
- Date filter

---

#### `PurchaseForm`
**Location**: `src/components/purchases/PurchaseForm.tsx`

Purchase order form.

**Features**:
- Supplier selection
- Product selection
- Quantity & price
- Purchase items management

---

### 12. Expense Components

#### `ExpenseList`
**Location**: `src/components/expenses/ExpenseList.tsx`

Expense management list.

**Features**:
- Expense table
- Category filter
- Date filter
- CRUD operations

---

#### `ExpenseForm`
**Location**: `src/components/expenses/ExpenseForm.tsx`

Expense form (create/edit).

**Features**:
- Expense form fields
- Category selection
- Date picker
- Validation

---

### 13. User Management Components

#### `UserList`
**Location**: `src/components/users/UserList.tsx`

User management list.

**Features**:
- User table
- Role filter
- Outlet filter
- CRUD operations

---

#### `UserForm`
**Location**: `src/components/users/UserForm.tsx`

User form (create/edit).

**Features**:
- User form fields
- Role selection
- Outlet assignment
- Password setting

---

#### `RolePermissionPage`
**Location**: `src/pages/RolePermissionPage.tsx`

Role & permission management.

**Features**:
- Role list
- Permission assignment
- Role creation/edit

---

#### `PermissionEditor`
**Location**: `src/components/users/PermissionEditor.tsx`

Permission editor modal.

**Features**:
- Permission checkboxes
- Category grouping
- Role selection

---

### 14. Audit Components

#### `AuditLogList`
**Location**: `src/components/audit/AuditLogList.tsx`

Audit log viewer.

**Features**:
- Audit log table
- Filter by user, model, event
- Date range filter
- IP address search
- Statistics cards
- Log details modal

---

### 15. Common Components

#### `ErrorBoundary`
**Location**: `src/components/ErrorBoundary.tsx`

Error boundary untuk error handling.

**Features**:
- Catch React errors
- Display error UI
- Error logging

---

#### `ErrorFallback`
**Location**: `src/components/ErrorFallback.tsx`

Error fallback UI.

---

#### `LazyWrapper`
**Location**: `src/components/LazyWrapper.tsx`

Wrapper untuk lazy-loaded components dengan Suspense.

---

## 📝 Component Patterns

### Form Pattern

```typescript
const MyForm: React.FC<MyFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### List Pattern

```typescript
const MyList: React.FC = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    const response = await apiService.getItems({ search });
    if (response.success) {
      setItems(response.data);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Search & filters */}
      {/* Table/list */}
    </div>
  );
};
```

---

**Last Updated**: January 2025

