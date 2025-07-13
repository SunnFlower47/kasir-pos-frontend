import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  ArchiveBoxIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  permission?: string;
  priority: number;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const actions: QuickAction[] = [
    {
      name: 'Buat Transaksi',
      description: 'Mulai transaksi penjualan baru',
      href: '/pos',
      icon: ShoppingCartIcon,
      color: 'bg-green-500 hover:bg-green-600',
      permission: 'transactions.create',
      priority: 1
    },
    {
      name: 'Tambah Produk',
      description: 'Tambah produk baru ke inventory',
      href: '/products?action=create',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      permission: 'products.create',
      priority: 2
    },
    {
      name: 'Kelola Stok',
      description: 'Update dan kelola stok produk',
      href: '/stocks',
      icon: ArchiveBoxIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      permission: 'stocks.view',
      priority: 3
    },
    {
      name: 'Data Pelanggan',
      description: 'Kelola data pelanggan',
      href: '/customers',
      icon: UsersIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      permission: 'customers.view',
      priority: 4
    },
    {
      name: 'Riwayat Transaksi',
      description: 'Lihat riwayat transaksi',
      href: '/transactions',
      icon: DocumentTextIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      permission: 'transactions.view',
      priority: 5
    },
    {
      name: 'Laporan',
      description: 'Lihat laporan penjualan',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      permission: 'reports.sales',
      priority: 6
    },
    {
      name: 'Data Supplier',
      description: 'Kelola data supplier',
      href: '/suppliers',
      icon: TruckIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      permission: 'suppliers.view',
      priority: 7
    },
    {
      name: 'Kelola Produk',
      description: 'Edit dan kelola produk',
      href: '/products',
      icon: CubeIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      permission: 'products.view',
      priority: 8
    }
  ];

  // Filter actions based on permissions and sort by priority
  const availableActions = actions
    .filter(action => !action.permission || hasPermission(action.permission))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6); // Show max 6 actions

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500 mt-1">Akses cepat ke fitur utama</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {availableActions.map((action) => (
            <button
              key={action.name}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${action.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 text-center leading-tight">
                {action.name}
              </h4>
              <p className="text-xs text-gray-500 text-center mt-1 hidden sm:block">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
