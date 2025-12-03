import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import CustomerDetailModal from './CustomerDetailModal';
import { invalidateCustomerCache } from '../../utils/cacheInvalidation';
import { useLoyaltySettings } from '../../hooks/useLoyaltySettings';
import Pagination, { PaginationData } from '../common/Pagination';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const { getLevelText, getLevelColor, getLevelStars, getLevelOptions } = useLoyaltySettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  // No more mock data - 100% API backend

  const fetchCustomers = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.getCustomers({
        search: searchTerm || undefined,
        level: selectedLevel || undefined,
        page,
        per_page: pagination.per_page
      });

      if (response.success && response.data) {
        const responseData: any = response.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const customersArray = Array.isArray(responseData.data) ? responseData.data : [];
          setCustomers(customersArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else {
          const customers = responseData.data || responseData;
          setCustomers(Array.isArray(customers) ? customers : []);
        }
      } else {
        setCustomers([]);
        toast.error('Gagal memuat data pelanggan');
      }
    } catch (error: any) {
      console.error('❌ Error fetching customers:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data pelanggan';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat data pelanggan');
      } else if (status === 422) {
        toast.error('Data tidak valid: ' + message);
      } else if (status === 500) {
        toast.error('Server error: ' + message);
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedLevel, pagination.per_page]);

  // Initial load
  useEffect(() => {
    fetchCustomers(1); // Reset to page 1 on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedLevel]); // Reset when filters change

  // Refresh data when page becomes visible (user returns from edit/add page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCustomers(pagination.current_page);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCustomers, pagination.current_page]);

  const handlePageChange = (page: number) => {
    fetchCustomers(page);
  };

  // Level functions now come from useLoyaltySettings hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handleAdd = () => {
    navigate('/customers/new');
  };

  const handleEdit = (customer: Customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.deleteCustomer(customer.id);

        if (response.success) {
        toast.success('Customer deleted successfully');
        // Invalidate cache and refresh
        invalidateCustomerCache();
        fetchCustomers(pagination.current_page); // Refresh list
      } else {
        toast.error(response.message || 'Failed to delete customer');
      }
    } catch (error: any) {
      console.error('❌ Delete customer error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete customer';
      toast.error(message);
    }
  };

  // Remove handleFormSuccess since we're using separate pages now

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen Pelanggan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola data pelanggan dan loyalty program
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
              <p className="text-2xl font-semibold text-gray-900">{pagination.total || customers.length}</p>
            </div>
          </div>
        </div>

        {getLevelOptions().reverse().map((option, index) => {
          // Count customers with this level (support both new and old format)
          const levelKeys = [option.value, 
            option.value === 'level4' ? 'platinum' : 
            option.value === 'level3' ? 'gold' :
            option.value === 'level2' ? 'silver' : 'bronze'
          ];
          const count = customers.filter(c => levelKeys.includes(c.level)).length;
          
          const colors = ['text-purple-600', 'text-yellow-600', 'text-gray-600', 'text-orange-600'];
          
          return (
            <div key={option.value} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className={`h-8 w-8 ${colors[index] || 'text-gray-600'}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{option.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pelanggan (nama, email, telepon)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Semua Level</option>
              {getLevelOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poin Loyalty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Umur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || selectedLevel
                        ? 'Tidak ada pelanggan yang sesuai dengan filter'
                        : 'Belum ada pelanggan'
                      }
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getLevelColor(customer.level)}`}>
                          {getLevelText(customer.level)}
                        </span>
                        <div className="ml-2 flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-3 w-3 ${
                                i < getLevelStars(customer.level)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(customer.loyalty_points || 0).toLocaleString()} poin
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.birth_date ? calculateAge(customer.birth_date) : '-'} tahun
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.birth_date ? formatDate(customer.birth_date) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewHistory(customer)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat Riwayat"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerList;
