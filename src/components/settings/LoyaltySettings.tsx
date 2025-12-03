import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  StarIcon,
  CalculatorIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LoyaltySettingsData {
  loyalty_enabled: boolean;
  loyalty_points_per_rupiah: number;
  loyalty_redeem_rate: number;
  loyalty_level1_name: string;
  loyalty_level2_name: string;
  loyalty_level3_name: string;
  loyalty_level4_name: string;
  loyalty_level1_max: number;
  loyalty_level2_min: number;
  loyalty_level2_max: number;
  loyalty_level3_min: number;
  loyalty_level3_max: number;
  loyalty_level4_min: number;
}

const LoyaltySettings: React.FC = () => {
  const [settings, setSettings] = useState<LoyaltySettingsData>({
    loyalty_enabled: true,
    loyalty_points_per_rupiah: 200,
    loyalty_redeem_rate: 1000,
    loyalty_level1_name: 'Bronze',
    loyalty_level2_name: 'Silver',
    loyalty_level3_name: 'Gold',
    loyalty_level4_name: 'Platinum',
    loyalty_level1_max: 4999,
    loyalty_level2_min: 5000,
    loyalty_level2_max: 24999,
    loyalty_level3_min: 25000,
    loyalty_level3_max: 99999,
    loyalty_level4_min: 100000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const flatSettings: Partial<LoyaltySettingsData> = {};
        
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
              const keyMapping: Record<string, keyof LoyaltySettingsData> = {
                'loyalty_enabled': 'loyalty_enabled',
                'loyalty_points_per_rupiah': 'loyalty_points_per_rupiah',
                'loyalty_redeem_rate': 'loyalty_redeem_rate',
                'loyalty_level1_name': 'loyalty_level1_name',
                'loyalty_level2_name': 'loyalty_level2_name',
                'loyalty_level3_name': 'loyalty_level3_name',
                'loyalty_level4_name': 'loyalty_level4_name',
                'loyalty_level1_max': 'loyalty_level1_max',
                'loyalty_level2_min': 'loyalty_level2_min',
                'loyalty_level2_max': 'loyalty_level2_max',
                'loyalty_level3_min': 'loyalty_level3_min',
                'loyalty_level3_max': 'loyalty_level3_max',
                'loyalty_level4_min': 'loyalty_level4_min',
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
      console.error('Error fetching loyalty settings:', error);
      toast.error('Gagal memuat pengaturan loyalty points');
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate points per rupiah
    if (settings.loyalty_points_per_rupiah <= 0) {
      errors.loyalty_points_per_rupiah = 'Harus lebih besar dari 0';
    }

    // Validate level names (should not be empty)
    if (!settings.loyalty_level1_name.trim()) {
      errors.loyalty_level1_name = 'Nama level tidak boleh kosong';
    }
    if (!settings.loyalty_level2_name.trim()) {
      errors.loyalty_level2_name = 'Nama level tidak boleh kosong';
    }
    if (!settings.loyalty_level3_name.trim()) {
      errors.loyalty_level3_name = 'Nama level tidak boleh kosong';
    }
    if (!settings.loyalty_level4_name.trim()) {
      errors.loyalty_level4_name = 'Nama level tidak boleh kosong';
    }

    // Validate thresholds (should not overlap)
    if (settings.loyalty_level2_min <= settings.loyalty_level1_max) {
      errors.loyalty_level2_min = `Harus lebih besar dari Level 1 Max (${settings.loyalty_level1_max})`;
    }
    if (settings.loyalty_level2_max <= settings.loyalty_level2_min) {
      errors.loyalty_level2_max = `Harus lebih besar dari Level 2 Min (${settings.loyalty_level2_min})`;
    }
    if (settings.loyalty_level3_min <= settings.loyalty_level2_max) {
      errors.loyalty_level3_min = `Harus lebih besar dari Level 2 Max (${settings.loyalty_level2_max})`;
    }
    if (settings.loyalty_level3_max <= settings.loyalty_level3_min) {
      errors.loyalty_level3_max = `Harus lebih besar dari Level 3 Min (${settings.loyalty_level3_min})`;
    }
    if (settings.loyalty_level4_min <= settings.loyalty_level3_max) {
      errors.loyalty_level4_min = `Harus lebih besar dari Level 3 Max (${settings.loyalty_level3_max})`;
    }

    // Validate minimum values
    if (settings.loyalty_level1_max < 0) {
      errors.loyalty_level1_max = 'Tidak boleh negatif';
    }
    if (settings.loyalty_level2_min < 0) {
      errors.loyalty_level2_min = 'Tidak boleh negatif';
    }
    if (settings.loyalty_level2_max < 0) {
      errors.loyalty_level2_max = 'Tidak boleh negatif';
    }
    if (settings.loyalty_level3_min < 0) {
      errors.loyalty_level3_min = 'Tidak boleh negatif';
    }
    if (settings.loyalty_level3_max < 0) {
      errors.loyalty_level3_max = 'Tidak boleh negatif';
    }
    if (settings.loyalty_level4_min < 0) {
      errors.loyalty_level4_min = 'Tidak boleh negatif';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (key: keyof LoyaltySettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Terdapat kesalahan validasi. Silakan periksa form Anda.');
      return;
    }

    setSaving(true);
    try {
      const settingsArray = [
        { key: 'loyalty_enabled', value: settings.loyalty_enabled, type: 'boolean' },
        { key: 'loyalty_points_per_rupiah', value: settings.loyalty_points_per_rupiah, type: 'integer' },
        { key: 'loyalty_redeem_rate', value: settings.loyalty_redeem_rate, type: 'integer' },
        { key: 'loyalty_level1_name', value: settings.loyalty_level1_name, type: 'string' },
        { key: 'loyalty_level2_name', value: settings.loyalty_level2_name, type: 'string' },
        { key: 'loyalty_level3_name', value: settings.loyalty_level3_name, type: 'string' },
        { key: 'loyalty_level4_name', value: settings.loyalty_level4_name, type: 'string' },
        { key: 'loyalty_level1_max', value: settings.loyalty_level1_max, type: 'integer' },
        { key: 'loyalty_level2_min', value: settings.loyalty_level2_min, type: 'integer' },
        { key: 'loyalty_level2_max', value: settings.loyalty_level2_max, type: 'integer' },
        { key: 'loyalty_level3_min', value: settings.loyalty_level3_min, type: 'integer' },
        { key: 'loyalty_level3_max', value: settings.loyalty_level3_max, type: 'integer' },
        { key: 'loyalty_level4_min', value: settings.loyalty_level4_min, type: 'integer' },
      ];

      const response = await apiService.updateSettings({ settings: settingsArray });
      
      if (response.success) {
        toast.success('Pengaturan loyalty points berhasil disimpan');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving loyalty settings:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan loyalty points');
    } finally {
      setSaving(false);
    }
  };

  // Calculate example points for preview
  const calculateExamplePoints = (amount: number): number => {
    if (settings.loyalty_points_per_rupiah <= 0) return 0;
    return Math.floor(amount / settings.loyalty_points_per_rupiah);
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
        <h3 className="text-lg font-medium text-gray-900">Pengaturan Loyalty Points</h3>
        <p className="mt-1 text-sm text-gray-500">
          Kelola sistem loyalty points, tingkat level, dan perhitungan points untuk pelanggan.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Enable/Disable Loyalty */}
        <div>
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Status Sistem</h4>
          </div>
          <div className="flex items-center">
            <input
              id="loyalty_enabled"
              type="checkbox"
              checked={settings.loyalty_enabled}
              onChange={(e) => handleInputChange('loyalty_enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="loyalty_enabled" className="ml-2 block text-sm text-gray-900">
              Aktifkan sistem loyalty points
            </label>
          </div>
        </div>

        {/* Points Rate */}
        <div>
          <div className="flex items-center mb-4">
            <CalculatorIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Rate Points</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rupiah per 1 Point
              </label>
              <input
                type="number"
                min="1"
                value={settings.loyalty_points_per_rupiah}
                onChange={(e) => handleInputChange('loyalty_points_per_rupiah', parseInt(e.target.value) || 200)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  validationErrors.loyalty_points_per_rupiah ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Berapa rupiah harus dibelanjakan untuk mendapatkan 1 point. Contoh: 200 berarti setiap Rp 200 = 1 point.
              </p>
              {validationErrors.loyalty_points_per_rupiah && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_points_per_rupiah}</p>
              )}
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Preview Perhitungan Points:</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Transaksi Rp 10,000 = {calculateExamplePoints(10000).toLocaleString('id-ID')} points</p>
                <p>Transaksi Rp 50,000 = {calculateExamplePoints(50000).toLocaleString('id-ID')} points</p>
                <p>Transaksi Rp 100,000 = {calculateExamplePoints(100000).toLocaleString('id-ID')} points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Level Names */}
        <div>
          <div className="flex items-center mb-4">
            <StarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Nama Level (Customizable)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level 1 (Terendah)
              </label>
              <input
                type="text"
                value={settings.loyalty_level1_name}
                onChange={(e) => handleInputChange('loyalty_level1_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  validationErrors.loyalty_level1_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Bronze"
              />
              {validationErrors.loyalty_level1_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level1_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level 2
              </label>
              <input
                type="text"
                value={settings.loyalty_level2_name}
                onChange={(e) => handleInputChange('loyalty_level2_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  validationErrors.loyalty_level2_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Silver"
              />
              {validationErrors.loyalty_level2_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level2_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level 3
              </label>
              <input
                type="text"
                value={settings.loyalty_level3_name}
                onChange={(e) => handleInputChange('loyalty_level3_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  validationErrors.loyalty_level3_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Gold"
              />
              {validationErrors.loyalty_level3_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level3_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level 4 (Tertinggi)
              </label>
              <input
                type="text"
                value={settings.loyalty_level4_name}
                onChange={(e) => handleInputChange('loyalty_level4_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  validationErrors.loyalty_level4_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Platinum"
              />
              {validationErrors.loyalty_level4_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level4_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Threshold per Level */}
        <div>
          <div className="flex items-center mb-4">
            <CalculatorIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Range Points per Level</h4>
          </div>
          <div className="space-y-4">
            {/* Level 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                {settings.loyalty_level1_name} (Level 1)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Minimum
                  </label>
                  <input
                    type="number"
                    value={0}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Level 1 selalu dimulai dari 0</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Maximum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level1_max}
                    onChange={(e) => handleInputChange('loyalty_level1_max', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level1_max ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level1_max && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level1_max}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Level 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                {settings.loyalty_level2_name} (Level 2)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level2_min}
                    onChange={(e) => handleInputChange('loyalty_level2_min', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level2_min ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level2_min && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level2_min}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Maximum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level2_max}
                    onChange={(e) => handleInputChange('loyalty_level2_max', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level2_max ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level2_max && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level2_max}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Level 3 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                {settings.loyalty_level3_name} (Level 3)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level3_min}
                    onChange={(e) => handleInputChange('loyalty_level3_min', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level3_min ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level3_min && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level3_min}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Maximum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level3_max}
                    onChange={(e) => handleInputChange('loyalty_level3_max', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level3_max ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level3_max && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level3_max}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Level 4 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                {settings.loyalty_level4_name} (Level 4)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyalty_level4_min}
                    onChange={(e) => handleInputChange('loyalty_level4_min', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.loyalty_level4_min ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.loyalty_level4_min && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.loyalty_level4_min}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Maximum
                  </label>
                  <input
                    type="text"
                    value="Tidak terbatas"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Level 4 tidak memiliki batas maksimum</p>
                </div>
              </div>
            </div>
          </div>
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

export default LoyaltySettings;

