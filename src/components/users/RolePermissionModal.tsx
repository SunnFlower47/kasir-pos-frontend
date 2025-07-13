import React, { useState, useEffect } from 'react';
import { Role, Permission } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRoles();

      if (response.success && response.data) {
        const rolesData = Array.isArray(response.data) ? response.data : [];
        setRoles(rolesData);
        console.log('✅ Roles loaded:', rolesData.length, 'items');
      } else {
        console.warn('⚠️ Roles API failed:', response?.message);
        setRoles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      toast.error('Gagal memuat data role');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const getRoleColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      'Super Admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'Admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manager': 'bg-green-100 text-green-800 border-green-200',
      'Cashier': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Warehouse': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return roleColors[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPermissionCategory = (permissionName: string) => {
    const categories: Record<string, string> = {
      'users': 'User Management',
      'products': 'Product Management',
      'categories': 'Category Management',
      'transactions': 'Transaction Management',
      'purchases': 'Purchase Management',
      'customers': 'Customer Management',
      'suppliers': 'Supplier Management',
      'stocks': 'Stock Management',
      'reports': 'Reports',
      'settings': 'Settings',
      'outlets': 'Outlet Management',
      'promotions': 'Promotion Management'
    };

    const prefix = permissionName.split('.')[0];
    return categories[prefix] || 'Other';
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};

    permissions.forEach(permission => {
      const category = getPermissionCategory(permission.name);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });

    return grouped;
  };

  const getPermissionAction = (permissionName: string) => {
    const action = permissionName.split('.')[1];
    const actionLabels: Record<string, string> = {
      'view': 'Lihat',
      'create': 'Tambah',
      'edit': 'Edit',
      'delete': 'Hapus',
      'adjustment': 'Penyesuaian',
      'transfer': 'Transfer',
      'refund': 'Refund',
      'sales': 'Penjualan',
      'purchases': 'Pembelian',
      'stocks': 'Stok',
      'profit': 'Profit'
    };
    return actionLabels[action] || action;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Memuat data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Role & Permission View</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Roles Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-6 px-4 overflow-x-auto" aria-label="Tabs">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    selectedRole?.id === role.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role.name)}`}>
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      {role.name}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({role.permissions?.length || 0})
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Permissions Content */}
          <div className="p-4">
            {selectedRole ? (
              <div>
                {/* Permission Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedRole.name)}`}>
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    {selectedRole.name}
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedRole.permissions?.length || 0} permissions assigned
                  </span>
                </div>

                {/* Permission Content */}
                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupPermissionsByCategory(selectedRole.permissions)).map(([category, permissions]) => (
                      <div key={category}>
                        <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <KeyIcon className="h-4 w-4 text-gray-500" />
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm"
                            >
                              <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-800">
                                {getPermissionAction(permission.name)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Permissions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Role ini belum memiliki permission
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a Role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pilih role dari tab di atas untuk melihat permissions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionModal;
