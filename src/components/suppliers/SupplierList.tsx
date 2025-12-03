import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import SupplierForm from './SupplierForm';
import Pagination, { PaginationData } from '../common/Pagination';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const fetchSuppliers = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.getSuppliers({
        search: searchTerm || undefined,
        page,
        per_page: pagination.per_page
      });

      if (response.success && response.data) {
        const responseData: any = response.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const suppliersArray = Array.isArray(responseData.data) ? responseData.data : [];
          setSuppliers(suppliersArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else {
          const suppliersData = responseData.data || responseData;
          setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        }
      } else {
        console.error('❌ Failed to fetch suppliers:', response.message);
        toast.error('Failed to load suppliers');
        setSuppliers([]);
      }
    } catch (error: any) {
      console.error('❌ Suppliers fetch error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load suppliers';
      toast.error(message);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.per_page]);

  useEffect(() => {
    fetchSuppliers(1); // Reset to page 1 when search term changes
  }, [searchTerm]); // Only reset on search term change

  const handleAdd = () => {
    setEditingSupplier(null);
    setShowForm(true);
  };

  const handleViewDetail = (supplier: Supplier) => {
    // TODO: Open supplier detail modal with products
    toast.success(`Detail supplier ${supplier.name} akan segera tersedia`);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.deleteSupplier(supplier.id);

      if (response.success) {
        toast.success('Supplier deleted successfully');
        fetchSuppliers(pagination.current_page); // Refresh list
      } else {
        toast.error(response.message || 'Failed to delete supplier');
      }
    } catch (error: any) {
      console.error('❌ Delete supplier error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete supplier';
      toast.error(message);
    }
  };

  const handleFormSuccess = () => {
    fetchSuppliers(pagination.current_page); // Refresh list after successful create/update
    setShowForm(false);
    setEditingSupplier(null);
  };

  const handlePageChange = (page: number) => {
    fetchSuppliers(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen Supplier</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola data supplier dan vendor
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-semibold text-gray-900">{pagination.total || suppliers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {suppliers.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive Suppliers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {suppliers.filter(s => !s.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm
                          ? 'Tidak ada supplier yang sesuai dengan pencarian'
                          : 'Belum ada supplier'
                        }
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          {supplier.address && (
                            <div className="text-sm text-gray-500">
                              {supplier.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contact_person || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.email && (
                          <div>{supplier.email}</div>
                        )}
                        {supplier.phone && (
                          <div className="text-gray-500">{supplier.phone}</div>
                        )}
                        {!supplier.email && !supplier.phone && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetail(supplier)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Products"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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

            {/* Pagination */}
            {!loading && pagination.total > 0 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Supplier Form Modal */}
      <SupplierForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSupplier(null);
        }}
        onSuccess={handleFormSuccess}
        supplier={editingSupplier}
      />
    </div>
  );
};

export default SupplierList;
