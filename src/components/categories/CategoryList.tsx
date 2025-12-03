import React, { useState, useEffect, useCallback } from 'react';
import { Category } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { invalidateCategoryCache, invalidateProductCache } from '../../utils/cacheInvalidation';
import CategoryForm from './CategoryForm';
import Pagination, { PaginationData } from '../common/Pagination';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: pagination.per_page
      };
      if (searchTerm) params.search = searchTerm;

      const response = await apiService.get('/categories', params);

      if (response.success && response.data) {
        const responseData: any = response.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const categoriesArray = Array.isArray(responseData.data) ? responseData.data : [];
          setCategories(categoriesArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else if (Array.isArray(responseData)) {
          // Direct array format (fallback)
          setCategories(responseData);
          setPagination(prev => ({
            ...prev,
            current_page: page,
            total: responseData.length
          }));
        } else {
          const categoriesData = responseData.data || responseData;
          const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
          setCategories(categoriesArray);
        }
      } else {
        console.warn('⚠️ Categories API failed:', response?.message);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      toast.error('Gagal memuat data kategori');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.per_page]);

  useEffect(() => {
    fetchCategories(1); // Reset to page 1 on initial load
  }, [fetchCategories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCategories(1); // Reset to page 1 when search term changes
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.delete(`/categories/${category.id}`);

      if (response.success) {
        toast.success('Kategori berhasil dihapus');
        // Invalidate cache and refresh
        invalidateCategoryCache();
        invalidateProductCache(); // Products depend on categories
        fetchCategories(pagination.current_page);
      } else {
        toast.error(response.message || 'Gagal menghapus kategori');
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.response?.status === 409) {
        toast.error('Kategori tidak dapat dihapus karena masih digunakan oleh produk');
      } else {
        toast.error('Gagal menghapus kategori');
      }
    }
  };

  const handleFormSuccess = () => {
    // Invalidate cache before refreshing
    invalidateCategoryCache();
    invalidateProductCache(); // Products depend on categories
    fetchCategories(pagination.current_page);
  };

  const handlePageChange = (page: number) => {
    fetchCategories(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kategori Produk</h2>
          <p className="mt-1 text-sm text-gray-600">
            Kelola kategori untuk mengorganisir produk
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Kategori
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kategori..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm
                      ? 'Tidak ada kategori yang sesuai dengan pencarian'
                      : 'Belum ada kategori'
                    }
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(category as any).products_count || 0} produk
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit kategori"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus kategori"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        category={editingCategory}
      />
    </div>
  );
};

export default CategoryList;
