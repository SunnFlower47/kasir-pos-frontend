import React, { useState, useEffect } from 'react';
import { Outlet } from '../../types';
import { apiService } from '../../services/api';
import OutletForm from './OutletForm';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const OutletList: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  const fetchOutlets = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching outlets...');
      const response = await apiService.getOutlets();
      console.log('🏢 Outlets Response:', response);

      if (response.success && response.data) {
        const data = response.data.data || response.data;
        setOutlets(Array.isArray(data) ? data : []);
        console.log('✅ Outlets loaded successfully');
      } else {
        console.warn('⚠️ Outlets API failed');
        setOutlets([]);
        toast.error('Gagal memuat data outlet');
      }
    } catch (error: any) {
      console.error('❌ Error fetching outlets:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data outlet';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat outlet');
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setOutlets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const handleCreate = () => {
    setEditingOutlet(null);
    setShowForm(true);
  };

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setShowForm(true);
  };

  const handleDelete = async (outlet: Outlet) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus outlet "${outlet.name}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting outlet:', outlet.id);
      const response = await apiService.deleteOutlet(outlet.id);

      if (response.success) {
        toast.success('Outlet berhasil dihapus');
        fetchOutlets(); // Refresh list
      } else {
        toast.error(response.message || 'Gagal menghapus outlet');
      }
    } catch (error: any) {
      console.error('❌ Error deleting outlet:', error);
      const message = error.response?.data?.message || error.message || 'Gagal menghapus outlet';
      toast.error(message);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingOutlet(null);
    fetchOutlets(); // Refresh list
  };

  const handleViewDetail = (outlet: Outlet) => {
    // TODO: Open outlet detail modal
    console.log('View detail for outlet:', outlet);
    toast.success(`Detail outlet ${outlet.name} akan segera tersedia`);
  };

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen Outlet</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola semua outlet dan cabang toko Anda
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Outlet
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari outlet berdasarkan nama, alamat, atau telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOutlets.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-12">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada outlet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tidak ada outlet yang sesuai dengan pencarian' : 'Mulai dengan menambahkan outlet pertama'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={handleCreate}
                    className="btn btn-primary flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Tambah Outlet
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          filteredOutlets.map((outlet) => (
            <div key={outlet.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {outlet.name}
                    </h3>

                    {outlet.address && (
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {outlet.address}
                      </p>
                    )}

                    {outlet.phone && (
                      <p className="text-sm text-gray-600 mb-2">
                        📞 {outlet.phone}
                      </p>
                    )}

                    {outlet.email && (
                      <p className="text-sm text-gray-600 mb-2">
                        ✉️ {outlet.email}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        outlet.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>

                      {(outlet as any).is_main && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Outlet Utama
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleViewDetail(outlet)}
                    className="text-gray-600 hover:text-gray-900 p-1"
                    title="Lihat Detail"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(outlet)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!(outlet as any).is_main && (
                    <button
                      onClick={() => handleDelete(outlet)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Hapus"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {outlets.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{outlets.length}</div>
              <div className="text-sm text-gray-600">Total Outlet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {outlets.filter(o => o.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Outlet Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {outlets.filter(o => (o as any).is_main).length}
              </div>
              <div className="text-sm text-gray-600">Outlet Utama</div>
            </div>
          </div>
        </div>
      )}

      {/* Outlet Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <OutletForm
                outlet={editingOutlet}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletList;
