import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        let token = localStorage.getItem('auth_token');

        // For development, use default token if none exists
        if (!token && process.env.NODE_ENV === 'development') {
          token = '61|lVwCOb4dB0hOqJJFCR1YwXybeFwZT26kQ72Tzh1819df0dd3';
          localStorage.setItem('auth_token', token);
        }

        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 API Request:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            hasToken: !!token
          });
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ API Response:', {
            url: response.config.url,
            status: response.status,
            success: response.data?.success
          });
        }
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        const url = error.config?.url;

        console.error('❌ API Error:', {
          url,
          status,
          statusText: error.response?.statusText,
          message,
          data: error.response?.data
        });

        // Handle different error types
        if (status === 401) {
          console.warn('🔐 Unauthorized - clearing auth and redirecting');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Use setTimeout to avoid navigation during API call
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } else if (status === 403) {
          console.warn('🚫 Forbidden - insufficient permissions');
          // Don't redirect, let component handle this
        } else if (status === 422) {
          console.warn('📝 Validation Error:', error.response?.data?.errors);
        } else if (status >= 500) {
          console.error('🔥 Server Error:', message);
        } else if (!status) {
          console.error('🌐 Network Error - no response from server');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods with enhanced error handling
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(url, { params });

      // Ensure we always return a consistent format
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return {
          success: response.data.success ?? true,
          data: response.data.data ?? response.data,
          message: response.data.message ?? 'Success'
        };
      }

      return {
        success: true,
        data: response.data as T,
        message: 'Success'
      };
    } catch (error: any) {
      // Return consistent error format instead of throwing
      return {
        success: false,
        data: null as T,
        message: error.response?.data?.message || error.message || 'Request failed'
      };
    }
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(url, data);

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return {
          success: response.data.success ?? true,
          data: response.data.data ?? response.data,
          message: response.data.message ?? 'Success'
        };
      }

      return {
        success: true,
        data: response.data as T,
        message: 'Success'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as T,
        message: error.response?.data?.message || error.message || 'Request failed'
      };
    }
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(url, data);

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return {
          success: response.data.success ?? true,
          data: response.data.data ?? response.data,
          message: response.data.message ?? 'Success'
        };
      }

      return {
        success: true,
        data: response.data as T,
        message: 'Success'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as T,
        message: error.response?.data?.message || error.message || 'Request failed'
      };
    }
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<any> = await this.api.patch(url, data);

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return {
          success: response.data.success ?? true,
          data: response.data.data ?? response.data,
          message: response.data.message ?? 'Success'
        };
      }

      return {
        success: true,
        data: response.data as T,
        message: 'Success'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as T,
        message: error.response?.data?.message || error.message || 'Request failed'
      };
    }
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(url);

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return {
          success: response.data.success ?? true,
          data: response.data.data ?? response.data,
          message: response.data.message ?? 'Success'
        };
      }

      return {
        success: true,
        data: response.data as T,
        message: 'Success'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as T,
        message: error.response?.data?.message || error.message || 'Request failed'
      };
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.post('/login', { email, password });
  }

  async logout() {
    return this.post('/logout');
  }

  async getProfile() {
    return this.get('/profile');
  }

  // Dashboard methods
  async getDashboard(params?: any) {
    return this.get('/dashboard', params);
  }

  async getOutletComparison(period?: string) {
    return this.get('/dashboard/outlet-comparison', { period });
  }

  // Product methods
  async getProducts(params?: any) {
    return this.get<PaginatedResponse>('/products', params);
  }

  async getProduct(id: number) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.post('/products', data);
  }

  async updateProduct(id: number, data: any) {
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id: number) {
    return this.delete(`/products/${id}`);
  }

  async getProductByBarcode(barcode: string) {
    return this.get('/products/barcode/scan', { barcode });
  }

  // Category and Unit methods moved to the end of the file
  // Removed duplicate methods to avoid conflicts

  // Customer methods
  async getCustomers(params?: any) {
    return this.get<PaginatedResponse>('/customers', params);
  }

  async getCustomer(id: number) {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.post('/customers', data);
  }

  async updateCustomer(id: number, data: any) {
    return this.put(`/customers/${id}`, data);
  }

  async deleteCustomer(id: number) {
    return this.delete(`/customers/${id}`);
  }

  // Transaction methods
  async getTransactions(params?: any) {
    return this.get<PaginatedResponse>('/transactions', params);
  }

  async getTransaction(id: number) {
    return this.get(`/transactions/${id}`);
  }

  async createTransaction(data: any) {
    return this.post('/transactions', data);
  }

  async refundTransaction(id: number, reason: string) {
    return this.post(`/transactions/${id}/refund`, { reason });
  }

  // Stock methods
  async getStocks(params?: any) {
    return this.get('/stocks', params);
  }

  async getStockMovements(params?: any) {
    return this.get('/stocks/movements', params);
  }

  async adjustStock(data: any) {
    return this.post('/stocks/adjust', data);
  }

  async processStockOpname(data: any) {
    return this.post('/stocks/opname', data);
  }

  async transferStock(data: any) {
    return this.post('/stocks/transfer', data);
  }

  async getLowStockAlerts(params?: any) {
    return this.get('/stocks/low-stock-alerts', params);
  }

  // Stock Transfer methods
  async getStockTransfers(params?: any) {
    return this.get('/stock-transfers', params);
  }

  async getStockTransfer(id: number) {
    return this.get(`/stock-transfers/${id}`);
  }

  async createStockTransfer(data: any) {
    return this.post('/stock-transfers', data);
  }

  async approveStockTransfer(id: number) {
    return this.post(`/stock-transfers/${id}/approve`);
  }

  async cancelStockTransfer(id: number) {
    return this.post(`/stock-transfers/${id}/cancel`);
  }

  // Outlet methods
  async getOutlets(params?: any) {
    return this.get('/outlets', params);
  }

  async getOutlet(id: number) {
    return this.get(`/outlets/${id}`);
  }

  async createOutlet(data: any) {
    return this.post('/outlets', data);
  }

  async updateOutlet(id: number, data: any) {
    return this.put(`/outlets/${id}`, data);
  }

  async deleteOutlet(id: number) {
    return this.delete(`/outlets/${id}`);
  }

  // Settings methods
  async getSettings() {
    return this.get('/settings');
  }

  async updateSettings(data: any) {
    return this.put('/settings', data);
  }

  // Supplier methods
  async getSuppliers(params?: any) {
    return this.get('/suppliers', params);
  }

  async createSupplier(data: any) {
    return this.post('/suppliers', data);
  }

  async updateSupplier(id: number, data: any) {
    return this.put(`/suppliers/${id}`, data);
  }

  async deleteSupplier(id: number) {
    return this.delete(`/suppliers/${id}`);
  }

  // Purchase methods
  async getPurchases(params?: any) {
    return this.get('/purchases', params);
  }

  async getPurchase(id: number) {
    return this.get(`/purchases/${id}`);
  }

  async createPurchase(data: any) {
    return this.post('/purchases', data);
  }

  async updatePurchase(id: number, data: any) {
    return this.put(`/purchases/${id}`, data);
  }

  async updatePurchaseStatus(id: number, data: any) {
    return this.patch(`/purchases/${id}/status`, data);
  }

  async deletePurchase(id: number) {
    return this.delete(`/purchases/${id}`);
  }

  // Report methods
  async getSalesReport(params: any) {
    return this.get('/reports/sales', params);
  }

  async getPurchasesReport(params: any) {
    return this.get('/reports/purchases', params);
  }

  async getExpensesReport(params: any) {
    console.log('🔍 API Call: getExpensesReport with params:', params);
    const response = await this.get('/reports/expenses', params);
    console.log('🔍 API Response: getExpensesReport:', response);
    return response;
  }

  async getStocksReport(params?: any) {
    return this.get('/reports/stocks', params);
  }

  async getProfitReport(params: any) {
    console.log('🔍 API Call: getProfitReport with params:', params);
    const response = await this.get('/reports/profit', params);
    console.log('🔍 API Response: getProfitReport:', response);
    return response;
  }

  async getTopProducts(params: any) {
    return this.get('/reports/top-products', params);
  }



  async getSystemInfo() {
    return this.get('/system/info');
  }

  async createBackup() {
    return this.post('/system/backup');
  }

  async getBackups() {
    return this.get('/system/backups');
  }

  // User management methods moved to end of file to avoid duplication

  async getUserById(id: number) {
    return this.get(`/users/${id}`);
  }

  async getUsers(params?: any) {
    return this.get('/users', params);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: number) {
    return this.delete(`/users/${id}`);
  }

  async getRoles() {
    return this.get('/roles');
  }

  async getUserPermissions(id: number) {
    return this.get(`/users/${id}/permissions`);
  }

  async getAllPermissions() {
    return this.get('/permissions');
  }

  async updateRolePermissions(roleId: number, data: any) {
    return this.put(`/roles/${roleId}/permissions`, data);
  }

  // Category management methods
  async getCategories(params?: any) {
    return this.get('/categories', params);
  }

  async createCategory(data: any) {
    return this.post('/categories', data);
  }

  async updateCategory(id: number, data: any) {
    return this.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: number) {
    return this.delete(`/categories/${id}`);
  }

  async getCategoryById(id: number) {
    return this.get(`/categories/${id}`);
  }

  // Unit management methods
  async getUnits(params?: any) {
    return this.get('/units', params);
  }

  async createUnit(data: any) {
    return this.post('/units', data);
  }

  async updateUnit(id: number, data: any) {
    return this.put(`/units/${id}`, data);
  }

  async deleteUnit(id: number) {
    return this.delete(`/units/${id}`);
  }

  async getUnitById(id: number) {
    return this.get(`/units/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;
