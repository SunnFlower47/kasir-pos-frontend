import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Safe permission check wrapper
  const safeHasPermission = (permission: string): boolean => {
    try {
      return hasPermission(permission);
    } catch (error) {
      console.warn('🔇 Permission check error suppressed:', permission, error);
      return false;
    }
  };

  // Safe toggle function to prevent errors
  const safeToggle = (callback: () => void) => {
    try {
      callback();
    } catch (error) {
      console.warn('🔇 Toggle error suppressed:', error);
    }
  };
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key to close sidebar
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, setOpen]);

  // Focus management for mobile sidebar
  React.useEffect(() => {
    if (open && window.innerWidth < 768 && sidebarRef.current) {
      // Focus the sidebar when it opens on mobile
      const firstFocusableElement = sidebarRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100);
      }
    }
  }, [open]);



  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      show: true,
    },
    {
      name: 'POS / Kasir',
      href: '/pos',
      icon: ShoppingCartIcon,
      show: safeHasPermission('transactions.create'),
    },
    {
      name: 'Produk',
      href: '/products',
      icon: CubeIcon,
      show: safeHasPermission('products.view'),
    },
    {
      name: 'Stok',
      href: '/stocks',
      icon: ArchiveBoxIcon,
      show: safeHasPermission('stocks.view'),
    },
    {
      name: 'Pelanggan',
      href: '/customers',
      icon: UsersIcon,
      show: safeHasPermission('customers.view'),
    },
    {
      name: 'Supplier',
      href: '/suppliers',
      icon: TruckIcon,
      show: safeHasPermission('suppliers.view'),
    },
    {
      name: 'Pembelian',
      href: '/purchases',
      icon: ShoppingBagIcon,
      show: safeHasPermission('purchases.view'),
    },
    {
      name: 'Transaksi',
      href: '/transactions',
      icon: DocumentTextIcon,
      show: safeHasPermission('transactions.view'),
    },
    {
      name: 'Laporan',
      href: '/reports',
      icon: ChartBarIcon,
      show: safeHasPermission('reports.sales'),
    },
    {
        name: 'Outlet',
        href: '/outlets',
        icon: BuildingStorefrontIcon,
        // show: hasRole('Super Admin') || hasRole('Admin'),
        show: safeHasPermission('outlets.view'),
    },
    {
      name: 'User Management',
      href: '/users',
      icon: UserGroupIcon,
      show: safeHasPermission('users.view'),
    },
    {
      name: 'Pengaturan',
      href: '/settings',
      icon: CogIcon,
      show: safeHasPermission('settings.view'), // Temporarily allow all users to access settings
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    try {
      return item && typeof item === 'object' && item.show === true;
    } catch (error) {
      console.error('Error filtering navigation item:', error, item);
      return false;
    }
  });



  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Logo */}
      <div className="flex items-center h-16 md:h-20 flex-shrink-0 px-4 md:px-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="ml-3 md:ml-4">
                <h1 className="text-black text-lg md:text-xl font-bold tracking-tight">Kasir POS</h1>
                <p className="text-slate-300 text-xs font-medium">Point of Sale System</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
     <nav className="mt-4 md:mt-6 flex-1 px-3 md:px-4 space-y-1 pt-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-slate-500">
        {filteredNavigation.map((item, index) => {
          const isActive = location.pathname === item.href ||
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <button
              key={item.name}
              onClick={(e) => {
                e.preventDefault();
                console.log('🖱️ Sidebar button clicked:', item.name, item.href);
                navigate(item.href);
                // Don't close sidebar on desktop when collapsed
                if (window.innerWidth < 768) {
                  setOpen(false);
                }
              }}
              className={`
                w-full group flex items-center text-sm font-medium rounded-xl text-left
                transition-all duration-300 cursor-pointer relative overflow-hidden
                ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3.5'}
                ${isActive
                ? 'bg-white text-blue-600 font-semibold shadow-sm ring-1 ring-blue-200'
                : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'}

                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
                transform hover:scale-[1.02] active:scale-[0.98]
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
              title={collapsed ? item.name : undefined}
            >
              {/* Background glow effect for active item */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm"></div>
              )}

              <item.icon
                className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                  collapsed ? 'mr-0' : 'mr-4'
                } ${
                  isActive
                    ? 'text-blue-400 drop-shadow-sm'
                    : 'text-slate-400 group-hover:text-slate-200'
                } transition-colors duration-300`}
              />
              {!collapsed && (
                <span className="truncate relative z-10 font-medium tracking-wide">
                  {item.name}
                </span>
              )}

              {/* Active indicator */}
              {isActive && !collapsed && (
                <div className="ml-auto relative z-10">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-slate-600 shadow-xl">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-600 rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className={`${collapsed ? 'text-center' : 'flex items-center'}`}>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-medium">Version 1.0.0</p>
              <p className="text-xs text-slate-500">© 2025 Kasir POS</p>
            </div>
          )}
          <div className={`${collapsed ? 'mx-auto' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              safeToggle(() => setOpen(false));
            }}
          />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-sm">
            <div ref={sidebarRef} className="relative flex w-full flex-col shadow-2xl">
              <div className="absolute top-0 right-0 -mr-14 pt-4">
                <button
                  type="button"
                  className="ml-1 flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800/80 hover:bg-slate-700 transition-all duration-300 backdrop-blur-sm border border-slate-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    safeToggle(() => setOpen(false));
                  }}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <SidebarContent collapsed={false} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-500 ease-in-out z-30 ${
        open ? 'md:w-64 lg:w-72' : 'md:w-16 lg:w-20'
      }`}>
        <div className="flex h-full flex-col shadow-2xl shadow-slate-900/20 border-r border-slate-200/10">
          <SidebarContent collapsed={!open} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
