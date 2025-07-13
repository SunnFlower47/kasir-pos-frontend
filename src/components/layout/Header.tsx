import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 md:h-20 bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 md:px-5 border-r border-slate-200/50 text-slate-600 hover:text-slate-800 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden transition-all duration-300"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Tablet & Desktop menu button */}
      <button
        type="button"
        className="hidden md:flex px-5 lg:px-6 border-r border-slate-200/50 text-slate-600 hover:text-slate-800 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 items-center transition-all duration-300 group"
        onClick={onMenuClick}
        title="Toggle Sidebar"
      >
        <Bars3Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
      </button>

      <div className="flex-1 px-4 md:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex-1 flex items-center">
          {/* App title on mobile & tablet */}
          <div className="lg:hidden">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Kasir POS</h1>
          </div>
          {/* Empty space for better layout on desktop */}
          <div className="hidden lg:block flex-1">
            {/* Space for future features if needed */}
          </div>
        </div>

        <div className="ml-4 md:ml-6 flex items-center space-x-2 md:space-x-3 lg:space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative bg-white/50 backdrop-blur-sm p-2 md:p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-300 border border-slate-200/50 group"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 md:h-3 md:w-3 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1 transition-colors">
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <UserCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-24 md:max-w-32">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500 truncate max-w-24 md:max-w-32">
                      {user?.roles?.[0]?.name || 'User'}
                    </div>
                  </div>
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      <UserIcon className="mr-3 h-4 w-4" />
                      Profil Saya
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                      Keluar
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Outlet info - Show on larger tablets and desktop */}
          {user?.outlet && (
            <div className="ml-3 md:ml-4 hidden lg:block">
              <div className="text-xs md:text-sm text-gray-500">Outlet:</div>
              <div className="text-sm md:text-base font-medium text-gray-900 truncate max-w-32">{user.outlet.name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
