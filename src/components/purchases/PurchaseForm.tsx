import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  unit: {
    name: string;
  };
}

interface Supplier {
  id: number;
  name: string;
}

interface Outlet {
  id: number;
  name: string;
}

interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

interface PurchaseFormData {
  supplier_id: string;
  outlet_id: string;
  purchase_date: string;
  reference_number: string;
  notes: string;
  items: PurchaseItem[];
}

interface Purchase {
  id: number;
  supplier_id?: number;
  outlet_id?: number;
  supplier?: {
    id: number;
    name: string;
  };
  outlet?: {
    id: number;
    name: string;
  };
  purchase_date: string;
  notes?: string;
  purchase_items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: Product;
  }>;
}

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase?: Purchase | null; // For edit mode
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ isOpen, onClose, onSuccess, purchase }) => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: '',
    outlet_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      fetchOutlets();
      fetchProducts();

      // Populate form data for edit mode
      if (purchase) {
        // Handle both formats: direct IDs or nested objects
        const supplierId = purchase.supplier_id || purchase.supplier?.id;
        const outletId = purchase.outlet_id || purchase.outlet?.id;

        setFormData({
          supplier_id: supplierId ? supplierId.toString() : '',
          outlet_id: outletId ? outletId.toString() : '',
          purchase_date: purchase.purchase_date.split('T')[0],
          reference_number: '',
          notes: purchase.notes || '',
          items: purchase.purchase_items.map(item => ({
            product_id: item.product_id.toString(),
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product: item.product
          }))
        });
      } else {
        // Reset form for create mode
        setFormData({
          supplier_id: '',
          outlet_id: '',
          purchase_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: '',
          items: [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
        });
      }
    }
  }, [isOpen, purchase]);

  const fetchSuppliers = async () => {
    try {
      const response = await apiService.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await apiService.get('/outlets');
      setOutlets(response.data.data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value as string));
      if (product) {
        newItems[index].unit_price = product.purchase_price;
        newItems[index].product = product;
      }
    }

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const items = formData?.items;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some(item => !item.product_id)
  ) {
    toast.error('Minimal harus ada 1 item dengan produk yang dipilih');
    return;
  }
    setLoading(true);
    try {
      const submitData = {
        supplier_id: parseInt(formData.supplier_id),
        outlet_id: parseInt(formData.outlet_id),
        purchase_date: formData.purchase_date,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      if (purchase) {
        // Update existing purchase
        await apiService.updatePurchase(purchase.id, submitData);
        toast.success('Purchase order berhasil diupdate');
      } else {
        // Create new purchase
        await apiService.createPurchase(submitData);
        toast.success('Purchase order berhasil dibuat');
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        supplier_id: '',
        outlet_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
        items: [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
      });
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat purchase order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {purchase ? 'Edit Purchase Order' : 'Buat Purchase Order'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet Tujuan *
                </label>
                <select
                  value={formData.outlet_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, outlet_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Outlet</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembelian *
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Nomor invoice supplier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Items Pembelian</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tambah Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produk *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Pilih Produk</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Satuan *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(item.total_price)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="w-full px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Catatan tambahan untuk purchase order ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Total */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Pembelian:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Buat Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
