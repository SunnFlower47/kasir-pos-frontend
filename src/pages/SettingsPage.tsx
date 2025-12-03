import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  PrinterIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  CalculatorIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import PrinterSettings from '../components/settings/PrinterSettings';
import HotkeySettings from '../components/settings/HotkeySettings';
import SystemInfo from '../components/settings/SystemInfo';
import BackupSettings from '../components/settings/BackupSettings';
import CompanyOutletSettings from '../components/settings/CompanyOutletSettings';
import ApplicationSettings from '../components/settings/ApplicationSettings';
import LoyaltySettings from '../components/settings/LoyaltySettings';
import RefundSettings from '../components/settings/RefundSettings';

type SettingsTab = 'printer' | 'hotkeys' | 'company-outlet' | 'application' | 'loyalty' | 'refund' | 'security' | 'system';

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
      id: 'hotkeys' as SettingsTab,
      name: 'Hotkeys',
      icon: CommandLineIcon,
      description: 'Pengaturan keyboard shortcuts dan hotkeys'
    },
    {
      id: 'company-outlet' as SettingsTab,
      name: 'Perusahaan & Outlet',
      icon: BuildingStorefrontIcon,
      description: 'Data perusahaan dan outlet'
    },
    {
      id: 'application' as SettingsTab,
      name: 'Pengaturan Aplikasi',
      icon: CalculatorIcon,
      description: 'Pengaturan aplikasi untuk struk dan invoice'
    },
    {
      id: 'loyalty' as SettingsTab,
      name: 'Loyalty Points',
      icon: StarIcon,
      description: 'Pengaturan sistem loyalty points dan level pelanggan'
    },
    {
      id: 'refund' as SettingsTab,
      name: 'Refund',
      icon: ArrowPathIcon,
      description: 'Pengaturan refund transaksi dan batasan waktu'
    },
    {
      id: 'security' as SettingsTab,
      name: 'Keamanan',
      icon: ShieldCheckIcon,
      description: 'Backup database dan pengaturan keamanan'
    },
    {
      id: 'system' as SettingsTab,
      name: 'Info System',
      icon: ComputerDesktopIcon,
      description: 'Informasi sistem dan versi aplikasi'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'printer':
        try {
          return <PrinterSettings />;
        } catch (error) {
          console.error('❌ Error rendering PrinterSettings:', error);
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-900 mb-4">Error Loading Printer Settings</h3>
              <p className="text-red-700">Failed to load printer settings component.</p>
              <p className="text-red-600 text-sm mt-2">Error: {error?.toString()}</p>
            </div>
          );
        }
      case 'hotkeys':
        return <HotkeySettings />;
      case 'company-outlet':
        return <CompanyOutletSettings />;
      case 'application':
        return <ApplicationSettings />;
      case 'loyalty':
        return <LoyaltySettings />;
      case 'refund':
        return <RefundSettings />;
      case 'security':
        return <BackupSettings />;
      case 'system':
        return <SystemInfo />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
  {/* Header */}
  <div className="bg-white border-b">
    <div className="max-w-screen-2xl w-full mx-auto px-6 sm:px-10 lg:px-16">
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
  <div className="max-w-screen-2xl w-full mx-auto px-6 sm:px-10 lg:px-16 py-10">
    <div className="lg:grid lg:grid-cols-12 lg:gap-8">
      
      {/* Sidebar */}
      <aside className="lg:col-span-3 space-y-4">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 hover:bg-indigo-100'
                    : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                } group border-l-4 px-3 py-2 flex items-start text-sm font-medium w-full text-left rounded-md transition-all`}
              >
                <Icon
                  className={`${
                    isActive
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } flex-shrink-0 mr-3 h-6 w-6`}
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
      <main className="lg:col-span-9 mt-8 lg:mt-0 space-y-6">
        {renderTabContent()}
      </main>
    </div>
  </div>
</div>

  );
};

export default SettingsPage;
