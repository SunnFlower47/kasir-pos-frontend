import React, { useState, useEffect, useCallback } from 'react';
import { Unit } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import UnitForm from './UnitForm';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const UnitList: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;

      const response = await apiService.get('/units', params);

      if (response.success && response.data) {
        const unitsData = response.data.data || response.data;
        const unitsArray = Array.isArray(unitsData) ? unitsData : [];
        setUnits(unitsArray);
        console.log('✅ Units loaded:', unitsArray.length, 'items');
      } else {
        console.warn('⚠️ Units API failed:', response?.message);
        setUnits([]);
      }
    } catch (error) {
      console.error('❌ Error fetching units:', error);
      toast.error('Gagal memuat data satuan');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUnits();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    setEditingUnit(null);
    setShowForm(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowForm(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus satuan "${unit.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.delete(`/units/${unit.id}`);

      if (response.success) {
        toast.success('Satuan berhasil dihapus');
        fetchUnits();
      } else {
        toast.error(response.message || 'Gagal menghapus satuan');
      }
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      if (error.response?.status === 409) {
        toast.error('Satuan tidak dapat dihapus karena masih digunakan oleh produk');
      } else {
        toast.error('Gagal menghapus satuan');
      }
    }
  };

  const handleFormSuccess = () => {
    fetchUnits();
  };

  const filteredUnits = units.filter(unit =>
    !searchTerm ||
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-xl font-semibold text-gray-900">Satuan Produk</h2>
          <p className="mt-1 text-sm text-gray-600">
            Kelola satuan untuk mengukur produk
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Satuan
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
            placeholder="Cari satuan..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Satuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Simbol
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
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm
                      ? 'Tidak ada satuan yang sesuai dengan pencarian'
                      : 'Belum ada satuan'
                    }
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {unit.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {unit.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {unit.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(unit as any).products_count || 0} produk
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit satuan"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(unit)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus satuan"
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

      {/* Unit Form Modal */}
      <UnitForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        unit={editingUnit}
      />
    </div>
  );
};

export default UnitList;
