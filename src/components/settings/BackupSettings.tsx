import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, CloudArrowDownIcon, ClockIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface BackupHistory {
  id: number;
  filename: string;
  size: string;
  created_at: string;
  type: 'manual' | 'auto';
  status: 'completed' | 'failed' | 'in_progress';
  database_type?: string;
  extension?: string;
  download_url?: string;
}

const BackupSettings: React.FC = () => {
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);

  useEffect(() => {
    fetchBackupHistory();
    fetchBackupSettings();
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await apiService.get('/system/info');

      if (response.success && response.data) {
        setDatabaseInfo({
          type: response.data.database_type,
          version: response.data.database_version,
          name: response.data.database_name,
          all_databases: response.data.all_databases,
          total_connections: response.data.total_connections
        });
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
    }
  };

  const fetchBackupHistory = async () => {
    try {
      const response = await apiService.get('/system/backup/history');

      if (response.success && response.data) {
        setBackupHistory(response.data);
      } else {
        setBackupHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching backup history:', error);
      toast.error('Gagal memuat riwayat backup');
      setBackupHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const response = await apiService.get('/system/backup/settings');
      
      if (response.success && response.data) {
        setAutoBackup(response.data.auto_backup_enabled || false);
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      toast.loading('Membuat backup database...', { id: 'backup-create' });

      const response = await apiService.post('/system/backup/create', {
        type: 'manual'
      });

      toast.dismiss('backup-create');

      if (response.success) {
        toast.success('Backup berhasil dibuat!');

        // Wait a bit for file system to sync
        setTimeout(async () => {
          await fetchBackupHistory();
          await fetchDatabaseInfo();
        }, 1000);
      } else {
        console.error('❌ Backup creation failed:', response.message);
        const errorMessage = response.message || 'Unknown error';
        // Extract actual error message if it's nested
        const cleanMessage = typeof errorMessage === 'string' 
          ? errorMessage 
          : (errorMessage?.message || JSON.stringify(errorMessage));
        toast.error('Gagal membuat backup: ' + cleanMessage);
      }
    } catch (error: any) {
      toast.dismiss('backup-create');
      console.error('❌ Error creating backup:', error);
      let errorMessage = 'Unknown error';
      
      // Handle different error formats
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Clean up array to string conversion errors
      if (errorMessage.includes('Array to string conversion')) {
        errorMessage = 'Terjadi kesalahan saat membuat backup. Silakan periksa log server untuk detail lebih lanjut.';
      }
      
      toast.error('Gagal membuat backup: ' + errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (backup: BackupHistory) => {
    try {
      toast.loading('Mempersiapkan download...', { id: 'backup-download' });

      const response = await apiService.get(`/system/backup/download/${backup.id}`, {
        responseType: 'blob'
      });

      toast.dismiss('backup-download');

      if (response.success || response instanceof Blob) {
        // Create download link
        const blob = response instanceof Blob ? response : new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = backup.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Download backup berhasil!');
      } else {
        toast.error('Gagal download backup');
      }
    } catch (error: any) {
      toast.dismiss('backup-download');
      console.error('Error downloading backup:', error);
      toast.error('Gagal download backup: ' + error.message);
    }
  };

  const toggleAutoBackup = async () => {
    try {
      const newValue = !autoBackup;
      
      const response = await apiService.post('/system/backup/settings', {
        auto_backup_enabled: newValue
      });

      if (response.success) {
        setAutoBackup(newValue);
        toast.success(newValue ? 'Auto backup diaktifkan' : 'Auto backup dinonaktifkan');
      } else {
        toast.error('Gagal mengubah pengaturan auto backup');
      }
    } catch (error) {
      console.error('Error toggling auto backup:', error);
      toast.error('Gagal mengubah pengaturan auto backup');
    }
  };

  const formatFileSize = (size: string) => {
    const sizeNum = parseFloat(size);
    if (sizeNum < 1024) return `${sizeNum} B`;
    if (sizeNum < 1024 * 1024) return `${(sizeNum / 1024).toFixed(1)} KB`;
    if (sizeNum < 1024 * 1024 * 1024) return `${(sizeNum / (1024 * 1024)).toFixed(1)} MB`;
    return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Selesai</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Gagal</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Proses</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-3" />
        Pengaturan Keamanan & Backup
      </h3>
      
      <div className="space-y-6">
        {/* Database Info */}
        {databaseInfo && (
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Database Information</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Database Type</label>
                  <p className="text-gray-900 font-medium">{databaseInfo.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Version</label>
                  <p className="text-gray-900">{databaseInfo.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Database Name</label>
                  <p className="text-gray-900">{databaseInfo.name}</p>
                </div>
              </div>
              {databaseInfo.total_connections > 1 && (
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <p className="text-sm text-blue-800">
                    <strong>{databaseInfo.total_connections}</strong> database connections detected.
                    Backup will include the primary database.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backup Controls */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Backup Database</h4>
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={createBackup}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              <span>{creating ? 'Membuat...' : `Buat Backup ${databaseInfo?.type || 'Database'}`}</span>
            </button>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoBackup"
                checked={autoBackup}
                onChange={toggleAutoBackup}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoBackup" className="text-sm text-gray-700">
                Auto Backup Harian
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Buat backup {databaseInfo?.type || 'database'} secara manual atau atur backup otomatis harian.
            Backup akan disimpan dalam format yang sesuai dengan jenis database.
          </p>
        </div>

        {/* Backup History */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
            Riwayat Backup
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada riwayat backup</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Database
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backupHistory.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <p className="font-medium">{backup.filename}</p>
                          {backup.extension && (
                            <p className="text-xs text-gray-500">.{backup.extension}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {backup.database_type || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          backup.type === 'auto'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(backup.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(backup.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {backup.status === 'completed' && (
                          <button
                            onClick={() => downloadBackup(backup)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
