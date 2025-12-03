import React, { useState, useEffect } from 'react';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface HotkeyConfig {
  search: string;
  payment: string;
  fullscreen: string;
  cancel: string;
  dashboard: string;
  pos: string;
  products: string;
  reports: string;
}

const defaultHotkeys: HotkeyConfig = {
  search: 'F1',
  payment: 'F2',
  fullscreen: 'F11',
  cancel: 'Escape',
  dashboard: 'Ctrl+1',
  pos: 'Ctrl+2',
  products: 'Ctrl+3',
  reports: 'Ctrl+4'
};

const HotkeySettings: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(defaultHotkeys);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHotkeys();
  }, []);

  const loadHotkeys = () => {
    const savedHotkeys = localStorage.getItem('hotkeySettings');
    if (savedHotkeys) {
      setHotkeys({ ...defaultHotkeys, ...JSON.parse(savedHotkeys) });
    }
  };

  const saveHotkeys = async () => {
    setLoading(true);
    try {
      localStorage.setItem('hotkeySettings', JSON.stringify(hotkeys));
      toast.success('Pengaturan hotkey berhasil disimpan');
      
      // Trigger hotkey update event
      window.dispatchEvent(new CustomEvent('hotkeys-updated', { detail: hotkeys }));
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan hotkey');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setHotkeys(defaultHotkeys);
    toast.success('Hotkey direset ke default');
  };

  const handleKeyCapture = (action: keyof HotkeyConfig, event: React.KeyboardEvent) => {
    event.preventDefault();
    
    let keyCombo = '';
    
    if (event.ctrlKey) keyCombo += 'Ctrl+';
    if (event.altKey) keyCombo += 'Alt+';
    if (event.shiftKey) keyCombo += 'Shift+';
    
    // Handle function keys and special keys
    if (event.key.startsWith('F') && event.key.length <= 3) {
      keyCombo += event.key;
    } else if (event.key === 'Escape') {
      keyCombo += 'Escape';
    } else if (event.key === 'Enter') {
      keyCombo += 'Enter';
    } else if (event.key === ' ') {
      keyCombo += 'Space';
    } else if (event.key.length === 1) {
      keyCombo += event.key.toUpperCase();
    } else {
      return; // Ignore other keys
    }

    // Check for duplicates
    const isDuplicate = Object.entries(hotkeys).some(([key, value]) => 
      key !== action && value === keyCombo
    );

    if (isDuplicate) {
      toast.error('Hotkey sudah digunakan untuk fungsi lain');
      return;
    }

    setHotkeys(prev => ({ ...prev, [action]: keyCombo }));
    setEditingKey(null);
    toast.success(`Hotkey untuk ${getActionLabel(action)} diubah ke ${keyCombo}`);
  };

  const getActionLabel = (action: keyof HotkeyConfig): string => {
    const labels = {
      search: 'Search/Barcode',
      payment: 'Payment',
      fullscreen: 'Fullscreen',
      cancel: 'Cancel',
      dashboard: 'Dashboard',
      pos: 'POS/Kasir',
      products: 'Products',
      reports: 'Reports'
    };
    return labels[action];
  };

  const hotkeyActions = [
    { key: 'search' as keyof HotkeyConfig, label: 'Search/Barcode', description: 'Focus ke search bar atau barcode input' },
    { key: 'payment' as keyof HotkeyConfig, label: 'Payment', description: 'Buka modal pembayaran' },
    { key: 'fullscreen' as keyof HotkeyConfig, label: 'Fullscreen', description: 'Toggle fullscreen mode' },
    { key: 'cancel' as keyof HotkeyConfig, label: 'Cancel', description: 'Batalkan transaksi atau tutup modal' },
    { key: 'dashboard' as keyof HotkeyConfig, label: 'Dashboard', description: 'Navigasi ke dashboard' },
    { key: 'pos' as keyof HotkeyConfig, label: 'POS/Kasir', description: 'Navigasi ke POS' },
    { key: 'products' as keyof HotkeyConfig, label: 'Products', description: 'Navigasi ke products' },
    { key: 'reports' as keyof HotkeyConfig, label: 'Reports', description: 'Navigasi ke reports' }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-6">
          <CommandLineIcon className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Pengaturan Hotkey
          </h3>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Cara Menggunakan:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Klik tombol "Edit" untuk mengubah hotkey</li>
              <li>• Tekan kombinasi tombol yang diinginkan</li>
              <li>• Hotkey akan tersimpan otomatis</li>
              <li>• Gunakan Ctrl+, Alt+, Shift+ untuk kombinasi</li>
            </ul>
          </div>

          <div className="space-y-4">
            {hotkeyActions.map(action => (
              <div key={action.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{action.label}</h4>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {editingKey === action.key ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value="Tekan tombol..."
                        readOnly
                        onKeyDown={(e) => handleKeyCapture(action.key, e)}
                        onBlur={() => setEditingKey(null)}
                        autoFocus
                        className="px-3 py-1 border border-blue-500 rounded bg-blue-50 text-sm font-mono text-center"
                      />
                      <button
                        onClick={() => setEditingKey(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                        {hotkeys[action.key]}
                      </span>
                      <button
                        onClick={() => setEditingKey(action.key)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t">
            <button
              onClick={saveHotkeys}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <button
              onClick={resetToDefault}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset ke Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotkeySettings;
