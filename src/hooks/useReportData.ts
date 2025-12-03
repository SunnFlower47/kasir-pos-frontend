import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

export interface ReportStats {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  totalProducts: number;
  avgTransactionValue: number;
  growth: number;
}

export interface TopProduct {
  id: number;
  name: string;
  total_sold: number;
  total_revenue: number;
  category_name: string;
  // For profit reports
  total_cost?: number;
  profit_amount?: number;
  // For stock reports
  product_name?: string;
  sku?: string;
  outlet_name?: string;
  quantity?: number;
  min_stock?: number;
  purchase_price?: number;
  selling_price?: number;
  stock_value?: number;
  is_low_stock?: number;
  // For purchase reports
  supplier_name?: string;
  purchase_quantity?: number;
  purchase_cost?: number;
  total_amount?: number;
  stock_quantity?: number;
  avg_unit_price?: number;
}

export interface ChartData {
  date: string;
  fullDate: string;
  revenue: number;
  transactions: number;
  label?: string;
}

export interface Outlet {
  id: number;
  name: string;
  code: string;
}

export interface ReportFilters {
  dateRange: string;
  selectedOutlet: number | null;
  reportType: string;
  customDateFrom: string;
  customDateTo: string;
  transactionStatus: string;
  paymentMethod: string;
  supplierId: number | null;
}

export interface UseReportDataReturn {
  // Data
  loading: boolean;
  stats: ReportStats | null;
  topProducts: TopProduct[];
  chartData: ChartData[];
  outlets: Outlet[];
  suppliers: any[];

  // Filters
  filters: ReportFilters;
  setFilters: (filters: Partial<ReportFilters>) => void;

  // Actions
  fetchReportData: () => Promise<void>;
  refreshData: () => void;
}

const initialFilters: ReportFilters = {
  dateRange: 'all', // Changed to 'all' to show all data without date filter
  selectedOutlet: null,
  reportType: 'sales',
  customDateFrom: '',
  customDateTo: '',
  transactionStatus: '',
  paymentMethod: '',
  supplierId: null
};

const initialStats: ReportStats = {
  totalRevenue: 0,
  totalTransactions: 0,
  totalCustomers: 0,
  totalProducts: 0,
  avgTransactionValue: 0,
  growth: 0,
};

export const useReportData = (): UseReportDataReturn => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filters, setFiltersState] = useState<ReportFilters>(initialFilters);

  // Calculate date range based on filter
  const calculateDateRange = useCallback((dateRange: string, customDateFrom: string, customDateTo: string) => {
    const today = new Date();
    let dateFrom: string;
    let dateTo: string;

    switch (dateRange) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        dateFrom = weekAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = monthStart.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        dateFrom = yearStart.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'all':
        // No date filter - show all data
        dateFrom = '';
        dateTo = '';
        break;
      case 'custom':
        dateFrom = customDateFrom || today.toISOString().split('T')[0];
        dateTo = customDateTo || today.toISOString().split('T')[0];
        break;
      default:
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
    }

    return { dateFrom, dateTo };
  }, []);

  // Build API parameters
  const buildApiParams = useCallback((filters: ReportFilters) => {
    const { dateFrom, dateTo } = calculateDateRange(
      filters.dateRange,
      filters.customDateFrom,
      filters.customDateTo
    );

    const params: any = {
      outlet_id: filters.selectedOutlet || undefined,
      status: filters.transactionStatus || undefined,
      payment_method: filters.paymentMethod || undefined,
      supplier_id: filters.supplierId || undefined,
      group_by: 'day'
    };

    // Add date filters based on dateRange
    if (filters.dateRange === 'all') {
      // Send special parameter to indicate "all data"
      params.show_all_data = true;
    } else if (dateFrom && dateTo) {
      params.date_from = dateFrom;
      params.date_to = dateTo;
    }

    return params;
  }, [calculateDateRange]);

  // Process stats data based on report type
  const processStatsData = useCallback((responseData: any, reportType: string, dashboardData?: any): ReportStats => {
    // All reports now have consistent summary structure
    const summary = responseData?.summary;

    if (!summary) {
      return initialStats;
    }

    switch (reportType) {
      case 'sales':
        return {
          totalRevenue: summary.total_revenue || 0,
          totalTransactions: summary.total_transactions || 0,
          totalCustomers: summary.customers_with_transactions || 0,
          totalProducts: summary.total_products || 0,
          avgTransactionValue: summary.avg_transaction_value || 0,
          growth: summary.growth || 0,
        };

      case 'purchases':
        return {
          totalRevenue: summary.total_amount || 0,
          totalTransactions: summary.total_purchases || 0,
          totalCustomers: summary.total_suppliers || 0,
          totalProducts: summary.total_items || 0,
          avgTransactionValue: summary.avg_purchase_value || 0,
          growth: 0,
        };

      case 'expenses':
        return {
          totalRevenue: summary.total_amount || 0, // Total expenses
          totalTransactions: summary.total_purchases || 0,
          totalCustomers: summary.total_suppliers || 0, // Number of suppliers
          totalProducts: summary.total_items || 0,
          avgTransactionValue: summary.avg_purchase_value || 0,
          growth: summary.payment_completion_rate || 0, // Payment completion rate
        };

      case 'stocks':
        return {
          totalRevenue: summary.total_stock_value || 0,
          totalTransactions: summary.total_products || 0,
          totalCustomers: summary.low_stock_products || 0,
          totalProducts: summary.total_products || 0,
          avgTransactionValue: summary.out_of_stock_products || 0,
          growth: 0,
        };

      case 'profit':
        return {
          totalRevenue: summary.total_revenue || 0,
          totalTransactions: summary.total_transactions || 0,
          totalCustomers: summary.total_purchases || 0, // Number of purchases
          totalProducts: summary.total_items_sold || 0,
          avgTransactionValue: summary.net_profit || 0, // Net profit as avg value
          growth: summary.profit_margin || 0,
        };

      default:
        return {
          totalRevenue: summary.total_revenue || 0,
          totalTransactions: summary.total_transactions || 0,
          totalCustomers: summary.unique_customers || 0,
          totalProducts: summary.products_sold || 0,
          avgTransactionValue: summary.avg_transaction_value || 0,
          growth: 0,
        };
    }
  }, []);

  // Process chart data
  const processChartData = useCallback((responseData: any, reportType: string): ChartData[] => {
    console.log('🔍 processChartData input:', { responseData, reportType });

    if (reportType === 'stocks') {
      // For stocks, use grouped_data for daily chart or fallback to stocks array
      if (responseData.grouped_data && Array.isArray(responseData.grouped_data)) {
        return responseData.grouped_data.map((item: any) => ({
          date: item.date || item.period || 'Data',
          fullDate: item.period || item.date || new Date().toISOString().split('T')[0],
          revenue: item.net_movement || item.stock_in || item.stock_out || 0,
          transactions: item.movements_count || 0,
          label: 'Stock Movement'
        }));
      } else if (responseData.stocks && Array.isArray(responseData.stocks)) {
        // Group by category or outlet for chart
        const stocksByCategory = responseData.stocks.reduce((acc: any, stock: any) => {
          const key = stock.category_name || 'Unknown';
          if (!acc[key]) {
            acc[key] = { total_value: 0, total_quantity: 0 };
          }
          acc[key].total_value += stock.stock_value || 0;
          acc[key].total_quantity += stock.quantity || 0;
          return acc;
        }, {});

        return Object.entries(stocksByCategory).map(([category, data]: [string, any]) => ({
          date: category,
          fullDate: new Date().toISOString().split('T')[0],
          revenue: data.total_value,
          transactions: data.total_quantity,
          label: 'Nilai Stok'
        }));
      } else if (responseData.summary) {
        return [{
          date: 'Total Stok',
          fullDate: new Date().toISOString().split('T')[0],
          revenue: responseData.summary.total_stock_value || 0,
          transactions: responseData.summary.total_products || 0,
          label: 'Nilai Stok'
        }];
      }
      return [];
    }

    // Handle different response structures
    let chartDataSource;
    if (reportType === 'expenses' && responseData.monthly_breakdown) {
      chartDataSource = responseData.monthly_breakdown;
    } else if (reportType === 'purchases') {
      // For purchases, try multiple sources and create chart data from available data
      if (responseData.monthly_breakdown && Array.isArray(responseData.monthly_breakdown)) {
        chartDataSource = responseData.monthly_breakdown;
      } else if (responseData.grouped_data && Array.isArray(responseData.grouped_data)) {
        chartDataSource = responseData.grouped_data;
      } else if (responseData.top_suppliers && Array.isArray(responseData.top_suppliers)) {
        // Create chart data from top suppliers
        chartDataSource = responseData.top_suppliers.map((supplier: any, index: number) => ({
          date: supplier.supplier_name || `Supplier ${index + 1}`,
          total_amount: supplier.total_amount || supplier.total_cost || 0,
          total_quantity: supplier.total_quantity || 0,
          transactions_count: 1
        }));
      } else if (responseData.summary) {
        // Create single data point from summary
        chartDataSource = [{
          date: 'Total Pembelian',
          total_amount: responseData.summary.total_purchases || responseData.summary.total_amount || 0,
          total_quantity: responseData.summary.total_items || 0,
          transactions_count: responseData.summary.total_transactions || 1
        }];
      } else {
        chartDataSource = [];
      }
    } else if (reportType === 'profit') {
      // For profit, try multiple sources
      if (responseData.grouped_data && Array.isArray(responseData.grouped_data)) {
        chartDataSource = responseData.grouped_data;
      } else if (responseData.daily_profit && Array.isArray(responseData.daily_profit)) {
        chartDataSource = responseData.daily_profit;
      } else if (responseData.monthly_profit && Array.isArray(responseData.monthly_profit)) {
        chartDataSource = responseData.monthly_profit;
      } else if (responseData.summary) {
        // Create single data point from summary
        chartDataSource = [{
          date: 'Total Profit',
          net_profit: responseData.summary.net_profit || responseData.summary.total_profit || 0,
          total_revenue: responseData.summary.total_revenue || 0,
          total_cost: responseData.summary.total_cost || 0,
          transactions_count: responseData.summary.total_transactions || 1
        }];
      } else {
        chartDataSource = [];
      }
    } else {
      chartDataSource = responseData.grouped_data;
    }

    if (!chartDataSource || !Array.isArray(chartDataSource)) {
      console.warn('⚠️ No chart data source found for', reportType);
      return [];
    }

    return chartDataSource.map((item: any) => {
      // Handle different date formats
      let displayDate;
      if (item.period) {
        displayDate = new Date(item.period).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit'
        });
      } else if (item.month) {
        displayDate = item.month; // For monthly breakdown like "2025-07"
      } else {
        displayDate = 'Data';
      }

      let value = 0;
      let transactionCount = 0;
      let label = '';

      switch (reportType) {
        case 'sales':
          value = Number(item.total_revenue) || 0;
          transactionCount = Number(item.transactions_count) || 0;
          label = 'Revenue';
          break;
        case 'purchases':
          value = Number(item.total_amount) || Number(item.total_cost) || Number(item.total_paid) || 0;
          transactionCount = Number(item.transactions_count) || Number(item.purchase_count) || Number(item.total_purchases) || 0;
          label = 'Purchase Cost';
          break;
        case 'expenses':
          value = Number(item.total_amount) || Number(item.total_paid) || 0;
          transactionCount = Number(item.purchase_count) || Number(item.transactions_count) || 0;
          label = 'Expenses';
          break;
        case 'profit':
          value = Number(item.net_profit) || Number(item.total_profit) || (Number(item.total_revenue) - Number(item.total_cogs)) || 0;
          transactionCount = Number(item.transactions_count) || Number(item.total_transactions) || 0;
          label = 'Profit';
          break;
        default:
          value = Number(item.total_revenue) || 0;
          transactionCount = Number(item.transactions_count) || 0;
          label = 'Revenue';
      }

      return {
        date: displayDate,
        fullDate: item.period || item.month || new Date().toISOString().split('T')[0],
        revenue: value,
        amount: value, // For purchases chart
        transactions: transactionCount,
        label: label
      };
    });
  }, []);

  // Process top products data - All reports now have consistent top_products structure
  const processTopProductsData = useCallback((responseData: any, reportType: string): TopProduct[] => {
    // Handle different data sources for different report types
    let topProducts;

    if (reportType === 'stocks') {
      // For stocks, use stocks array from API
      topProducts = responseData?.stocks || responseData?.data || [];
    } else if (reportType === 'purchases') {
      // For purchases, use multiple sources
      topProducts = responseData?.top_items || responseData?.top_products || responseData?.top_suppliers || [];

      // If no top data, create from summary
      if (!topProducts || topProducts.length === 0) {
        if (responseData?.summary && responseData.summary.total_purchases > 0) {
          topProducts = [{
            id: 1,
            name: 'Total Pembelian',
            total_amount: responseData.summary.total_purchases || responseData.summary.total_amount || 0,
            total_quantity: responseData.summary.total_items || 0,
            supplier_name: 'Semua Supplier'
          }];
        }
      }
    } else {
      // For sales and profit, use top_products
      topProducts = responseData?.top_products || [];

      // If no top products, create from summary for profit
      if (reportType === 'profit' && (!topProducts || topProducts.length === 0)) {
        if (responseData?.summary && responseData.summary.net_profit > 0) {
          topProducts = [{
            id: 1,
            name: 'Total Profit',
            profit_amount: responseData.summary.net_profit || 0,
            total_revenue: responseData.summary.total_revenue || 0,
            total_cost: responseData.summary.total_cost || 0
          }];
        }
      }
    }

    if (!Array.isArray(topProducts)) {
      console.warn('⚠️ Top products is not an array:', topProducts);
      return [];
    }

    return topProducts.slice(0, 5).map((item: any, index: number) => {
      // Base mapping
      const baseData = {
        id: item.id || `item-${index}`,
        name: item.name || item.product_name || item.supplier_name || 'Unknown Item',
        category_name: item.category_name || 'Unknown Category',
        sku: item.sku || '',
      };

      // Report-specific mapping
      if (reportType === 'purchases') {
        return {
          ...baseData,
          total_sold: item.total_quantity || item.purchase_quantity || 0,
          total_revenue: item.total_amount || item.total_cost || item.purchase_cost || 0,
          purchase_quantity: item.total_quantity || item.purchase_quantity || 0,
          purchase_cost: item.total_amount || item.total_cost || item.purchase_cost || 0,
          avg_unit_price: item.avg_unit_price || 0,
          supplier_name: item.supplier_name || '',
          stock_value: item.total_amount || item.total_cost || 0
        };
      } else if (reportType === 'stocks') {
        return {
          ...baseData,
          total_sold: item.movement_count || item.net_movement || item.quantity || 0,
          total_revenue: item.stock_value || item.net_movement || (item.quantity * item.selling_price) || 0,
          stock_value: item.stock_value || item.net_movement || 0,
          quantity: item.quantity || item.stock_quantity || 0,
          selling_price: item.selling_price || 0,
          purchase_price: item.purchase_price || 0,
          outlet_name: item.outlet_name || '',
          is_low_stock: item.is_low_stock || 0,
          min_stock: item.min_stock || 0,
          // Stock movement specific fields
          stock_in: item.stock_in || 0,
          stock_out: item.stock_out || 0,
          net_movement: item.net_movement || 0,
          movement_count: item.movement_count || 0
        };
      } else if (reportType === 'profit') {
        return {
          ...baseData,
          total_sold: item.total_sold || item.total_quantity || 0,
          total_revenue: item.total_revenue || 0,
          total_cost: item.total_cost || 0,
          profit_amount: item.profit_amount || item.total_profit || item.net_profit || (item.total_revenue - item.total_cost) || 0
        };
      } else {
        // Default for sales
        return {
          ...baseData,
          total_sold: item.total_sold || item.total_quantity || 0,
          total_revenue: item.total_revenue || item.total_amount || 0,
          purchase_quantity: item.total_sold || item.total_quantity || 0,
          purchase_cost: item.total_revenue || item.total_cost || 0
        };
      }
    });
  }, []);

  // Main fetch function
  const fetchReportData = useCallback(async () => {
    setLoading(true);

    // Clear previous data
    setStats(initialStats);
    setChartData([]);
    setTopProducts([]);

    try {
      const params = buildApiParams(filters);

      // Add delay to prevent rate limiting
      await delay(100);

      // Fetch data based on report type
      let reportResponse, dashboardResponse, outletsResponse;

      const [reportRes, dashboardRes, outletsRes, suppliersRes] = await Promise.all([
        filters.reportType === 'sales' ? apiService.getSalesReport(params) :
        filters.reportType === 'purchases' ? apiService.getPurchasesReport(params) :
        filters.reportType === 'expenses' ? apiService.getExpensesReport(params) :
        filters.reportType === 'stocks' ? apiService.getStocksReport({ outlet_id: filters.selectedOutlet || undefined }) :
        filters.reportType === 'profit' ? apiService.getProfitReport(params) :
        apiService.getSalesReport(params),
        apiService.getDashboard(),
        apiService.getOutlets(),
        apiService.getSuppliers()
      ]);

      reportResponse = reportRes;
      dashboardResponse = dashboardRes;
      outletsResponse = outletsRes;

      // Set suppliers
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data.data || suppliersRes.data);
      }

      // Process data
      if (reportResponse.success && reportResponse.data) {
        console.log('🔍 Raw Report Response:', reportResponse.data);
        // Process stats
        const processedStats = processStatsData(reportResponse.data, filters.reportType, dashboardResponse.data);
        setStats(processedStats);

        // Process chart data
        const processedChartData = processChartData(reportResponse.data, filters.reportType);
        setChartData(processedChartData);

        // Process top products for sales report
        if (filters.reportType === 'sales') {
          const topProductsRes = await apiService.getTopProducts({ ...params, limit: 5 });
          if (topProductsRes.success && topProductsRes.data) {
            const processedTopProducts = processTopProductsData(topProductsRes.data, filters.reportType);
            setTopProducts(processedTopProducts);
          }
        } else {
          const processedTopProducts = processTopProductsData(reportResponse.data, filters.reportType);
          setTopProducts(processedTopProducts);
        }
      }

      // Process outlets
      if (outletsResponse.success && outletsResponse.data) {
        const outletsData = outletsResponse.data.data || outletsResponse.data;
        setOutlets(Array.isArray(outletsData) ? outletsData : []);
      }

      
    } catch (error: any) {
      console.error('❌ Error fetching report data:', error);
      const message = error.response?.data?.message || error.message || 'Gagal memuat data laporan';
      toast.error(message);
      setStats(null);
      setTopProducts([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, buildApiParams, processStatsData, processChartData, processTopProductsData]);

  // Add delay to prevent rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fetch data for specific report type (for immediate refresh)
  const fetchDataForReportType = useCallback(async (updatedFilters: ReportFilters, params: any) => {
    try {
      console.log(`🔄 Fetching ${updatedFilters.reportType} report data immediately...`);

      // Add small delay to prevent rate limiting (30 requests/minute = 2 seconds between requests)
      await delay(100);

      // Fetch data based on report type
      const [reportRes, , outletsRes] = await Promise.all([
        updatedFilters.reportType === 'sales' ? apiService.getSalesReport(params) :
        updatedFilters.reportType === 'purchases' ? apiService.getPurchasesReport(params) :
        updatedFilters.reportType === 'expenses' ? apiService.getExpensesReport(params) :
        updatedFilters.reportType === 'stocks' ? apiService.getStocksReport({ outlet_id: updatedFilters.selectedOutlet || undefined }) :
        updatedFilters.reportType === 'profit' ? apiService.getProfitReport(params) :
        apiService.getSalesReport(params),
        apiService.getDashboard(),
        apiService.getOutlets()
      ]);

      // Process and set data
      if (reportRes.success && reportRes.data) {
        const processedStats = processStatsData(reportRes.data, updatedFilters.reportType);
        setStats(processedStats);

        const processedChartData = processChartData(reportRes.data, updatedFilters.reportType);
        setChartData(processedChartData);

        const processedTopProducts = processTopProductsData(reportRes.data, updatedFilters.reportType);
        setTopProducts(processedTopProducts);
      }

      // Process outlets
      if (outletsRes.success && outletsRes.data) {
        const outletsData = outletsRes.data.data || outletsRes.data;
        setOutlets(Array.isArray(outletsData) ? outletsData : []);
      }

    } catch (error: any) {
      console.error('❌ Error fetching report data:', error);
      setStats(null);
      setTopProducts([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [processStatsData, processChartData, processTopProductsData]);

  // Set filters with automatic data refresh
  const setFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    console.log('🔄 Setting new filters:', newFilters);

    // Update filters state
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      console.log('🔄 Updated filters state:', updated);

      // If report type changed, immediately clear data and fetch new data
      if (newFilters.reportType && newFilters.reportType !== prev.reportType) {
        console.log('🔄 Report type changed, clearing data immediately');
        setLoading(true);
        setStats(null);
        setTopProducts([]);
        setChartData([]);

        // Fetch new data with updated filters
        setTimeout(() => {
          const params = buildApiParams(updated);

          // Call API directly with new filters
          fetchDataForReportType(updated, params);
        }, 50);
      }

      return updated;
    });
  }, [buildApiParams, fetchDataForReportType]);

  // Refresh data manually
  const refreshData = useCallback(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Auto-fetch when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, fetching data:', filters);
    fetchReportData();
  }, [filters, fetchReportData]);

  return {
    // Data
    loading,
    stats,
    topProducts,
    chartData,
    outlets,
    suppliers,

    // Filters
    filters,
    setFilters,

    // Actions
    fetchReportData,
    refreshData
  };
};
