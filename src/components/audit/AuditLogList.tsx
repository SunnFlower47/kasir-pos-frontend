import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Pagination, { PaginationData } from '../common/Pagination';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: number;
  model_type: string;
  model_id: number;
  event: string;
  old_values: any;
  new_values: any;
  user_id: number;
  user: {
    id: number;
    name: string;
    email?: string;
  };
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditLogStatistics {
  total_logs: number;
  events_breakdown: Array<{ event: string; count: number }>;
  models_breakdown: Array<{ model_type: string; count: number }>;
  users_breakdown: Array<{ user_id: number; count: number; user?: { id: number; name: string } }>;
  daily_activity: Array<{ date: string; count: number }>;
}

const AuditLogList: React.FC = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditLogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        per_page: pagination.per_page,
        page: page,
      };

      if (selectedUser) params.user_id = selectedUser;
      if (selectedModel) params.model_type = selectedModel;
      if (selectedEvent) params.event = selectedEvent;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await apiService.getAuditLogs(params);
      
      if (response.success && response.data) {
        // Handle paginated response
        const responseData: any = response.data;
        
        // Check if it's paginated response (Laravel pagination format)
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'total' in responseData) {
          const logsArray = Array.isArray(responseData.data) ? responseData.data : [];
          setLogs(logsArray);
          
          // Update pagination state
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? Math.ceil((responseData.total || 0) / (responseData.per_page || pagination.per_page)),
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? 0
          });
        } else if (Array.isArray(responseData)) {
          // If data is array directly (non-paginated)
          setLogs(responseData);
          setPagination(prev => ({
            ...prev,
            current_page: page,
            total: responseData.length
          }));
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // If data is paginated response (alternative format)
          setLogs(responseData.data);
          setPagination({
            current_page: responseData.current_page ?? page,
            last_page: responseData.last_page ?? 1,
            per_page: responseData.per_page ?? pagination.per_page,
            total: responseData.total ?? responseData.data.length
          });
        } else {
          console.warn('[AuditLog] Unexpected response format:', responseData);
          setLogs([]);
        }
      } else {
        console.error('[AuditLog] API error:', response.message);
        toast.error(response.message || 'Gagal memuat audit log');
        setLogs([]);
      }
    } catch (error: any) {
      console.error('[AuditLog] Error fetching audit logs:', error);
      toast.error(error.message || 'Gagal memuat audit log');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedModel, selectedEvent, dateFrom, dateTo, pagination.per_page]);

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await apiService.getAuditLogStatistics(params);
      
      if (response && response.success && response.data) {
        setStatistics(response.data);
      } else {
        const errorMessage = response?.message || 'Gagal memuat statistik audit log';
        console.error('[AuditLog] Statistics error:', errorMessage);
        setStatistics(null);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal memuat statistik audit log';
      console.error('[AuditLog] Error fetching statistics:', errorMessage, error);
      setStatistics(null);
    } finally {
      setStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs(1); // Reset to page 1 when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, selectedModel, selectedEvent, dateFrom, dateTo]); // Only reset on filter changes

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatModelType = (modelType: string) => {
    const parts = modelType.split('\\');
    return parts[parts.length - 1];
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'exported':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'created':
        return 'Dibuat';
      case 'updated':
        return 'Diubah';
      case 'deleted':
        return 'Dihapus';
      case 'exported':
        return 'Diekspor';
      default:
        return event;
    }
  };

  const handleViewDetail = async (logId: number) => {
    try {
      const response = await apiService.getAuditLog(logId);
      if (response.success && response.data) {
        setSelectedLog(response.data);
        setShowDetailModal(true);
      }
    } catch (error: any) {
      toast.error('Gagal memuat detail audit log');
    }
  };

  const handleCleanup = async () => {
    if (!cleanupDays || cleanupDays < 1 || cleanupDays > 365) {
      toast.error('Masukkan jumlah hari yang valid (1-365)');
      return;
    }

    try {
      const response = await apiService.cleanupAuditLogs(cleanupDays);
      if (response.success) {
        toast.success(`Berhasil menghapus ${response.data?.deleted_count || 0} audit log`);
        setShowCleanupModal(false);
        setCleanupDays(90);
        fetchLogs();
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error('Gagal menghapus audit log');
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        formatModelType(log.model_type).toLowerCase().includes(searchLower) ||
        (log.user?.name || '').toLowerCase().includes(searchLower) ||
        log.ip_address.includes(searchLower) ||
        log.event.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Riwayat aktivitas dan perubahan data di sistem
          </p>
        </div>
        {hasPermission('audit-logs.delete') && (
          <button
            onClick={() => setShowCleanupModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Hapus Log Lama
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Log</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{statistics.total_logs}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Event Types</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.events_breakdown?.length || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Model Types</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.models_breakdown?.length || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Active Users</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.users_breakdown?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari model, user, IP..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Type
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Model</option>
              <option value="App\\Models\\Product">Product</option>
              <option value="App\\Models\\Customer">Customer</option>
              <option value="App\\Models\\Transaction">Transaction</option>
              <option value="App\\Models\\Purchase">Purchase</option>
              <option value="App\\Models\\Expense">Expense</option>
              <option value="App\\Models\\User">User</option>
              <option value="App\\Models\\Supplier">Supplier</option>
              <option value="App\\Models\\Outlet">Outlet</option>
              <option value="App\\Models\\Category">Category</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Event</option>
              <option value="created">Dibuat</option>
              <option value="updated">Diubah</option>
              <option value="deleted">Dihapus</option>
              <option value="exported">Diekspor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Dari
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Sampai
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Memuat audit log...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">Tidak ada audit log ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user?.name || 'Unknown User'}
                        </div>
                        {log.user?.email && (
                          <div className="text-sm text-gray-500">{log.user.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatModelType(log.model_type)}
                        </div>
                        <div className="text-sm text-gray-500">ID: {log.model_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(
                            log.event
                          )}`}
                        >
                          {getEventLabel(log.event)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(log.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && pagination.total > 0 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detail Audit Log</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Waktu</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.user.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatModelType(selectedLog.model_type)} (ID: {selectedLog.model_id})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getEventColor(
                    selectedLog.event
                  )}`}
                >
                  {getEventLabel(selectedLog.event)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.ip_address}</p>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nilai Lama</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs text-gray-900 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nilai Baru</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs text-gray-900 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hapus Audit Log Lama</h3>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hapus log yang lebih tua dari (hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Masukkan jumlah hari (1-365). Log yang lebih tua dari jumlah hari tersebut akan dihapus.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleCleanup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogList;

