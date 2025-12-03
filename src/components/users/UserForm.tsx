import React, { useState, useEffect, useCallback } from 'react';
import { User, Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface UserFormProps {
  user?: User | null;
  outlets: Outlet[];
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, outlets, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'Cashier',
    outlet_id: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [roles, setRoles] = useState<Array<{value: string, label: string, description: string}>>([]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiService.getRoles();
      if (response.success && response.data) {
        const rolesData = response.data.map((role: any) => ({
          value: role.name,
          label: role.name,
          description: getRoleDescription(role.name)
        }));
        setRoles(rolesData);
      } else {
        // Fallback to hardcoded roles if API fails
        setRoles([
          { value: 'Super Admin', label: 'Super Admin', description: 'Akses penuh ke semua fitur sistem' },
          { value: 'Admin', label: 'Admin', description: 'Akses ke sebagian besar fitur manajemen' },
          { value: 'Manager', label: 'Manager', description: 'Akses ke laporan dan manajemen outlet' },
          { value: 'Cashier', label: 'Cashier', description: 'Akses ke POS dan transaksi' },
          { value: 'Warehouse', label: 'Warehouse', description: 'Akses ke manajemen stok dan inventory' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to hardcoded roles
      setRoles([
        { value: 'Super Admin', label: 'Super Admin', description: 'Akses penuh ke semua fitur sistem' },
        { value: 'Admin', label: 'Admin', description: 'Akses ke sebagian besar fitur manajemen' },
        { value: 'Manager', label: 'Manager', description: 'Akses ke laporan dan manajemen outlet' },
        { value: 'Cashier', label: 'Cashier', description: 'Akses ke POS dan transaksi' },
        { value: 'Warehouse', label: 'Warehouse', description: 'Akses ke manajemen stok dan inventory' }
      ]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
        role: user.role || 'Cashier',
        outlet_id: user.outlet_id?.toString() || '',
        is_active: user.is_active ?? true
      });
    }
  }, [user, fetchRoles]);

  const getRoleDescription = (roleName: string): string => {
    const descriptions: Record<string, string> = {
      'Super Admin': 'Akses penuh ke semua fitur sistem',
      'Admin': 'Akses ke sebagian besar fitur manajemen',
      'Manager': 'Akses ke laporan dan manajemen outlet',
      'Cashier': 'Akses ke POS dan transaksi',
      'Warehouse': 'Akses ke manajemen stok dan inventory'
    };
    return descriptions[roleName] || 'Role khusus';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nama harus diisi');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email harus diisi');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    if (formData.phone && !/^[\d+\-()s]+$/.test(formData.phone)) {
      toast.error('Format nomor telepon tidak valid');
      return false;
    }

    if (!user && !formData.password) {
      toast.error('Password harus diisi untuk user baru');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok');
      return false;
    }

    if (!formData.role) {
      toast.error('Role harus dipilih');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        outlet_id: formData.outlet_id ? parseInt(formData.outlet_id) : null,
        is_active: formData.is_active,
        ...(formData.password && {
          password: formData.password,
          password_confirmation: formData.password_confirmation
        })
      };

      let response;
      if (user) {
        response = await apiService.updateUser(user.id, submitData);
      } else {
        response = await apiService.createUser(submitData);
      }

      if (response.success) {
        toast.success(`User berhasil ${user ? 'diperbarui' : 'ditambahkan'}`);
        onSuccess();
      } else {
        toast.error(response.message || `Gagal ${user ? 'memperbarui' : 'menambahkan'} user`);
      }
    } catch (error: any) {
      console.error('❌ Error submitting user:', error);

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          errors[key].forEach((message: string) => {
            toast.error(message);
          });
        });
      } else {
        const message = error.response?.data?.message || error.message || `Gagal ${user ? 'memperbarui' : 'menambahkan'} user`;
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <p className="text-sm text-gray-600">
                {user ? 'Perbarui informasi user' : 'Tambahkan user baru ke sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {user ? 'Ubah Password (Opsional)' : 'Password *'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!user && '*'}
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={user ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                    required={!user}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password {!user && '*'}
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswordConfirmation ? 'text' : 'password'}
                    value={formData.password_confirmation}
                    onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ulangi password"
                    required={!user && !!formData.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirmation ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Access */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Akses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <div className="relative">
                  <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.role && (
                  <p className="mt-1 text-xs text-gray-500">
                    {roles.find(r => r.value === formData.role)?.description}
                  </p>
                )}
              </div>

              {/* Outlet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet
                </label>
                <div className="relative">
                  <BuildingStorefrontIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.outlet_id}
                    onChange={(e) => handleInputChange('outlet_id', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Semua Outlet</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan untuk akses ke semua outlet
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {user ? 'Memperbarui...' : 'Menambahkan...'}
                </div>
              ) : (
                user ? 'Perbarui User' : 'Tambah User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
