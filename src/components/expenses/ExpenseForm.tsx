import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface Outlet {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  outlet_id: number;
  expense_date: string;
  category: string | null;
  description: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'qris' | 'ewallet';
  notes?: string;
}

interface ExpenseFormData {
  outlet_id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: string;
  payment_method: 'cash' | 'transfer' | 'qris' | 'ewallet';
  notes: string;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: Expense;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSuccess, expense }) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    outlet_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOutlets();

      if (expense) {
        setFormData({
          outlet_id: expense.outlet_id.toString(),
          expense_date: expense.expense_date.split('T')[0],
          category: expense.category || '',
          description: expense.description,
          amount: expense.amount.toString(),
          payment_method: expense.payment_method,
          notes: expense.notes || ''
        });
      } else {
        setFormData({
          outlet_id: '',
          expense_date: new Date().toISOString().split('T')[0],
          category: '',
          description: '',
          amount: '',
          payment_method: 'cash',
          notes: ''
        });
      }
    }
  }, [isOpen, expense]);

  const fetchOutlets = async () => {
    try {
      const response = await apiService.getOutlets();
      if (response.success && response.data) {
        const outletsData = response.data.data || response.data;
        setOutlets(Array.isArray(outletsData) ? outletsData : []);
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.outlet_id || !formData.description || !formData.amount) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        outlet_id: parseInt(formData.outlet_id),
        expense_date: formData.expense_date,
        category: formData.category || null,
        description: formData.description,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        notes: formData.notes || null
      };

      if (expense) {
        await apiService.updateExpense(expense.id, submitData);
        toast.success('Pengeluaran berhasil diperbarui');
      } else {
        await apiService.createExpense(submitData);
        toast.success('Pengeluaran berhasil dibuat');
      }

      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal menyimpan pengeluaran';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const commonCategories = [
    'Sewa',
    'Gaji',
    'Listrik',
    'Air',
    'Internet',
    'Telepon',
    'Transportasi',
    'Pemeliharaan',
    'Promosi',
    'Pajak',
    'Asuransi',
    'Lainnya'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Outlet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet <span className="text-red-500">*</span>
              </label>
              <select
                name="outlet_id"
                value={formData.outlet_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Contoh: Pembayaran sewa bulanan"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {commonCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Atau ketik kategori baru</p>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Ketik kategori baru..."
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Tunai</option>
                <option value="transfer">Transfer</option>
                <option value="qris">QRIS</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : expense ? 'Perbarui' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;

