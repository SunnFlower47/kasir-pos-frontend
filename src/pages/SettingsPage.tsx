import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  PrinterIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import PrinterSettings from '../components/settings/PrinterSettings';

type SettingsTab = 'printer' | 'company' | 'users' | 'security';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('printer');

  const tabs = [
    {
      id: 'printer' as SettingsTab,
      name: 'Printer',
      icon: PrinterIcon,
      description: 'Pengaturan template dan konfigurasi printer'
    },
    {
      id: 'company' as SettingsTab,
      name: 'Perusahaan',
      icon: BuildingStorefrontIcon,
      description: 'Informasi perusahaan dan outlet'
    },
    {
      id: 'users' as SettingsTab,
      name: 'Pengguna',
      icon: UserGroupIcon,
      description: 'Manajemen pengguna dan role'
    },
    {
      id: 'security' as SettingsTab,
      name: 'Keamanan',
      icon: ShieldCheckIcon,
      description: 'Pengaturan keamanan sistem'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'printer':
        return <PrinterSettings />;
      case 'company':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Perusahaan</h3>
            <p className="text-gray-500">Fitur ini akan segera tersedia...</p>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manajemen Pengguna</h3>
            <p className="text-gray-500">Fitur ini akan segera tersedia...</p>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Keamanan</h3>
            <p className="text-gray-500">Fitur ini akan segera tersedia...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Pengaturan Sistem
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Sidebar */}
          <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700'
                        : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                    } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full text-left`}
                  >
                    <Icon
                      className={`${
                        activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                      } flex-shrink-0 -ml-1 mr-3 h-6 w-6`}
                    />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
