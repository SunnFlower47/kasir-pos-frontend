import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  PhotoIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

interface Outlet {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  npwp: string | null;
  logo: string | null;
  is_active: boolean;
}

const CompanyOutletSettings: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    npwp: ''
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      setFormData({
        name: selectedOutlet.name || '',
        code: selectedOutlet.code || '',
        address: selectedOutlet.address || '',
        phone: selectedOutlet.phone || '',
        email: selectedOutlet.email || '',
        website: selectedOutlet.website || '',
        npwp: selectedOutlet.npwp || ''
      });

      // Set logo preview
      if (selectedOutlet.logo) {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://kasir-pos-api.sunnflower.site';
        const logoUrl = selectedOutlet.logo.startsWith('http') 
          ? selectedOutlet.logo 
          : `${baseUrl.replace('/api/v1', '')}/storage/${selectedOutlet.logo}`;
        setLogoPreview(logoUrl);
      } else {
        setLogoPreview(null);
      }
    }
  }, [selectedOutlet]);

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const response = await apiService.getOutlets({ per_page: 1000 });
      if (response.success && response.data) {
        const outletsList = Array.isArray(response.data.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
          ? response.data 
          : [];
        setOutlets(outletsList);
        if (outletsList.length > 0 && !selectedOutlet) {
          setSelectedOutlet(outletsList[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching outlets:', error);
      toast.error('Gagal memuat data outlet');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOutlet) return;

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
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file to server
    try {
      toast.loading('Mengupload logo...', { id: 'upload-logo' });
      const response = await apiService.uploadOutletLogo(selectedOutlet.id, file);
      toast.dismiss('upload-logo');
      
      if (response.data.success) {
        toast.success('Logo berhasil diupload');
        // Refresh outlet data
        fetchOutlets();
      } else {
        throw new Error(response.data.message || 'Failed to upload logo');
      }
    } catch (error: any) {
      toast.dismiss('upload-logo');
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Gagal mengupload logo');
      setLogoPreview(selectedOutlet.logo ? (selectedOutlet.logo.startsWith('http') ? selectedOutlet.logo : `${process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'https://kasir-pos-api.sunnflower.site'}/storage/${selectedOutlet.logo}`) : null);
    }
  };

  const handleRemoveLogo = async () => {
    if (!selectedOutlet) return;

    try {
      // Update outlet dengan logo = null
      const response = await apiService.updateOutlet(selectedOutlet.id, { ...formData, logo: null });
      if (response.success) {
        setLogoPreview(null);
        toast.success('Logo berhasil dihapus');
        fetchOutlets();
      }
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Gagal menghapus logo');
    }
  };

  const handleSave = async () => {
    if (!selectedOutlet) {
      toast.error('Pilih outlet terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateOutlet(selectedOutlet.id, formData);
      
      if (response.success) {
        toast.success('Data outlet berhasil disimpan');
        fetchOutlets();
      } else {
        throw new Error(response.message || 'Failed to save outlet');
      }
    } catch (error: any) {
      console.error('Error saving outlet:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan data outlet');
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
        <h3 className="text-lg font-medium text-gray-900">Data Perusahaan & Outlet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Kelola informasi perusahaan dan outlet yang akan digunakan untuk struk, laporan, dan dokumen lainnya.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Outlet Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Outlet
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white flex items-center justify-between"
            >
              <span>{selectedOutlet ? selectedOutlet.name : 'Pilih outlet...'}</span>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      type="button"
                      onClick={() => {
                        setSelectedOutlet(outlet);
                        setShowDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                        selectedOutlet?.id === outlet.id ? 'bg-indigo-50 text-indigo-700' : ''
                      }`}
                    >
                      {outlet.name} ({outlet.code})
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {selectedOutlet && (
          <>
            {/* Informasi Outlet */}
            <div>
              <div className="flex items-center mb-4">
                <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-md font-semibold text-gray-900">Informasi Outlet</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Outlet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nama Outlet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Outlet *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="OUT001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Alamat
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jl. Contoh No. 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="info@outlet.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://www.outlet.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IdentificationIcon className="h-4 w-4 inline mr-1" />
                    NPWP
                  </label>
                  <input
                    type="text"
                    value={formData.npwp}
                    onChange={(e) => handleInputChange('npwp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="12.345.678.9-012.345"
                  />
                </div>
              </div>
            </div>

            {/* Logo Outlet */}
            <div>
              <div className="flex items-center mb-4">
                <PhotoIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-md font-semibold text-gray-900">Logo Outlet</h4>
              </div>
              <div className="flex items-start space-x-6">
                <div className="flex-1">
                  <div className="mt-1 flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Outlet Logo Preview"
                          className="h-24 w-24 object-contain border border-gray-300 rounded-lg p-2"
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
                      <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
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
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG maksimal 2MB</p>
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
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyOutletSettings;

