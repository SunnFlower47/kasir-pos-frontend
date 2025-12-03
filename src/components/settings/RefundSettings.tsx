import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface RefundSettingsData {
  refund_enabled: boolean;
  refund_days_limit: number;
  refund_allow_same_day_only_for_cashier: boolean;
}

const RefundSettings: React.FC = () => {
  const [settings, setSettings] = useState<RefundSettingsData>({
    refund_enabled: true,
    refund_days_limit: 7,
    refund_allow_same_day_only_for_cashier: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const flatSettings: Partial<RefundSettingsData> = {};
        
        // Flatten grouped settings
        Object.values(response.data).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((setting: any) => {
              const key = setting.key;
              let value = setting.value;

              // Convert based on type
              if (setting.type === 'boolean') {
                value = value === '1' || value === true;
              } else if (setting.type === 'integer') {
                value = parseInt(value) || 0;
              }

              // Map keys
              const keyMapping: Record<string, keyof RefundSettingsData> = {
                'refund_enabled': 'refund_enabled',
                'refund_days_limit': 'refund_days_limit',
                'refund_allow_same_day_only_for_cashier': 'refund_allow_same_day_only_for_cashier',
              };

              const mappedKey = keyMapping[key];
              if (mappedKey) {
                flatSettings[mappedKey] = value as any;
              }
            });
          }
        });

        setSettings(prev => ({ ...prev, ...flatSettings }));
      }
    } catch (error: any) {
      console.error('Error fetching refund settings:', error);
      toast.error('Gagal memuat pengaturan refund');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof RefundSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = [
        { key: 'refund_enabled', value: settings.refund_enabled, type: 'boolean' },
        { key: 'refund_days_limit', value: settings.refund_days_limit, type: 'integer' },
        { key: 'refund_allow_same_day_only_for_cashier', value: settings.refund_allow_same_day_only_for_cashier, type: 'boolean' },
      ];

      const response = await apiService.updateSettings({ settings: settingsArray });
      
      if (response.success) {
        toast.success('Pengaturan refund berhasil disimpan');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving refund settings:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan refund');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Pengaturan Refund</h3>
        <p className="mt-1 text-sm text-gray-500">
          Kelola pengaturan refund transaksi, termasuk batasan waktu dan role-based access.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Enable/Disable Refund */}
        <div>
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Aktifkan Refund</h4>
          </div>
          <div className="flex items-center">
            <input
              id="refund_enabled"
              type="checkbox"
              checked={settings.refund_enabled}
              onChange={(e) => handleInputChange('refund_enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="refund_enabled" className="ml-2 block text-sm text-gray-900">
              Aktifkan fitur refund transaksi
            </label>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Jika dinonaktifkan, semua user tidak dapat melakukan refund transaksi.
          </p>
        </div>

        {/* Refund Time Limit for Admin/Manager */}
        <div>
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Batasan Waktu Refund (Admin/Manager)</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batasan Hari untuk Refund
              </label>
              <input
                type="number"
                min="0"
                value={settings.refund_days_limit}
                onChange={(e) => handleInputChange('refund_days_limit', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="7"
              />
              <p className="mt-2 text-sm text-gray-500">
                Setel jumlah hari maksimal untuk melakukan refund setelah transaksi dibuat.
                <br />
                <strong>0 = Tanpa batasan</strong> (Admin/Manager bisa refund kapan saja)
                <br />
                <strong>7 = 7 hari</strong> setelah transaksi dibuat
              </p>
            </div>
          </div>
        </div>

        {/* Cashier Restriction */}
        <div>
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Batasan untuk Kasir</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="refund_allow_same_day_only_for_cashier"
                type="checkbox"
                checked={settings.refund_allow_same_day_only_for_cashier}
                onChange={(e) => handleInputChange('refund_allow_same_day_only_for_cashier', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="refund_allow_same_day_only_for_cashier" className="ml-2 block text-sm text-gray-900">
                Kasir hanya bisa refund transaksi hari ini
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Jika diaktifkan, user dengan role <strong>Cashier</strong> hanya dapat melakukan refund untuk transaksi yang dibuat pada hari yang sama.
              <br />
              Admin dan Manager tetap mengikuti batasan waktu di atas.
            </p>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-blue-900 mb-2">Informasi Penting:</h5>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Refund akan mengembalikan stock produk ke gudang</li>
            <li>Loyalty points yang diberikan akan dikurangi otomatis</li>
            <li>Transaksi yang sudah di-refund tidak dapat di-refund lagi</li>
            <li>Batasan waktu dihitung sejak tanggal transaksi dibuat, bukan tanggal refund</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundSettings;
