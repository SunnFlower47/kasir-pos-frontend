import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  unit: {
    name: string;
  };
}

interface PurchaseItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Purchase {
  id: number;
  invoice_number: string;
  supplier: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
  };
  outlet: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
  purchase_date: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  notes?: string;
  purchase_items: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

const PurchaseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPurchase(id);
    }
  }, [id]);

  const fetchPurchase = async (purchaseId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getPurchase(parseInt(purchaseId));
      if (response.success && response.data) {
        setPurchase(response.data);
      } else {
        toast.error('Purchase tidak ditemukan');
        navigate('/purchases');
      }
    } catch (error) {
      console.error('Error fetching purchase:', error);
      toast.error('Gagal memuat data purchase');
      navigate('/purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!purchase) return;

    const isSuperAdmin = user && (user.role === 'Super Admin' || user.role === 'super_admin');
    if (isSuperAdmin || purchase.status === 'pending') {
      navigate(`/purchases/${purchase.id}/edit`);
    } else {
      toast.error('Hanya purchase dengan status pending yang bisa diedit');
    }
  };

  const handleDelete = async () => {
    if (!purchase) return;

    const isSuperAdmin = user && (user.role === 'Super Admin' || user.role === 'super_admin');

    if (!isSuperAdmin && purchase.status !== 'pending') {
      toast.error('Hanya super admin yang bisa menghapus purchase dengan status selain pending');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus purchase ini?')) {
      try {
        const response = await apiService.deletePurchase(purchase.id);
        if (response.success) {
          toast.success('Purchase berhasil dihapus');
          navigate('/purchases');
        } else {
          toast.error(response.message || 'Gagal menghapus purchase');
        }
      } catch (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Gagal menghapus purchase');
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!purchase) return;
    
    try {
      const response = await apiService.updatePurchaseStatus(purchase.id, { status: newStatus });
      if (response.success) {
        toast.success(`Status purchase berhasil diubah ke ${newStatus}`);
        fetchPurchase(id!);
      } else {
        toast.error(response.message || 'Gagal mengubah status purchase');
      }
    } catch (error: any) {
      console.error('Error updating purchase status:', error);
      toast.error(error.response?.data?.message || 'Gagal mengubah status purchase');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      partial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sebagian' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Lunas' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const isSuperAdmin = user && (user.role === 'Super Admin' || user.role === 'super_admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Memuat data purchase...</p>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Purchase tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/purchases')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Kembali</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <EyeIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Detail Purchase #{purchase.invoice_number}
                </h1>
                {getStatusBadge(purchase.status)}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Update Buttons for Super Admin */}
              {isSuperAdmin && (
                <>
                  {purchase.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus('paid')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Mark as Paid
                    </button>
                  )}
                  {purchase.status !== 'cancelled' && (
                    <button
                      onClick={() => handleUpdateStatus('cancelled')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                </>
              )}
              
              {/* Action Buttons */}
              <button
                onClick={handleEdit}
                disabled={purchase.status === 'paid' && !isSuperAdmin}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              
              {isSuperAdmin && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
              
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PrinterIcon className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Purchase Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Purchase</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                <p className="text-sm text-gray-900">{purchase.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Purchase</label>
                <p className="text-sm text-gray-900">{formatDate(purchase.purchase_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(purchase.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dibuat oleh</label>
                <p className="text-sm text-gray-900">{purchase.user.name}</p>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Supplier</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Supplier</label>
                <p className="text-sm text-gray-900">{purchase.supplier.name}</p>
              </div>
              {purchase.supplier.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Telepon</label>
                  <p className="text-sm text-gray-900">{purchase.supplier.phone}</p>
                </div>
              )}
              {purchase.supplier.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Alamat</label>
                  <p className="text-sm text-gray-900">{purchase.supplier.address}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Outlet</label>
                <p className="text-sm text-gray-900">{purchase.outlet.name}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Pembayaran</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(purchase.total_amount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Paid Amount</label>
                <p className="text-sm text-gray-900">{formatCurrency(purchase.paid_amount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Remaining Amount</label>
                <p className="text-sm text-gray-900">{formatCurrency(purchase.remaining_amount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Daftar Produk ({purchase.purchase_items.length} item)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Harga Satuan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchase.purchase_items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                          <div className="text-sm text-gray-500">{item.product.unit.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{formatCurrency(item.total_price)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right font-medium text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(purchase.total_amount)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Catatan</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseDetail;
