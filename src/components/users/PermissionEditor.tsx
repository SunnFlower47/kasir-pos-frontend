import React, { useState, useEffect } from 'react';
import { Role, Permission } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PermissionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PermissionEditor: React.FC<PermissionEditorProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiService.getRoles(),
        apiService.getAllPermissions()
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
        setRoles(rolesData);
        console.log('✅ Roles loaded:', rolesData.length, 'items');
      }

      if (permissionsResponse.success && permissionsResponse.data) {
        const permissionsData = Array.isArray(permissionsResponse.data) ? permissionsResponse.data : [];
        setAllPermissions(permissionsData);
        console.log('✅ Permissions loaded:', permissionsData.length, 'items');
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error('Gagal memuat data role dan permission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // TODO: Implement role selection functionality
  // const handleRoleSelect = (role: Role) => {
  //   setSelectedRole(role);
  //   const currentPermissions = role.permissions?.map(p => p.id) || [];
  //   setRolePermissions(currentPermissions);
  // };

  const handlePermissionToggle = (permissionId: number) => {
    setRolePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      toast.error('Pilih role terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateRolePermissions(selectedRole.id, {
        permissions: rolePermissions
      });

      if (response.success) {
        toast.success('Permission berhasil diperbarui');
        onSuccess();
        await fetchData(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal memperbarui permission');
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      toast.error('Gagal memperbarui permission');
    } finally {
      setSaving(false);
    }
  };

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

  const groupedPermissions = groupPermissionsByCategory(allPermissions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <KeyIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Permission Editor</h2>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedRole.name)}`}>
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      {selectedRole.name}
                    </div>
                    <span className="text-sm text-gray-600">
                      {rolePermissions.length} dari {allPermissions.length} permissions dipilih
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRolePermissions([])}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setRolePermissions(allPermissions.map(p => p.id))}
                      className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>

                {/* Permission Content */}
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <KeyIcon className="h-4 w-4 text-gray-500" />
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {permissions.map((permission) => {
                          const isSelected = rolePermissions.includes(permission.id);
                          return (
                            <button
                              key={permission.id}
                              onClick={() => handlePermissionToggle(permission.id)}
                              className={`flex items-center gap-2 p-2.5 border rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {isSelected ? (
                                <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {getPermissionAction(permission.name)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a Role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pilih role dari tab di atas untuk edit permissions
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

export default PermissionEditor;
