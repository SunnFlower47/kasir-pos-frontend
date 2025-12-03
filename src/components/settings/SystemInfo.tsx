import React, { useState, useEffect } from 'react';
import { ComputerDesktopIcon, ServerIcon, CircleStackIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface SystemInfoData {
  // Application Info
  app_name: string;
  app_version: string;
  laravel_version: string;
  php_version: string;
  php_extensions: number;

  // Database Info
  database_type: string;
  database_version: string;
  database_name: string;
  database_size: string;
  host: string;
  port: string;
  all_databases: Record<string, any>;
  total_connections: number;

  // Server Info
  server_os: string;
  server_software: string;
  server_memory: string;
  server_memory_usage: string;
  disk_space_total: string;
  disk_space_free: string;
  disk_space_used: string;
  cpu_cores: string | number;
  uptime: string;

  // System Info
  environment: string;
  timezone: string;
  locale: string;
  debug_mode: boolean;
  cache_driver: string;
  session_driver: string;
  queue_driver: string;

  // Statistics
  last_backup: string;
  total_users: number;
  total_products: number;
  total_transactions: number;

  // System Resources
  memory_limit: string;
  max_execution_time: string;
  upload_max_filesize: string;
  post_max_size: string;
}

const SystemInfo: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/system/info');

      if (response.success && response.data) {
        const data = response.data as any;
        const app = data.app ?? {};
        const database = data.database ?? {};
        const server = data.server ?? {};
        const storage = data.storage ?? {};
        const stats = data.statistics ?? {};
        const env = data.environment ?? {};
        const resources = data.resources ?? {};

        // Safely extract database connections
        let allDatabases: Record<string, any> = {};
        let totalConnections = 0;
        
        // Helper to clean database connection object - ensure all values are primitives
        const cleanDbConnection = (conn: any): any => {
          if (!conn || typeof conn !== 'object') return conn;
          
          const cleaned: any = {};
          Object.keys(conn).forEach(key => {
            const value = conn[key];
            if (value === null || value === undefined) {
              cleaned[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              cleaned[key] = value;
            } else if (Array.isArray(value)) {
              // If array, take first primitive value or convert to string
              cleaned[key] = value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number') 
                ? value[0] 
                : JSON.stringify(value);
            } else if (typeof value === 'object') {
              // If it's an object, try to extract useful info
              if (value.name && typeof value.name === 'string') {
                cleaned[key] = value.name;
              } else if (value.path && typeof value.path === 'string') {
                cleaned[key] = value.path;
              } else if (value.size && typeof value.size === 'number') {
                cleaned[key] = String(value.size);
              } else {
                // Convert object to string representation
                cleaned[key] = JSON.stringify(value);
              }
            } else {
              cleaned[key] = String(value);
            }
          });
          return cleaned;
        };
        
        if (database.connections && typeof database.connections === 'object') {
          if (Array.isArray(database.connections)) {
            // If it's an array, convert to object with connection names as keys
            database.connections.forEach((conn: any, index: number) => {
              const cleanedConn = cleanDbConnection(conn);
              const connName = cleanedConn.connection_name || cleanedConn.name || `connection_${index}`;
              allDatabases[connName] = cleanedConn;
            });
            totalConnections = database.connections.length;
          } else {
            // Clean each connection in the object
            Object.keys(database.connections).forEach(key => {
              allDatabases[key] = cleanDbConnection(database.connections[key]);
            });
            totalConnections = Object.keys(allDatabases).length || 1;
          }
        }
        
        // Ensure numeric values are properly parsed
        const safeToNumber = (value: any, defaultValue: number = 0): number => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : parsed;
          }
          return defaultValue;
        };
        
        // Ensure string values are properly converted
        const safeToString = (value: any, defaultValue: string = '-'): string => {
          if (value === null || value === undefined) return defaultValue;
          if (typeof value === 'string') return value;
          if (typeof value === 'number') return String(value);
          if (typeof value === 'boolean') return String(value);
          if (Array.isArray(value)) return value[0] ? safeToString(value[0], defaultValue) : defaultValue;
          // If value is an object, don't try to convert it - return default
          if (typeof value === 'object') {
            // If object has a 'name' property (like file objects), use it
            if (value.name && typeof value.name === 'string') return value.name;
            // If object has a 'path' property (like file objects), use it
            if (value.path && typeof value.path === 'string') return value.path;
            // Otherwise return default to avoid rendering object
            return defaultValue;
          }
          return String(value);
        };
        
        setSystemInfo({
          app_name: safeToString(app.name, 'Kasir POS System'),
          app_version: safeToString(app.version, '-'),
          laravel_version: safeToString(app.laravel_version || server.laravel_version, '-'),
          php_version: safeToString(app.php_version || server.php_version, '-'),
          php_extensions: safeToNumber(app.php_extensions, 0),
          database_type: safeToString(database.type, 'SQLite'),
          database_version: safeToString(database.version, '-'),
          database_name: safeToString(database.name, '-'),
          database_size: safeToString(database.size || storage?.database_size, '-'),
          host: safeToString(database.host, 'localhost'),
          port: safeToString(database.port, '0'),
          all_databases: allDatabases,
          total_connections: safeToNumber(database.total_connections, totalConnections || 1),
          server_os: server.os ?? '-',
          server_software: server.software ?? '-',
          server_memory: server.memory ?? '-',
          server_memory_usage: server.memory_usage ?? '-',
          disk_space_total: storage.disk_total ?? server.disk_space_total ?? '-',
          disk_space_free: storage.disk_free ?? server.disk_space_free ?? '-',
          disk_space_used: storage.disk_used ?? server.disk_space_used ?? '-',
          cpu_cores: server.cpu_cores ?? '-',
          uptime: server.uptime ?? '-',
          environment: app.environment ?? env.environment ?? '-',
          timezone: app.timezone ?? env.timezone ?? '-',
          locale: app.locale ?? env.locale ?? '-',
          debug_mode: app.debug_mode ?? env.debug_mode ?? false,
          cache_driver: env.cache_driver ?? 'file',
          session_driver: env.session_driver ?? 'file',
          queue_driver: env.queue_driver ?? 'sync',
          last_backup: storage.last_backup ?? stats.last_backup ?? 'Belum ada backup',
          total_users: stats.total_users ?? 0,
          total_products: stats.total_products ?? 0,
          total_transactions: stats.total_transactions ?? 0,
          memory_limit: resources.memory_limit ?? '-',
          max_execution_time: resources.max_execution_time ?? '-',
          upload_max_filesize: resources.upload_max_filesize ?? '-',
          post_max_size: resources.post_max_size ?? '-'
        });
      } else {
        toast.error('Gagal memuat informasi sistem');
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
      toast.error('Gagal memuat informasi sistem');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Gagal memuat informasi sistem</p>
          <button 
            onClick={fetchSystemInfo}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <ComputerDesktopIcon className="h-6 w-6 text-gray-400 mr-3" />
        Informasi System
      </h3>
      
      <div className="space-y-6">
        {/* Application Info */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <CpuChipIcon className="h-5 w-5 text-blue-600 mr-2" />
            Informasi Aplikasi
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Aplikasi</label>
              <p className="text-gray-900">{systemInfo.app_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Versi Aplikasi</label>
              <p className="text-gray-900">{systemInfo.app_version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Laravel Version</label>
              <p className="text-gray-900">{systemInfo.laravel_version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PHP Version</label>
              <p className="text-gray-900">{systemInfo.php_version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Environment</label>
              <p className="text-gray-900 capitalize">
                {systemInfo.environment}
                {systemInfo.debug_mode && <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Debug Mode</span>}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <p className="text-gray-900">{systemInfo.timezone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Locale</label>
              <p className="text-gray-900">{systemInfo.locale}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PHP Extensions</label>
              <p className="text-gray-900">{systemInfo.php_extensions} loaded</p>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <ServerIcon className="h-5 w-5 text-green-600 mr-2" />
            Informasi Server
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Laravel Version</label>
              <p className="text-gray-900">{systemInfo.laravel_version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PHP Version</label>
              <p className="text-gray-900">{systemInfo.php_version}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Server OS</label>
              <p className="text-gray-900">{systemInfo.server_os}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Memory Usage</label>
              <p className="text-gray-900">{systemInfo.server_memory_usage} / {systemInfo.server_memory}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Disk Space</label>
              <p className="text-gray-900">
                {systemInfo.disk_space_used} / {systemInfo.disk_space_total}
                <span className="text-sm text-gray-500 ml-2">
                  ({systemInfo.disk_space_free} free)
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CPU Cores</label>
              <p className="text-gray-900">{systemInfo.cpu_cores}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Uptime</label>
              <p className="text-gray-900">{systemInfo.uptime}</p>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <CircleStackIcon className="h-5 w-5 text-purple-600 mr-2" />
            Informasi Database ({systemInfo.total_connections} connections)
          </h4>

          {/* Primary Database */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-purple-900 mb-3">Primary Database</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Database Type</label>
                <p className="text-gray-900 font-medium">{systemInfo.database_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Version</label>
                <p className="text-gray-900">{systemInfo.database_version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Database Name</label>
                <p className="text-gray-900">{systemInfo.database_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Host:Port</label>
                <p className="text-gray-900">{systemInfo.host}:{systemInfo.port}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Database Size</label>
                <p className="text-gray-900">{systemInfo.database_size}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Backup</label>
                <p className="text-gray-900">{systemInfo.last_backup || 'Belum ada backup'}</p>
              </div>
            </div>
          </div>

          {/* All Database Connections */}
          {systemInfo.all_databases && Object.keys(systemInfo.all_databases).length > 1 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">All Database Connections</h5>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(systemInfo.all_databases).map(([name, db]: [string, any]) => {
                  // Helper to safely render values - ensures no objects are rendered
                  const safeRender = (value: any): string => {
                    if (value === null || value === undefined) return '-';
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                      return String(value);
                    }
                    if (typeof value === 'object') {
                      // If it's an object with name/path (file object), try to extract useful info
                      if (value.name && typeof value.name === 'string') return value.name;
                      if (value.path && typeof value.path === 'string') return value.path;
                      // Otherwise return placeholder to avoid rendering object
                      return '[Object]';
                    }
                    return String(value);
                  };

                  return (
                    <div key={name} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-900">
                          {safeRender(name)} {db?.is_default && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>}
                        </h6>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          safeRender(db?.status) === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {safeRender(db?.status) === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium">{safeRender(db?.type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Version:</span>
                          <p>{safeRender(db?.version)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Database:</span>
                          <p>{safeRender(db?.name)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Host:</span>
                          <p>{safeRender(db?.host)}:{safeRender(db?.port)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{systemInfo.total_users.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{systemInfo.total_products.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{systemInfo.total_transactions.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <CpuChipIcon className="h-5 w-5 text-orange-600 mr-2" />
            System Resources & Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Memory Limit</label>
              <p className="text-gray-900">{systemInfo.memory_limit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Max Execution Time</label>
              <p className="text-gray-900">{systemInfo.max_execution_time}s</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Upload Max Filesize</label>
              <p className="text-gray-900">{systemInfo.upload_max_filesize}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Post Max Size</label>
              <p className="text-gray-900">{systemInfo.post_max_size}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cache Driver</label>
              <p className="text-gray-900">{systemInfo.cache_driver}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Session Driver</label>
              <p className="text-gray-900">{systemInfo.session_driver}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Queue Driver</label>
              <p className="text-gray-900">{systemInfo.queue_driver}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Locale</label>
              <p className="text-gray-900">{systemInfo.locale}</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchSystemInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
