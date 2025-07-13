import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface Outlet {
  id: number;
  name: string;
}

interface TransferItem {
  product_id: number;
  quantity: number;
  available_stock: number;
}

interface StockTransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StockTransferForm: React.FC<StockTransferFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [formData, setFormData] = useState({
    from_outlet_id: 0,
    to_outlet_id: 0,
    notes: ''
  });

  const [items, setItems] = useState<TransferItem[]>([
    { product_id: 0, quantity: 0, available_stock: 0 }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchOutlets();
      resetForm();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await apiService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await apiService.getOutlets();
      if (response.success && response.data) {
        setOutlets(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchAvailableStock = async (productId: number, outletId: number, itemIndex: number) => {
    if (!productId || !outletId) return;

    try {
      const response = await apiService.getStocks({ product_id: productId, outlet_id: outletId });
      if (response.success && response.data) {
        const stocks = response.data.data || response.data;
        const stock = stocks.find((s: any) => s.product_id === productId && s.outlet_id === outletId);

        setItems(prev => prev.map((item, index) =>
          index === itemIndex
            ? { ...item, available_stock: stock ? stock.quantity : 0 }
            : item
        ));
      }
    } catch (error) {
      console.error('Error fetching available stock:', error);
      setItems(prev => prev.map((item, index) =>
        index === itemIndex
          ? { ...item, available_stock: 0 }
          : item
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      from_outlet_id: 0,
      to_outlet_id: 0,
      notes: ''
    });
    setItems([{ product_id: 0, quantity: 0, available_stock: 0 }]);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) || 0 : value
    }));

    // Update available stock for all items when from_outlet changes
    if (name === 'from_outlet_id') {
      const outletId = parseInt(value);
      items.forEach((item, index) => {
        if (item.product_id && outletId) {
          fetchAvailableStock(item.product_id, outletId, index);
        }
      });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));

    // Fetch available stock when product changes
    if (field === 'product_id' && value && formData.from_outlet_id) {
      fetchAvailableStock(value, formData.from_outlet_id, index);
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_id: 0, quantity: 0, available_stock: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.from_outlet_id) {
      newErrors.from_outlet_id = 'Source outlet is required';
    }

    if (!formData.to_outlet_id) {
      newErrors.to_outlet_id = 'Destination outlet is required';
    }

    if (formData.from_outlet_id === formData.to_outlet_id && formData.from_outlet_id !== 0) {
      newErrors.to_outlet_id = 'Destination outlet must be different from source outlet';
    }

    // Validate items
    let hasValidItems = false;
    items.forEach((item, index) => {
      if (item.product_id && item.quantity > 0) {
        hasValidItems = true;

        if (item.quantity > item.available_stock) {
          newErrors[`item_${index}_quantity`] = `Quantity exceeds available stock (${item.available_stock})`;
        }
      }
    });

    if (!hasValidItems) {
      newErrors.items = 'At least one item with valid product and quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const validItems = items.filter(item => item.product_id && item.quantity > 0);

      console.log('🔄 Transferring stock:', {
        ...formData,
        items: validItems
      });

      const response = await apiService.transferStock({
        from_outlet_id: formData.from_outlet_id,
        to_outlet_id: formData.to_outlet_id,
        items: validItems,
        notes: formData.notes
      });

      if (response.success) {
        toast.success('Stock transferred successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to transfer stock');
      }
    } catch (error: any) {
      console.error('❌ Stock transfer error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to transfer stock';

      if (status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};

        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0];
        });

        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Stock Transfer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Outlet Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Outlet *
              </label>
              <select
                name="from_outlet_id"
                value={formData.from_outlet_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_outlet_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select Source Outlet</option>
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              {errors.from_outlet_id && <p className="text-red-500 text-xs mt-1">{errors.from_outlet_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Outlet *
              </label>
              <select
                name="to_outlet_id"
                value={formData.to_outlet_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.to_outlet_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select Destination Outlet</option>
                {outlets.filter(outlet => outlet.id !== formData.from_outlet_id).map(outlet => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              {errors.to_outlet_id && <p className="text-red-500 text-xs mt-1">{errors.to_outlet_id}</p>}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Items to Transfer *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="0"
                      max={item.available_stock}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Qty"
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div className="w-20 text-sm text-gray-600">
                    Stock: {item.available_stock}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transfer notes (optional)..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.from_outlet_id || !formData.to_outlet_id}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Transfer Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferForm;
