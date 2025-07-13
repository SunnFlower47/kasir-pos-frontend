import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CogIcon,
  PrinterIcon,
  ShieldCheckIcon,
  BellIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  tax_rate: number;
  currency: string;
  receipt_footer: string;
  low_stock_threshold: number;
  auto_backup: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    tax_rate: 0,
    currency: 'IDR',
    receipt_footer: '',
    low_stock_threshold: 10,
    auto_backup: false,
    email_notifications: true,
    sms_notifications: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'receipt' | 'notifications' | 'security' | 'system'>('general');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemInfo();
      fetchBackups();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching system settings...');
      const response = await apiService.getSettings();

      if (response.success && response.data) {
        // Backend returns grouped settings, we need to flatten them
        const flatSettings: Partial<SystemSettings> = {};

        // Process each group of settings
        Object.values(response.data).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((setting: any) => {
              const key = setting.key;
              let value = setting.value;

              // Convert based on type
              if (setting.type === 'boolean') {
                value = value === '1' || value === true;
              } else if (setting.type === 'integer') {
                value = parseInt(value);
              } else if (setting.type === 'json') {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  console.warn('Failed to parse JSON setting:', key, value);
                }
              }

              // Map backend keys to frontend keys
              const keyMapping: Record<string, keyof SystemSettings> = {
                'company_name': 'company_name',
                'company_address': 'company_address',
                'company_phone': 'company_phone',
                'company_email': 'company_email',
                'tax_rate': 'tax_rate',
                'currency': 'currency',
                'receipt_footer': 'receipt_footer',
                'low_stock_threshold': 'low_stock_threshold',
                'auto_backup': 'auto_backup',
                'email_notifications': 'email_notifications',
                'sms_notifications': 'sms_notifications'
              };

              const mappedKey = keyMapping[key];
              if (mappedKey) {
                flatSettings[mappedKey] = value;
              }
            });
          }
        });

        setSettings(prev => ({ ...prev, ...flatSettings }));
        console.log('✅ Settings loaded:', flatSettings);
      }
    } catch (error: any) {
      console.error('❌ Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan, menggunakan nilai default');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving settings:', settings);

      // Convert settings to backend format
      const settingsArray = Object.entries(settings).map(([key, value]) => {
        let type = 'string';
        let processedValue = value;

        if (typeof value === 'boolean') {
          type = 'boolean';
          processedValue = value;
        } else if (typeof value === 'number') {
          type = 'integer';
          processedValue = value;
        } else if (typeof value === 'object' && value !== null) {
          type = 'json';
          processedValue = value;
        }

        return {
          key,
          value: processedValue,
          type
        };
      });

      const response = await apiService.updateSettings({ settings: settingsArray });

      if (response.success) {
        toast.success('✅ Pengaturan berhasil disimpan');
        // Refresh settings to get latest data
        await fetchSettings();
      } else {
        toast.error(response.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      const message = error.response?.data?.message || error.message || 'Gagal menyimpan pengaturan';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = () => {
    console.log('Testing printer...');
    toast.success('Fitur test printer akan segera tersedia');
  };

  const fetchSystemInfo = async () => {
    try {
      console.log('🔄 Fetching system info...');
      const response = await apiService.get('/system/info');
      if (response.success) {
        setSystemInfo(response.data);
        console.log('✅ System info loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching system info:', error);
      toast.error('Gagal memuat informasi sistem');
    }
  };

  const fetchBackups = async () => {
    try {
      console.log('🔄 Fetching backups...');
      const response = await apiService.get('/system/backups');
      if (response.success) {
        setBackups(response.data || []);
        console.log('✅ Backups loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching backups:', error);
      toast.error('Gagal memuat daftar backup');
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      console.log('💾 Creating backup...');
      const response = await apiService.post('/system/backup');
      if (response.success) {
        toast.success('✅ Backup berhasil dibuat');
        await fetchBackups(); // Refresh backup list
      } else {
        toast.error(response.message || 'Gagal membuat backup');
      }
    } catch (error: any) {
      console.error('❌ Error creating backup:', error);
      const message = error.response?.data?.message || error.message || 'Gagal membuat backup';
      toast.error(message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      console.log('⬇️ Downloading backup:', filename);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/system/backups/${filename}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('✅ Backup berhasil didownload');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('❌ Error downloading backup:', error);
      toast.error('Gagal mendownload backup');
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus backup "${filename}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting backup:', filename);
      const response = await apiService.delete(`/system/backups/${filename}`);
      if (response.success) {
        toast.success('✅ Backup berhasil dihapus');
        await fetchBackups(); // Refresh backup list
      } else {
        toast.error(response.message || 'Gagal menghapus backup');
      }
    } catch (error: any) {
      console.error('❌ Error deleting backup:', error);
      const message = error.response?.data?.message || error.message || 'Gagal menghapus backup';
      toast.error(message);
    }
  };

  const tabs = [
    { id: 'general', name: 'Umum', icon: CogIcon },
    { id: 'receipt', name: 'Struk', icon: DocumentTextIcon },
    { id: 'notifications', name: 'Notifikasi', icon: BellIcon },
    { id: 'security', name: 'Keamanan', icon: ShieldCheckIcon },
    { id: 'system', name: 'Sistem', icon: PrinterIcon }
  ];

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengaturan Sistem</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola konfigurasi dan preferensi sistem POS
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Menyimpan...
            </div>
          ) : (
            'Simpan Pengaturan'
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Perusahaan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Perusahaan
                    </label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Masukkan nama perusahaan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Perusahaan
                    </label>
                    <input
                      type="email"
                      value={settings.company_email}
                      onChange={(e) => handleInputChange('company_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@perusahaan.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telepon Perusahaan
                    </label>
                    <input
                      type="tel"
                      value={settings.company_phone}
                      onChange={(e) => handleInputChange('company_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="021-1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mata Uang
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="IDR">IDR - Rupiah</option>
                      <option value="USD">USD - Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Perusahaan
                  </label>
                  <textarea
                    value={settings.company_address}
                    onChange={(e) => handleInputChange('company_address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Masukkan alamat lengkap perusahaan"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Bisnis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarif Pajak (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.tax_rate}
                      onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batas Stok Minimum
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.low_stock_threshold}
                      onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Struk</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Footer Struk
                    </label>
                    <textarea
                      value={settings.receipt_footer}
                      onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Terima kasih atas kunjungan Anda!"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Teks yang akan ditampilkan di bagian bawah struk
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Test Printer</h4>
                      <p className="text-sm text-gray-600">Cetak struk test untuk memastikan printer berfungsi</p>
                    </div>
                    <button
                      onClick={handleTestPrint}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      Test Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Notifikasi</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifikasi Email</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifikasi SMS</h4>
                      <p className="text-sm text-gray-600">Terima notifikasi melalui SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sms_notifications}
                        onChange={(e) => handleInputChange('sms_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto Backup</h4>
                      <p className="text-sm text-gray-600">Backup otomatis data setiap hari</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.auto_backup}
                        onChange={(e) => handleInputChange('auto_backup', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Keamanan & Backup</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Backup Manual</h4>
                      <p className="text-sm text-gray-600">Buat backup data secara manual</p>
                    </div>
                    <button
                      onClick={handleCreateBackup}
                      disabled={backupLoading}
                      className="btn btn-secondary"
                    >
                      {backupLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Membuat...
                        </div>
                      ) : (
                        'Buat Backup'
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Keamanan Data</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Pastikan untuk melakukan backup data secara berkala dan gunakan password yang kuat untuk semua akun pengguna.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Management */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* System Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Sistem</h3>
                {systemInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Aplikasi</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Nama: {systemInfo.app?.name}</div>
                        <div>Versi: {systemInfo.app?.version}</div>
                        <div>Environment: {systemInfo.app?.environment}</div>
                        <div>Timezone: {systemInfo.app?.timezone}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Server</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>PHP: {systemInfo.server?.php_version}</div>
                        <div>Laravel: {systemInfo.server?.laravel_version}</div>
                        <div>Memory Limit: {systemInfo.server?.memory_limit}</div>
                        <div>Max Execution: {systemInfo.server?.max_execution_time}s</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Database</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Connection: {systemInfo.database?.connection}</div>
                        <div>Driver: {systemInfo.database?.driver}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Storage</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Free Space: {systemInfo.storage?.disk_free_space ? Math.round(systemInfo.storage.disk_free_space / 1024 / 1024 / 1024) + ' GB' : 'N/A'}</div>
                        <div>Total Space: {systemInfo.storage?.disk_total_space ? Math.round(systemInfo.storage.disk_total_space / 1024 / 1024 / 1024) + ' GB' : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Memuat informasi sistem...</p>
                  </div>
                )}
              </div>

              {/* Backup Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Manajemen Backup</h3>
                  <button
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                    className="btn btn-primary"
                  >
                    {backupLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Membuat...
                      </div>
                    ) : (
                      'Buat Backup Baru'
                    )}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {backups.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama File
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ukuran
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {backups.map((backup, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {backup.filename || backup.name || `backup-${index + 1}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {backup.created_at ? new Date(backup.created_at).toLocaleString('id-ID') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {backup.size ? Math.round(backup.size / 1024) + ' KB' : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDownloadBackup(backup.filename || backup.name)}
                                    className="text-primary-600 hover:text-primary-900"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBackup(backup.filename || backup.name)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">Belum ada backup yang tersedia</p>
                      <p className="text-sm text-gray-400 mt-1">Klik "Buat Backup Baru" untuk membuat backup pertama</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
