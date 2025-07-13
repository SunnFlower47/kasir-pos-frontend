import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

interface StockAdjustmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [formData, setFormData] = useState({
    product_id: 0,
    outlet_id: 0,
    current_quantity: 0,
    new_quantity: 0,
    notes: ''
  });

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

  const fetchCurrentStock = async (productId: number, outletId: number) => {
    if (!productId || !outletId) return;

    try {
      const response = await apiService.getStocks({ product_id: productId, outlet_id: outletId });
      if (response.success && response.data) {
        const stocks = response.data.data || response.data;
        const stock = stocks.find((s: any) => s.product_id === productId && s.outlet_id === outletId);

        setFormData(prev => ({
          ...prev,
          current_quantity: stock ? stock.quantity : 0
        }));
      }
    } catch (error) {
      console.error('Error fetching current stock:', error);
      setFormData(prev => ({ ...prev, current_quantity: 0 }));
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: 0,
      outlet_id: 0,
      current_quantity: 0,
      new_quantity: 0,
      notes: ''
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name.includes('quantity') || name.includes('_id') ? parseInt(value) || 0 : value
    }));

    // Fetch current stock when both product and outlet are selected
    if (name === 'product_id' || name === 'outlet_id') {
      const productId = name === 'product_id' ? parseInt(value) : formData.product_id;
      const outletId = name === 'outlet_id' ? parseInt(value) : formData.outlet_id;

      if (productId && outletId) {
        fetchCurrentStock(productId, outletId);
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }

    if (!formData.outlet_id) {
      newErrors.outlet_id = 'Outlet is required';
    }

    if (formData.new_quantity < 0) {
      newErrors.new_quantity = 'New quantity cannot be negative';
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required for stock adjustment';
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
      console.log('🔄 Adjusting stock:', formData);

      const response = await apiService.adjustStock({
        product_id: formData.product_id,
        outlet_id: formData.outlet_id,
        new_quantity: formData.new_quantity,
        notes: formData.notes
      });

      if (response.success) {
        const difference = formData.new_quantity - formData.current_quantity;
        const action = difference > 0 ? 'increased' : 'decreased';

        toast.success(`Stock ${action} successfully. Difference: ${Math.abs(difference)}`);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to adjust stock');
      }
    } catch (error: any) {
      console.error('❌ Stock adjustment error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to adjust stock';

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

  const difference = formData.new_quantity - formData.current_quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Stock Adjustment
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.product_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={0}>Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
          </div>

          {/* Outlet Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outlet *
            </label>
            <select
              name="outlet_id"
              value={formData.outlet_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.outlet_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={0}>Select Outlet</option>
              {outlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            {errors.outlet_id && <p className="text-red-500 text-xs mt-1">{errors.outlet_id}</p>}
          </div>

          {/* Current Stock Display */}
          {formData.product_id && formData.outlet_id && (
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {formData.current_quantity} units
              </div>
            </div>
          )}

          {/* New Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Quantity *
            </label>
            <input
              type="number"
              name="new_quantity"
              value={formData.new_quantity}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.new_quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new quantity"
            />
            {errors.new_quantity && <p className="text-red-500 text-xs mt-1">{errors.new_quantity}</p>}
          </div>

          {/* Difference Display */}
          {formData.product_id && formData.outlet_id && formData.new_quantity !== formData.current_quantity && (
            <div className={`p-3 rounded-md ${
              difference > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-sm font-medium">
                Adjustment: {difference > 0 ? '+' : ''}{difference} units
              </div>
              <div className="text-xs text-gray-600">
                {difference > 0 ? 'Stock will be increased' : 'Stock will be decreased'}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes *
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Reason for stock adjustment..."
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={loading || !formData.product_id || !formData.outlet_id}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Adjust Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;
