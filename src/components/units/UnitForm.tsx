import React, { useState, useEffect } from 'react';
import { Unit } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { invalidateUnitCache, invalidateProductCache } from '../../utils/cacheInvalidation';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UnitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: Unit | null;
}

const UnitForm: React.FC<UnitFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  unit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || '',
        symbol: unit.symbol || '',
        description: unit.description || ''
      });
    } else {
      setFormData({
        name: '',
        symbol: '',
        description: ''
      });
    }
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama satuan harus diisi');
      return;
    }

    if (!formData.symbol.trim()) {
      toast.error('Simbol satuan harus diisi');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (unit) {
        // Update existing unit
        response = await apiService.put(`/units/${unit.id}`, formData);
      } else {
        // Create new unit
        response = await apiService.post('/units', formData);
      }

      if (response.success) {
        toast.success(unit ? 'Satuan berhasil diperbarui' : 'Satuan berhasil ditambahkan');
        // Invalidate cache before calling onSuccess
        invalidateUnitCache();
        invalidateProductCache(); // Products depend on units
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Gagal menyimpan satuan');
      }
    } catch (error: any) {
      console.error('Error saving unit:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          errors[key].forEach((message: string) => {
            toast.error(message);
          });
        });
      } else {
        toast.error('Gagal menyimpan satuan');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {unit ? 'Edit Satuan' : 'Tambah Satuan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Satuan *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: Kilogram, Liter, Pieces"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: kg, L, pcs"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Masukkan deskripsi satuan (opsional)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (unit ? 'Perbarui' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitForm;
