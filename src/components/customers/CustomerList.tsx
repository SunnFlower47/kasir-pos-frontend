import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import CustomerForm from './CustomerForm';
import CustomerDetailModal from './CustomerDetailModal';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // No more mock data - 100% API backend

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getCustomers({
        search: searchTerm || undefined,
        level: selectedLevel || undefined
      });

      if (response.success && response.data) {
        const customers = response.data.data || response.data;
        setCustomers(Array.isArray(customers) ? customers : []);
        console.log('✅ Customers loaded:', customers.length, 'items');
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
  }, [searchTerm, selectedLevel]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Refetch when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm)) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel = selectedLevel === '' || customer.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'platinum': return 'Platinum';
      case 'gold': return 'Gold';
      case 'silver': return 'Silver';
      case 'bronze': return 'Bronze';
      default: return 'Bronze';
    }
  };

  const getLevelStars = (level: string) => {
    switch (level) {
      case 'platinum': return 5;
      case 'gold': return 4;
      case 'silver': return 3;
      case 'bronze': return 2;
      default: return 1;
    }
  };

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
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      return;
    }

    try {
      console.log('🔄 Deleting customer:', customer.id);
      const response = await apiService.deleteCustomer(customer.id);

      if (response.success) {
        toast.success('Customer deleted successfully');
        fetchCustomers(); // Refresh list
      } else {
        toast.error(response.message || 'Failed to delete customer');
      }
    } catch (error: any) {
      console.error('❌ Delete customer error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete customer';
      toast.error(message);
    }
  };

  const handleFormSuccess = () => {
    fetchCustomers(); // Refresh list after successful create/update
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleViewHistory = (customer: Customer) => {
    console.log('View history for:', customer);
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
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">VIP</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(c => c.level === 'vip').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Member</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(c => c.level === 'member').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Regular</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(c => c.level === 'regular').length}
              </p>
            </div>
          </div>
        </div>
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
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
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
                {filteredCustomers.map((customer) => (
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
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pelanggan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mulai dengan menambahkan pelanggan pertama Anda.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCustomer(null);
        }}
        onSuccess={handleFormSuccess}
        customer={editingCustomer}
      />

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
