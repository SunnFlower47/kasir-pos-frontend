import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheckIcon,
  KeyIcon,
  CheckIcon,
  XCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

const RolePermissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRolesAndPermissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token'); // Use correct token key
      console.log('Fetching roles and permissions with token:', token ? 'Token exists' : 'No token');

      // Redirect to login if no token
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const [rolesResponse, permissionsResponse] = await Promise.all([
        axios.get('http://kasir-pos-system.test/api/v1/roles', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://kasir-pos-system.test/api/v1/permissions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('Roles response:', rolesResponse.data);
      console.log('Permissions response:', permissionsResponse.data);

      const rolesData = rolesResponse.data.data || rolesResponse.data || [];
      const permissionsData = permissionsResponse.data.data || permissionsResponse.data || [];

      setRoles(rolesData);
      setAllPermissions(permissionsData);

      console.log('Set roles:', rolesData);
      console.log('Set permissions:', permissionsData);

      // Set first role as selected by default
      if (rolesData && rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
        console.log('Selected role:', rolesData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching roles and permissions:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);

        // Handle authentication errors
        if (error.response.status === 401 || error.response.status === 403) {
          console.log('Authentication failed, redirecting to login');
          localStorage.removeItem('auth_token'); // Clear invalid token
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  useEffect(() => {
    if (selectedRole) {
      setRolePermissions(selectedRole.permissions?.map(p => p.id) || []);
    }
  }, [selectedRole]);

  const handleSave = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token'); // Use correct token key
      await axios.put(`http://kasir-pos-system.test/api/v1/roles/${selectedRole.id}/permissions`, {
        permissions: rolePermissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      const updatedRole = {
        ...selectedRole,
        permissions: allPermissions.filter(p => rolePermissions.includes(p.id))
      };
      setSelectedRole(updatedRole);
      setRoles(prev => prev.map(role =>
        role.id === selectedRole.id ? updatedRole : role
      ));

      alert('Permissions berhasil disimpan!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Gagal menyimpan permissions');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    return permissions.reduce((groups, permission) => {
      const category = permission.name.split('.')[0];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1) + ' Management';

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(permission);
      return groups;
    }, {} as Record<string, Permission[]>);
  };

  const getPermissionAction = (permissionName: string) => {
    const action = permissionName.split('.')[1];
    const actionMap: Record<string, string> = {
      'view': 'Lihat',
      'create': 'Tambah',
      'edit': 'Edit',
      'delete': 'Hapus',
      'tambah': 'Tambah',
      'kurang': 'Kurang',
      'transfer': 'Transfer',
      'penyesuaian': 'Penyesuaian',
      'pembelian': 'Pembelian',
      'penjualan': 'Penjualan',
      'stok': 'Stok',
      'profit': 'Profit'
    };
    return actionMap[action] || action;
  };

  const getRoleColor = (roleName: string) => {
    const colorMap: Record<string, string> = {
      'Super Admin': 'bg-red-100 text-red-800 border-red-200',
      'Admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'Manager': 'bg-green-100 text-green-800 border-green-200',
      'Cashier': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Warehouse': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const groupedPermissions = groupPermissionsByCategory(allPermissions);

  // Debug info
  console.log('Current state:', {
    loading,
    roles: roles.length,
    allPermissions: allPermissions.length,
    selectedRole: selectedRole?.name,
    rolePermissions: rolePermissions.length,
    groupedPermissions: Object.keys(groupedPermissions).length,
    token: localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING',
    user: localStorage.getItem('user') ? 'EXISTS' : 'MISSING'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show debug info if no data
  if (!loading && (roles.length === 0 || allPermissions.length === 0)) {
    const token = localStorage.getItem('auth_token'); // Use correct token key

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md">
            {!token ? (
              <>
                <div className="text-red-500 mb-4">
                  <ShieldCheckIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Required</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Anda perlu login sebagai <strong>Super Admin</strong> atau <strong>Admin</strong> untuk mengakses Role & Permission Management.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Login Sekarang
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Debug Info</h3>
                <div className="text-left space-y-2 text-sm mb-6">
                  <p><strong>Roles loaded:</strong> {roles.length}</p>
                  <p><strong>Permissions loaded:</strong> {allPermissions.length}</p>
                  <p><strong>Selected role:</strong> {selectedRole?.name || 'None'}</p>
                  <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={fetchRolesAndPermissions}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Retry Loading
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Login Ulang
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/users')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Role & Permission Management</h1>
                  <p className="text-sm text-gray-600">Kelola permissions untuk setiap role</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Role Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedRole?.id === role.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role.name)}`}>
                      <UserGroupIcon className="h-3 w-3 mr-1" />
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
        </div>

        {/* Permission Content */}
        {selectedRole ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Permission Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(selectedRole.name)}`}>
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  {selectedRole.name}
                </div>
                <span className="text-sm text-gray-600">
                  {rolePermissions.length} dari {allPermissions.length} permissions dipilih
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRolePermissions([])}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setRolePermissions(allPermissions.map(p => p.id))}
                  className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  Select All
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>

            {/* Permission Grid */}
            <div className="p-6 space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category}>
                  <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <KeyIcon className="h-4 w-4 text-gray-500" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {permissions.map((permission) => {
                      const isSelected = rolePermissions.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          onClick={() => handlePermissionToggle(permission.id)}
                          className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition-colors ${
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Select a Role</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pilih role dari tab di atas untuk edit permissions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermissionPage;
