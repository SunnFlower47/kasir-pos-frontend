import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalculatorIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface ApplicationSettingsData {
  app_name: string;
  app_logo: string | null;
  receipt_header: string;
  receipt_footer: string;
  company_name: string;
  tax_enabled: boolean;
  tax_name: string;
  tax_rate: number;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_places: number;
}

const ApplicationSettings: React.FC = () => {
  const [settings, setSettings] = useState<ApplicationSettingsData>({
    app_name: 'Kasir POS',
    app_logo: null,
    receipt_header: '',
    receipt_footer: 'Terima kasih atas kunjungan Anda!',
    company_name: '',
    tax_enabled: false,
    tax_name: 'PPN',
    tax_rate: 11,
    currency_symbol: 'Rp',
    currency_position: 'before',
    decimal_places: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const flatSettings: Partial<ApplicationSettingsData> = {};
        
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
              } else if (setting.type === 'json') {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  // Ignore parse errors
                }
              }

              // Map keys
              const keyMapping: Record<string, keyof ApplicationSettingsData> = {
                'app_name': 'app_name',
                'app_logo': 'app_logo',
                'receipt_header': 'receipt_header',
                'receipt_footer': 'receipt_footer',
                'company_name': 'company_name',
                'tax_enabled': 'tax_enabled',
                'tax_name': 'tax_name',
                'tax_rate': 'tax_rate',
                'currency_symbol': 'currency_symbol',
                'currency_position': 'currency_position',
                'decimal_places': 'decimal_places'
              };

              const mappedKey = keyMapping[key];
              if (mappedKey) {
                flatSettings[mappedKey] = value as any;
              }
            });
          }
        });

        setSettings(prev => ({ ...prev, ...flatSettings }));
        
        // Set logo preview if URL exists
        if (flatSettings.app_logo) {
          const logoPath = flatSettings.app_logo as string;
          // If it's a file path (not base64), convert to full URL
          if (!logoPath.startsWith('data:image/') && !logoPath.startsWith('http')) {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://kasir-pos-api.sunnflower.site';
            setAppLogoPreview(`${baseUrl.replace('/api/v1', '')}/storage/${logoPath}`);
          } else {
            setAppLogoPreview(logoPath);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof ApplicationSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAppLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file to server
    try {
      toast.loading('Mengupload logo...', { id: 'upload-logo' });
      const response = await apiService.uploadLogo(file, 'app_logo');
      toast.dismiss('upload-logo');
      
      if (response.data.success) {
        // Save the file path to settings state
        handleInputChange('app_logo', response.data.data.path);
        toast.success('Logo berhasil diupload');
      } else {
        throw new Error(response.data.message || 'Failed to upload logo');
      }
    } catch (error: any) {
      toast.dismiss('upload-logo');
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Gagal mengupload logo');
      
      // Reset preview on error
      setAppLogoPreview(null);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      toast.loading('Menghapus logo...', { id: 'delete-logo' });
      const response = await apiService.deleteLogo('app_logo');
      toast.dismiss('delete-logo');
      
      if (response.data.success) {
        setAppLogoPreview(null);
        handleInputChange('app_logo', null);
        toast.success('Logo berhasil dihapus');
      } else {
        throw new Error(response.data.message || 'Failed to delete logo');
      }
    } catch (error: any) {
      toast.dismiss('delete-logo');
      console.error('Error deleting logo:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus logo');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = [
        { key: 'app_name', value: settings.app_name, type: 'string' },
        { key: 'app_logo', value: settings.app_logo || '', type: 'string' },
        { key: 'receipt_header', value: settings.receipt_header, type: 'string' },
        { key: 'receipt_footer', value: settings.receipt_footer, type: 'string' },
        { key: 'company_name', value: settings.company_name, type: 'string' },
        { key: 'tax_enabled', value: settings.tax_enabled, type: 'boolean' },
        { key: 'tax_name', value: settings.tax_name, type: 'string' },
        { key: 'tax_rate', value: settings.tax_rate, type: 'integer' },
        { key: 'currency_symbol', value: settings.currency_symbol, type: 'string' },
        { key: 'currency_position', value: settings.currency_position, type: 'string' },
        { key: 'decimal_places', value: settings.decimal_places, type: 'integer' }
      ];

      const response = await apiService.updateSettings({ settings: settingsArray });
      
      if (response.success) {
        toast.success('Pengaturan aplikasi berhasil disimpan');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan aplikasi');
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
        <h3 className="text-lg font-medium text-gray-900">Pengaturan Aplikasi</h3>
        <p className="mt-1 text-sm text-gray-500">
          Kelola pengaturan aplikasi yang digunakan untuk struk, invoice, laporan, dan dokumen lainnya.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Pengaturan Aplikasi */}
        <div>
          <div className="flex items-center mb-4">
            <CalculatorIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Informasi Aplikasi</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={settings.app_name}
                onChange={(e) => handleInputChange('app_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Kasir POS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Aplikasi
              </label>
              <div className="flex items-center space-x-4">
                {appLogoPreview ? (
                  <div className="relative">
                    <img
                      src={appLogoPreview}
                      alt="App Logo Preview"
                      className="h-16 w-16 object-contain border border-gray-300 rounded-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Pilih Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nama Perusahaan untuk Struk (Fallback) */}
        <div>
          <div className="flex items-center mb-4">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Nama Perusahaan untuk Struk</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Nama perusahaan default yang akan digunakan jika outlet tidak memiliki data. Jika outlet sudah memiliki data, data outlet akan digunakan.
          </p>
          <input
            type="text"
            value={settings.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="PT. Contoh Perusahaan"
          />
        </div>

        {/* Pengaturan Struk */}
        <div>
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Pengaturan Struk</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Struk (teks di bagian atas struk)
              </label>
              <textarea
                value={settings.receipt_header}
                onChange={(e) => handleInputChange('receipt_header', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Selamat Datang di Toko Kami"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Struk (teks di bagian bawah struk)
              </label>
              <textarea
                value={settings.receipt_footer}
                onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Terima kasih atas kunjungan Anda!"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Pajak */}
        <div>
          <div className="flex items-center mb-4">
            <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Pengaturan Pajak</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="tax_enabled"
                type="checkbox"
                checked={settings.tax_enabled}
                onChange={(e) => handleInputChange('tax_enabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="tax_enabled" className="ml-2 block text-sm text-gray-900">
                Aktifkan Pajak
              </label>
            </div>

            {settings.tax_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pajak
                  </label>
                  <input
                    type="text"
                    value={settings.tax_name}
                    onChange={(e) => handleInputChange('tax_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="PPN"
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="11"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pengaturan Mata Uang */}
        <div>
          <div className="flex items-center mb-4">
            <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Pengaturan Mata Uang</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simbol Mata Uang
              </label>
              <input
                type="text"
                value={settings.currency_symbol}
                onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posisi Simbol
              </label>
              <select
                value={settings.currency_position}
                onChange={(e) => handleInputChange('currency_position', e.target.value as 'before' | 'after')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="before">Sebelum Angka</option>
                <option value="after">Setelah Angka</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Desimal
              </label>
              <input
                type="number"
                min="0"
                max="4"
                value={settings.decimal_places}
                onChange={(e) => handleInputChange('decimal_places', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
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

export default ApplicationSettings;

