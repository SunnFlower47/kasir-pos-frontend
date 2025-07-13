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
}

export interface UseReportDataReturn {
  // Data
  loading: boolean;
  stats: ReportStats | null;
  topProducts: TopProduct[];
  chartData: ChartData[];
  outlets: Outlet[];

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
  paymentMethod: ''
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
      group_by: 'day'
    };

    // Only add date filters if they are not empty
    if (dateFrom && dateTo) {
      params.date_from = dateFrom;
      params.date_to = dateTo;
    }

    return params;
  }, [calculateDateRange]);

  // Process stats data based on report type
  const processStatsData = useCallback((responseData: any, reportType: string, dashboardData?: any): ReportStats => {
    console.log('🔍 processStatsData input:', { responseData, reportType });

    // Handle different response structures
    let summary;
    if (reportType === 'profit') {
      // Profit response has data directly, not in summary
      summary = responseData;
    } else {
      // Other reports have summary object
      summary = responseData?.summary;
    }

    if (!summary) {
      console.warn('⚠️ No summary data found for', reportType);
      return initialStats;
    }

    console.log('🔍 Summary data:', summary);

    switch (reportType) {
      case 'sales':
        return {
          totalRevenue: summary.total_revenue || 0,
          totalTransactions: summary.total_transactions || 0,
          totalCustomers: summary.unique_customers || 0,
          totalProducts: summary.products_sold || 0,
          avgTransactionValue: summary.avg_transaction_value || 0,
          growth: 0,
        };

      case 'purchases':
        return {
          totalRevenue: summary.total_amount || 0,
          totalTransactions: summary.total_purchases || 0,
          totalCustomers: summary.total_suppliers || 0, // Use suppliers count
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
      // For stocks, create a single summary point
      if (responseData.summary) {
        return [{
          date: 'Saat Ini',
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
    } else if (reportType === 'profit') {
      // For profit, create single data point from summary
      const summary = responseData;
      return [{
        date: 'Total',
        fullDate: new Date().toISOString().split('T')[0],
        revenue: summary.net_profit || 0,
        transactions: summary.total_transactions || 0,
        label: 'Profit'
      }];
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
          value = Number(item.total_amount) || 0;
          transactionCount = Number(item.total_purchases) || 0;
          label = 'Purchase Cost';
          break;
        case 'expenses':
          value = Number(item.total_amount) || 0;
          transactionCount = Number(item.purchase_count) || 0;
          label = 'Expenses';
          break;
        case 'profit':
          value = Number(item.total_profit) || 0;
          transactionCount = Number(item.transactions_count) || 0;
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

  // Process top products data
  const processTopProductsData = useCallback((responseData: any, reportType: string): TopProduct[] => {
    switch (reportType) {
      case 'sales':
        if (Array.isArray(responseData)) {
          return responseData.slice(0, 5).map((item: any) => ({
            id: item.id || Math.random(),
            name: item.name || item.product_name || 'Unknown Product',
            total_sold: item.total_sold || item.quantity_sold || 0,
            total_revenue: item.total_revenue || item.revenue || 0,
            category_name: item.category_name || item.category || 'Unknown'
          }));
        }
        break;

      case 'purchases':
        if (responseData.top_items && Array.isArray(responseData.top_items)) {
          return responseData.top_items.slice(0, 5).map((item: any) => ({
            id: item.id || Math.random(),
            name: item.name || 'Unknown Product',
            total_sold: item.total_quantity || 0,
            total_revenue: item.total_cost || 0,
            total_amount: item.total_cost || 0,
            category_name: 'Product',
            sku: item.sku || '',
            purchase_quantity: item.total_quantity || 0,
            purchase_cost: item.total_cost || 0,
            avg_unit_price: item.avg_unit_price || 0
          }));
        }
        break;

      case 'expenses':
        if (responseData.top_items && Array.isArray(responseData.top_items)) {
          return responseData.top_items.slice(0, 5).map((item: any) => ({
            id: item.id || Math.random(),
            name: item.product_name || item.name || 'Unknown Product',
            total_sold: item.total_quantity || 0,
            total_revenue: item.total_cost || 0,
            category_name: 'Expense Item',
            sku: item.sku || '',
            purchase_quantity: item.total_quantity || 0,
            purchase_cost: item.total_cost || 0,
            supplier_name: item.supplier_name || 'Unknown Supplier',
          }));
        }
        break;

      case 'stocks':
        if (responseData.stocks) {
          const stocksData = responseData.stocks.data || responseData.stocks;
          if (Array.isArray(stocksData)) {
            return stocksData.slice(0, 5).map((stock: any, index: number) => ({
              id: stock.id || `stock-${index}`,
              name: stock.product_name || 'Unknown Product',
              total_sold: stock.quantity || 0,
              total_revenue: stock.stock_value || 0,
              category_name: stock.category_name || 'Unknown',
              quantity: stock.quantity || 0,
              min_stock: stock.min_stock || 0,
              is_low_stock: stock.is_low_stock || 0
            }));
          }
        }
        break;

      case 'profit':
        if (Array.isArray(responseData)) {
          return responseData.slice(0, 5).map((item: any) => ({
            id: item.id || Math.random(),
            name: item.name || item.product_name || 'Unknown Product',
            total_sold: item.total_sold || 0,
            total_revenue: item.total_revenue || 0,
            category_name: item.category_name || 'Unknown',
            total_cost: item.total_cost || 0,
            profit_amount: item.profit_amount || 0
          }));
        }
        break;
    }

    return [];
  }, []);

  // Main fetch function
  const fetchReportData = useCallback(async () => {
    setLoading(true);

    // Clear previous data
    setStats(initialStats);
    setChartData([]);
    setTopProducts([]);

    try {
      console.log(`🔄 Fetching ${filters.reportType} report data...`);
      console.log('🔍 Current filters:', filters);

      const params = buildApiParams(filters);
      console.log('📊 API Parameters:', params);
      console.log('📊 Date range calculation:', {
        dateRange: filters.dateRange,
        customDateFrom: filters.customDateFrom,
        customDateTo: filters.customDateTo
      });

      // Fetch data based on report type
      let reportResponse, dashboardResponse, outletsResponse;

      const [reportRes, dashboardRes, outletsRes] = await Promise.all([
        filters.reportType === 'sales' ? apiService.getSalesReport(params) :
        filters.reportType === 'purchases' ? apiService.getPurchasesReport(params) :
        filters.reportType === 'expenses' ? apiService.getExpensesReport(params) :
        filters.reportType === 'stocks' ? apiService.getStocksReport({ outlet_id: filters.selectedOutlet || undefined }) :
        filters.reportType === 'profit' ? apiService.getProfitReport(params) :
        apiService.getSalesReport(params),
        apiService.getDashboard(),
        apiService.getOutlets()
      ]);

      reportResponse = reportRes;
      dashboardResponse = dashboardRes;
      outletsResponse = outletsRes;

      // Process data
      if (reportResponse.success && reportResponse.data) {
        console.log('🔍 Raw Report Response:', reportResponse.data);
        console.log('🔍 Report Type:', filters.reportType);

        // Process stats
        const processedStats = processStatsData(reportResponse.data, filters.reportType, dashboardResponse.data);
        setStats(processedStats);
        console.log('📊 Processed Stats:', processedStats);

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

      toast.success('Data laporan berhasil dimuat');
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
  }, [buildApiParams, processStatsData, processChartData, processTopProductsData]);

  // Fetch data for specific report type (for immediate refresh)
  const fetchDataForReportType = useCallback(async (updatedFilters: ReportFilters, params: any) => {
    try {
      console.log(`🔄 Fetching ${updatedFilters.reportType} report data immediately...`);

      // Fetch data based on report type
      const [reportRes, dashboardRes, outletsRes] = await Promise.all([
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

      console.log('✅ Data fetched successfully for report type:', updatedFilters.reportType);
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
          console.log('📊 Fetching data with new report type:', updated.reportType);

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
  }, [filters.reportType, filters.dateRange, filters.customDateFrom, filters.customDateTo, filters.selectedOutlet, fetchReportData]);

  return {
    // Data
    loading,
    stats,
    topProducts,
    chartData,
    outlets,

    // Filters
    filters,
    setFilters,

    // Actions
    fetchReportData,
    refreshData
  };
};
