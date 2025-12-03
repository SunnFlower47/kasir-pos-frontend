import React, { useState, useEffect, useCallback } from 'react';
import { Product, Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import ProductSearch from '../common/ProductSearch';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

interface StockMovement {
  id: number;
  product_id: number;
  product: Product;
  outlet_id: number;
  outlet: Outlet;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  user_id: number;
  user: {
    id: number;
    name: string;
  };
  created_at: string;
}

const StockHistory: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Build query parameters
      const params: any = {};
      if (selectedOutlet) params.outlet_id = selectedOutlet;
      if (selectedProduct) params.product_id = selectedProduct.id;
      if (selectedType) params.type = selectedType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      // Fetch data in parallel
      const [movementsResponse, outletsResponse] = await Promise.all([
        apiService.getStockMovements(params),
        apiService.get('/outlets')
      ]);

      if (signal?.aborted) return;


      // Handle movements
      if (movementsResponse && movementsResponse.success && movementsResponse.data) {
        const movementsData = movementsResponse.data.data || movementsResponse.data;
        const movementsArray = Array.isArray(movementsData) ? movementsData : [];
        setMovements(movementsArray);
      } else {
        console.warn('⚠️ Stock movements API failed:', movementsResponse?.message);
        setMovements([]);
        toast.error(movementsResponse?.message || 'Gagal memuat riwayat stok');
      }

      // Handle outlets
      if (outletsResponse.success && outletsResponse.data) {
        // Handle paginated response
        const outletsData = outletsResponse.data.data || outletsResponse.data;
        const outletsArray = Array.isArray(outletsData) ? outletsData : [];
        setOutlets(outletsArray);
      } else {
        console.warn('⚠️ StockHistory - Outlets API failed:', outletsResponse?.message);
        setOutlets([]);
      }
    } catch (error: any) {
      if (signal?.aborted) return;
      
      console.error('❌ Error fetching stock movements:', error);
      const message = error.response?.data?.message || error.message || 'Gagal memuat riwayat stok';
      toast.error(message);
      setMovements([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [selectedOutlet, selectedProduct?.id, selectedType, dateFrom, dateTo]);

  // Fetch data when dependencies change (debounced)
  useEffect(() => {
    const abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      fetchData(abortController.signal);
    }, 500); // Debounce

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchData]);

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case 'out':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      case 'adjustment':
        return 'Penyesuaian';
      case 'transfer':
        return 'Transfer';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'text-green-600 bg-green-100';
      case 'out':
        return 'text-red-600 bg-red-100';
      case 'adjustment':
        return 'text-blue-600 bg-blue-100';
      case 'transfer':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatQuantity = (quantity: number) => {
    return quantity >= 0 ? `+${quantity}` : quantity.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pergerakan Stok</h1>
          <p className="text-gray-600">Tracking lengkap semua perubahan stok</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search Notes/User */}
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Catatan/User
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari catatan atau nama user..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Outlet Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outlet
            </label>
            <select
              value={selectedOutlet || ''}
              onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Semua Outlet</option>
              {outlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produk
            </label>
            <ProductSearch
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="Cari produk..."
              className="w-full"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Semua Tipe</option>
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
              <option value="adjustment">Penyesuaian</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Riwayat Pergerakan ({filteredMovements.length})
            </h2>
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat riwayat...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada riwayat pergerakan stok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perubahan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {movement.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {movement.product.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.outlet.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(movement.type)}`}>
                        {getTypeIcon(movement.type)}
                        <span className="ml-1">{getTypeText(movement.type)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatQuantity(movement.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-gray-500">{movement.quantity_before}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{movement.quantity_after}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockHistory;
