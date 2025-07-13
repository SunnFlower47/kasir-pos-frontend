import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Outlet } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import UserForm from './UserForm';
import UserDetailModal from './UserDetailModal';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const roles = [
    { value: 'Super Admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
    { value: 'Admin', label: 'Admin', color: 'bg-blue-100 text-blue-800' },
    { value: 'Manager', label: 'Manager', color: 'bg-green-100 text-green-800' },
    { value: 'Cashier', label: 'Cashier', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Warehouse', label: 'Warehouse', color: 'bg-gray-100 text-gray-800' }
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching users...');
      const params: any = {};

      if (searchTerm) params.search = searchTerm;
      if (selectedRole) params.role = selectedRole;
      if (selectedOutlet) params.outlet_id = selectedOutlet;

      const response = await apiService.getUsers(params);

      if (response.success && response.data) {
        // Handle both paginated and non-paginated responses
        const usersData = response.data.data || response.data;
        const usersArray = Array.isArray(usersData) ? usersData : [];
        setUsers(usersArray);
        console.log('✅ Users loaded:', usersArray.length);
      } else {
        console.warn('⚠️ No users data received, using empty array');
        setUsers([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      const message = error.response?.data?.message || error.message || 'Gagal memuat data user';
      toast.error(message);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole, selectedOutlet]);

  const fetchOutlets = async () => {
    try {
      console.log('🔄 Fetching outlets...');
      const response = await apiService.getOutlets();

      if (response.success && response.data) {
        // Handle paginated response
        const outletsData = response.data.data || response.data;
        const outletsArray = Array.isArray(outletsData) ? outletsData : [];
        setOutlets(outletsArray);
        console.log('✅ Outlets loaded:', outletsArray.length, 'items');
      } else {
        console.warn('⚠️ No outlets data received, using empty array');
        setOutlets([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching outlets:', error);
      setOutlets([]); // Ensure outlets is always an array
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting user:', user.id);
      const response = await apiService.deleteUser(user.id);

      if (response.success) {
        toast.success('✅ User berhasil dihapus');
        await fetchUsers();
      } else {
        toast.error(response.message || 'Gagal menghapus user');
      }
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      const message = error.response?.data?.message || error.message || 'Gagal menghapus user';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      console.log('🔄 Toggling user status:', user.id);
      const response = await apiService.updateUser(user.id, {
        ...user,
        is_active: !user.is_active
      });

      if (response.success) {
        toast.success(`✅ User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        await fetchUsers();
      } else {
        toast.error(response.message || 'Gagal mengubah status user');
      }
    } catch (error: any) {
      console.error('❌ Error toggling user status:', error);
      const message = error.response?.data?.message || error.message || 'Gagal mengubah status user';
      toast.error(message);
    }
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetail(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesOutlet = !selectedOutlet || user.outlet_id?.toString() === selectedOutlet;

    return matchesSearch && matchesRole && matchesOutlet;
  });

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getOutletName = (outletId: number | null | undefined) => {
    if (!outletId) return 'Semua Outlet';
    const outlet = (outlets || []).find(o => o.id === outletId);
    return outlet?.name || 'Unknown Outlet';
  };

  useEffect(() => {
    fetchUsers();
    fetchOutlets();
  }, [fetchUsers]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manajemen User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola user, role, dan akses sistem
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/role-permissions')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ShieldCheckIcon className="h-5 w-5" />
            Role & Permission Management
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Role</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          {/* Outlet Filter */}
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Outlet</option>
            {(outlets || []).map(outlet => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>

          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span>{filteredUsers.length} dari {users.length} user</span>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outlet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />
                      {getOutletName(user.outlet_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(user)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada user</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedRole || selectedOutlet
                ? 'Tidak ada user yang sesuai dengan filter'
                : 'Mulai dengan menambahkan user baru'
              }
            </p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          outlets={outlets}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* User Detail Modal */}
      {showDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          outlet={(outlets || []).find(o => o.id === selectedUser.outlet_id)}
          onClose={() => {
            setShowDetail(false);
            setSelectedUser(null);
          }}
        />
      )}


    </div>
  );
};

export default UserList;
