// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  outlet_id?: number;
  outlet?: Outlet;
  role: string; // Single role as string (Super Admin, Admin, Manager, Cashier, Warehouse)
  roles?: Role[]; // Optional for backward compatibility
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}

// Outlet types
export interface Outlet {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  description?: string;
  category_id: number;
  category?: Category;
  unit_id: number;
  unit?: Unit;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  min_stock: number;
  is_active: boolean;
  image?: string | null;
  stock_quantity?: number; // Added for POS stock display
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  products_count?: number; // Added for display
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  description?: string; // Added for form
  products_count?: number; // Added for display
}

// Customer types (updated)
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  level: 'level1' | 'level2' | 'level3' | 'level4' | 'bronze' | 'silver' | 'gold' | 'platinum'; // Support both new and old format for backward compatibility
  loyalty_points?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Supplier types
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Outlet types
export interface Outlet {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main?: boolean;
  created_at: string;
  updated_at: string;
}

// Transaction types
export interface Transaction {
  id: number;
  transaction_number: string;
  outlet_id: number;
  customer_id?: number;
  customer?: Customer;
  user_id: number;
  transaction_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'ewallet';
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}



// Unit interface moved above to avoid duplication

export interface ProductStock {
  id: number;
  product_id: number;
  product?: Product;
  outlet_id: number;
  outlet?: Outlet;
  quantity: number;
}



// Transaction types
export interface Transaction {
  id: number;
  transaction_number: string;
  outlet_id: number;
  outlet?: Outlet;
  customer_id?: number;
  customer?: Customer;
  user_id: number;
  user?: User;
  transaction_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'ewallet';
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  transaction_items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  purchase_price?: number; // Snapshot of purchase price at transaction time
  total_price: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Dashboard types
export interface DashboardStats {
  total_outlets: number;
  total_products: number;
  total_customers: number;
  total_suppliers: number;
  total_users: number;
  access_scope: 'global' | 'outlet';
  filtered_outlet_id?: number | null;
}

export interface TransactionStats {
  transactions_today: number;
  revenue_today: number;
  refunds_today?: number;
  net_revenue_today?: number;
  transactions_this_month: number;
  revenue_this_month: number;
  refunds_this_month?: number;
  net_revenue_this_month?: number;
  revenue_last_month: number;
  refunds_last_month?: number;
  net_revenue_last_month?: number;
}

export interface StockStats {
  low_stock_products: number;
  out_of_stock_products: number;
  total_stock_value: number;
}

export interface StockAlerts {
  low_stock_count: number;
  out_of_stock_count: number;
  total_alerts: number;
}

export interface DashboardData {
  stats: DashboardStats;
  transaction_stats: TransactionStats;
  stock_stats: StockStats;
  revenue_growth: number;
  recent_transactions: Transaction[];
  top_products: any[];
  low_stock_products: ProductStock[];
  out_of_stock_products: ProductStock[];
  sales_chart_data: any[];
  user_outlet?: Outlet;
  available_outlets?: Outlet[];
  stock_alerts: StockAlerts;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface ProductForm {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id: number;
  unit_id: number;
  purchase_price: number;
  selling_price: number;
  min_stock: number;
  is_active: boolean;
}

export interface TransactionForm {
  outlet_id: number;
  customer_id?: number;
  paid_amount: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'e_wallet';
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
}

// Export electron types
export * from './electron';
