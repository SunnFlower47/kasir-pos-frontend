import React from 'react';
import { User, Outlet } from '../../types';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UserDetailModalProps {
  user: User;
  outlet?: Outlet;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, outlet, onClose }) => {
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Super Admin': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Manager': 'bg-green-100 text-green-800',
      'Cashier': 'bg-yellow-100 text-yellow-800',
      'Warehouse': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      'Super Admin': 'Akses penuh ke semua fitur sistem',
      'Admin': 'Akses ke sebagian besar fitur manajemen',
      'Manager': 'Akses ke laporan dan manajemen outlet',
      'Cashier': 'Akses ke POS dan transaksi',
      'Warehouse': 'Akses ke manajemen stok dan inventory'
    };
    return descriptions[role] || 'Role tidak dikenal';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <UserIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Detail User
              </h2>
              <p className="text-sm text-gray-600">
                Informasi lengkap user sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nama Lengkap</p>
                    <p className="text-sm text-gray-600">{user.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nomor Telepon</p>
                    <p className="text-sm text-gray-600">{user.phone || 'Tidak ada'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  {user.is_active ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Access */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Akses</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {getRoleDescription(user.role)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outlet */}
                <div className="flex items-start gap-3">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Outlet</p>
                    <p className="text-sm text-gray-600">
                      {outlet ? outlet.name : 'Semua Outlet'}
                    </p>
                    {outlet && (
                      <p className="text-xs text-gray-500 mt-1">
                        {outlet.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Aktivitas</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Created At */}
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tanggal Dibuat</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>

                {/* Updated At */}
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Terakhir Diperbarui</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(user.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Last Login */}
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Terakhir Login</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(user.last_login_at)}
                    </p>
                  </div>
                </div>

                {/* Email Verified */}
                <div className="flex items-center gap-3">
                  {user.email_verified_at ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Terverifikasi</p>
                    <p className="text-sm text-gray-600">
                      {user.email_verified_at ? formatDate(user.email_verified_at) : 'Belum terverifikasi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Preview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Hak Akses</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getPermissionsByRole(user.role).map((permission, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get permissions by role
const getPermissionsByRole = (role: string): string[] => {
  const permissions: Record<string, string[]> = {
    'Super Admin': [
      'Semua Fitur',
      'Manajemen User',
      'Pengaturan Sistem',
      'Backup & Restore',
      'Laporan Lengkap',
      'Multi Outlet'
    ],
    'Admin': [
      'Manajemen Produk',
      'Manajemen Stok',
      'Manajemen Pelanggan',
      'Manajemen Supplier',
      'Laporan',
      'Pengaturan Outlet'
    ],
    'Manager': [
      'Lihat Laporan',
      'Manajemen Outlet',
      'Manajemen Stok',
      'Manajemen Pelanggan',
      'Export Data'
    ],
    'Cashier': [
      'Point of Sale',
      'Proses Transaksi',
      'Lihat Produk',
      'Lihat Pelanggan',
      'Cetak Struk'
    ],
    'Warehouse': [
      'Manajemen Stok',
      'Stock Opname',
      'Transfer Stok',
      'Lihat Produk',
      'Laporan Stok'
    ]
  };

  return permissions[role] || [];
};

export default UserDetailModal;
