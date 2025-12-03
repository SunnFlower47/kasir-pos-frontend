import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Pagination, { PaginationData } from '../common/Pagination';
// import PurchaseFormNew from './PurchaseFormNew'; // Not used anymore

interface Purchase {
  id: number;
  invoice_number: string;
  supplier: {
    id: number;
    name: string;
  };
  outlet: {
    id: number;
    name: string;
  };
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  notes?: string;
  purchase_items: Array<{
    id: number;
    product_id: number;
    product: {
      id: number;
      name: string;
      sku: string;
      purchase_price: number;
      unit: {
        name: string;
      };
    };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface Supplier {
  id: number;
  name: string;
}

interface Outlet {
  id: number;
  name: string;
}

const PurchaseList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [outletFilter, setOutletFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  // const [showCreateForm, setShowCreateForm] = useState(false); // Not used anymore
  // const [showEditForm, setShowEditForm] = useState(false); // Not used anymore
  // const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null); // Not used anymore

  const fetchPurchases = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        per_page: pagination.per_page
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (outletFilter) params.outlet_id = outletFilter;

      const response = await apiService.getPurchases(params);
      if (response.success && response.data) {
        const responseData: any = response.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const purchasesArray = Array.isArray(responseData.data) ? responseData.data : [];
          setPurchases(purchasesArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else {
          const purchasesData = responseData.data || responseData;
          const purchasesArray = Array.isArray(purchasesData) ? purchasesData : [];
          setPurchases(purchasesArray);
        }
        console.log('🔍 Purchases data:', responseData);
      } else {
        setPurchases([]);
        toast.error(response.message || 'Gagal memuat data pembelian');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Gagal memuat data pembelian');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, supplierFilter, outletFilter, pagination.per_page]);

  useEffect(() => {
    fetchPurchases(1); // Reset to page 1 when filters change
    fetchSuppliers();
    fetchOutlets();
  }, [searchTerm, statusFilter, supplierFilter, outletFilter]); // Only reset on filter changes

  const fetchSuppliers = async () => {
    try {
      const response = await apiService.get('/suppliers');
      if (response.success && response.data) {
        const suppliersData = response.data.data || response.data;
        const suppliersArray = Array.isArray(suppliersData) ? suppliersData : [];
        setSuppliers(suppliersArray);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await apiService.get('/outlets');
      if (response.success && response.data) {
        const outletsData = response.data.data || response.data;
        const outletsArray = Array.isArray(outletsData) ? outletsData : [];
        setOutlets(outletsArray);
      } else {
        setOutlets([]);
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
      setOutlets([]);
    }
  };

  const handleSearch = () => {
    fetchPurchases(1); // Reset to page 1 on search
  };

  const handlePageChange = (page: number) => {
    fetchPurchases(page);
  };

  const handleDelete = async (id: number) => {
    const isSuperAdmin = user && (user.role === 'Super Admin' || user.role === 'super_admin');

    if (!isSuperAdmin) {
      toast.error('Hanya super admin yang bisa menghapus purchase');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus pembelian ini?')) {
      return;
    }

    try {
      const response = await apiService.deletePurchase(id);
      if (response.success) {
        toast.success('Pembelian berhasil dihapus');
        fetchPurchases(pagination.current_page);
      } else {
        toast.error(response.message || 'Gagal menghapus pembelian');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Gagal menghapus pembelian');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const response = await apiService.updatePurchaseStatus(id, {
        status: newStatus,
        notes: `Status diubah ke ${newStatus} pada ${new Date().toLocaleString()}`
      });

      if (response.success) {
        toast.success(`Status pembelian berhasil diubah ke ${newStatus}`);
        fetchPurchases(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal mengubah status pembelian');
      }
    } catch (error) {
      console.error('Error updating purchase status:', error);
      toast.error('Gagal mengubah status pembelian');
    }
  };

  const handleEdit = (purchase: Purchase) => {
    // Super admin can edit any purchase, others can only edit pending purchases
    const isSuperAdmin = user && (user.role === 'Super Admin' || user.role === 'super_admin');
    if (isSuperAdmin || purchase.status === 'pending') {
      navigate(`/purchases/${purchase.id}/edit`);
    } else {
      toast.error('Hanya purchase dengan status pending yang bisa diedit');
    }
  };

  const handleUpdateStatus = async (purchaseId: number, newStatus: string) => {
    try {
      const response = await apiService.updatePurchaseStatus(purchaseId, { status: newStatus });
      if (response.success) {
        toast.success(`Status purchase berhasil diubah ke ${newStatus}`);
        fetchPurchases();
      } else {
        toast.error(response.message || 'Gagal mengubah status purchase');
      }
    } catch (error: any) {
      console.error('Error updating purchase status:', error);
      toast.error(error.response?.data?.message || 'Gagal mengubah status purchase');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      partial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sebagian' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Lunas' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data pembelian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                <DocumentTextIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                <span className="hidden sm:inline">Pembelian / Purchase Orders</span>
                <span className="sm:hidden">Pembelian</span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600">
                Kelola pembelian barang dari supplier
              </p>
            </div>
            <button
              onClick={() => navigate('/purchases/create')}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Tambah Pembelian</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-4 md:mb-6">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nomor invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5" />
                Filter
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Cari
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Status</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Sebagian</option>
                      <option value="paid">Lunas</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Supplier Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <select
                      value={supplierFilter}
                      onChange={(e) => setSupplierFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Outlet Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Outlet</label>
                    <select
                      value={outletFilter}
                      onChange={(e) => setOutletFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Outlet</option>
                      {outlets.map(outlet => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.purchase_items.length} item(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{purchase.supplier.name}</div>
                        <div className="text-sm text-gray-500">{purchase.outlet.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(purchase.total_amount)}
                        </div>
                        {purchase.remaining_amount > 0 && (
                          <div className="text-sm text-red-600">
                            Sisa: {formatCurrency(purchase.remaining_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={purchase.status}
                          onChange={(e) => handleStatusUpdate(purchase.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="mt-1">
                          {getStatusBadge(purchase.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/purchases/${purchase.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(purchase)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                            disabled={purchase.status === 'paid' && !(user && (user.role === 'Super Admin' || user.role === 'super_admin'))}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>

                          {/* Status Update Buttons for Super Admin */}
                          {(user && (user.role === 'Super Admin' || user.role === 'super_admin')) && (
                            <>
                              {purchase.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(purchase.id, 'paid')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as Paid"
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              {purchase.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateStatus(purchase.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancel Purchase"
                                >
                                  <XCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Delete button - Super Admin only */}
                          {(user && (user.role === 'Super Admin' || user.role === 'super_admin')) && (
                            <button
                              onClick={() => handleDelete(purchase.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Hapus"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Belum ada data pembelian</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Klik "Tambah Pembelian" untuk membuat purchase order baru
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>

        {/* Create Purchase - Now redirects to separate page */}

        {/* Edit Purchase - Now redirects to separate page */}

      </div>
    </div>
  );
};

export default PurchaseList;
