import React, { useState, useEffect } from 'react';
import { Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface OutletFormData {
  id?: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main: boolean;
}

interface OutletFormProps {
  outlet?: Outlet | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const OutletForm: React.FC<OutletFormProps> = ({ outlet, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<OutletFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
    is_main: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (outlet) {
      setFormData({
        id: outlet.id,
        name: outlet.name,
        address: outlet.address || '',
        phone: outlet.phone || '',
        email: outlet.email || '',
        is_active: outlet.is_active,
        is_main: (outlet as any).is_main || false
      });
    }
  }, [outlet]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama outlet wajib diisi';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Mohon periksa kembali data yang diisi');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving outlet:', formData);

      const submitData = {
        name: formData.name.trim(),
        address: formData.address?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        is_active: formData.is_active,
        is_main: formData.is_main
      };

      let response: any;
      if (outlet?.id) {
        // Update existing outlet
        response = await apiService.updateOutlet(outlet.id, submitData);
      } else {
        // Create new outlet
        response = await apiService.createOutlet(submitData);
      }

      console.log('📤 Outlet API Response:', response);

      if (response.success) {
        toast.success(outlet?.id ? 'Outlet berhasil diperbarui' : 'Outlet berhasil ditambahkan');
        onSuccess();
      } else {
        const message = response.message || 'Gagal menyimpan outlet';
        toast.error(message);

        // Handle validation errors from backend
        if (response.errors) {
          const errorObj: Record<string, string> = {};
          Object.keys(response.errors).forEach((key: string) => {
            const errorArray = response.errors[key];
            errorObj[key] = Array.isArray(errorArray) ? errorArray[0] : errorArray;
          });
          setErrors(errorObj);
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving outlet:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal menyimpan outlet';

      if (status === 422 && error.response?.data?.errors) {
        // Validation errors from backend
        setErrors(error.response.data.errors);
        toast.error('Mohon periksa kembali data yang diisi');
      } else if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk mengelola outlet');
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OutletFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Outlet Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nama Outlet *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan nama outlet"
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>


      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Alamat
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan alamat lengkap outlet"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Nomor Telepon
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Contoh: 021-1234567 atau 08123456789"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Contoh: outlet@toko.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Status Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Outlet Aktif
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_main"
            checked={formData.is_main}
            onChange={(e) => handleInputChange('is_main', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="is_main" className="ml-2 block text-sm text-gray-900">
            Outlet Utama
          </label>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informasi Outlet
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Outlet aktif akan muncul dalam pilihan saat melakukan transaksi</li>
                <li>Hanya boleh ada satu outlet utama dalam sistem</li>
                <li>Outlet utama tidak dapat dihapus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Menyimpan...
            </div>
          ) : (
            outlet?.id ? 'Perbarui Outlet' : 'Tambah Outlet'
          )}
        </button>
      </div>
    </form>
  );
};

export default OutletForm;
