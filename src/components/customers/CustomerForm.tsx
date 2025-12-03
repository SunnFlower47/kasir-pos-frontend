import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import { invalidateCustomerCache } from '../../utils/cacheInvalidation';
import { useLoyaltySettings } from '../../hooks/useLoyaltySettings';

interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  level: 'level1' | 'level2' | 'level3' | 'level4' | 'bronze' | 'silver' | 'gold' | 'platinum';
  is_active: boolean;
}

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ isOpen, onClose, onSuccess, customer }) => {
  const { getLevelOptions } = useLoyaltySettings();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    gender: undefined,
    level: 'level1', // Default to level1 for new customers (0 points)
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        // Map old level format (bronze, silver, gold, platinum) to new format (level1-4)
        const levelMap: Record<string, string> = {
          'bronze': 'level1',
          'silver': 'level2',
          'gold': 'level3',
          'platinum': 'level4',
        };
        const mappedLevel = levelMap[customer.level] || customer.level;
        
        setFormData({
          ...customer,
          level: mappedLevel as any,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          birth_date: customer.birth_date || '',
          gender: customer.gender || undefined
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, customer]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      birth_date: '',
      gender: undefined,
      level: 'level1',
      is_active: true
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-+()]+$/;
      if (!phoneRegex.test(formData.phone) || formData.phone.length < 10) {
        newErrors.phone = 'Please enter a valid phone number (min 10 digits)';
      }
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
      // Ensure level is valid (should be level1-4, or map old format)
      let validLevel: 'level1' | 'level2' | 'level3' | 'level4' = formData.level as 'level1' | 'level2' | 'level3' | 'level4';
      const levelMap: Record<string, 'level1' | 'level2' | 'level3' | 'level4'> = {
        'bronze': 'level1',
        'silver': 'level2',
        'gold': 'level3',
        'platinum': 'level4',
      };
      if (validLevel && levelMap[validLevel]) {
        validLevel = levelMap[validLevel];
      }
      // Default to level1 if level is invalid or empty
      if (!validLevel || !['level1', 'level2', 'level3', 'level4'].includes(validLevel)) {
        validLevel = 'level1';
      }

      const submitData = {
        ...formData,
        level: validLevel,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        birth_date: formData.birth_date?.trim() || undefined,
        gender: formData.gender || undefined
      };

      let response;
      if (customer?.id) {
        response = await apiService.updateCustomer(customer.id, submitData);
      } else {
        response = await apiService.createCustomer(submitData);
      }

      if (response.success) {
        toast.success(customer?.id ? 'Customer updated successfully' : 'Customer created successfully');
        // Invalidate cache before calling onSuccess
        invalidateCustomerCache();
        onSuccess(); // Callback after successful save
        onClose();
      } else {
        toast.error(response.message || 'Failed to save customer');
      }
    } catch (error: any) {
      console.error('❌ Customer form error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to save customer';

      // Handle validation errors
      if (status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};

        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0]; // Get first error message
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 md:p-3 border-b flex-shrink-0">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            {customer?.id ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-2.5 md:p-3 space-y-2.5 md:space-y-3 overflow-y-auto flex-1">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="customer@example.com"
            />
            {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="08123456789"
            />
            {errors.phone && <p className="text-red-500 text-[10px] mt-0.5">{errors.phone}</p>}
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Customer Level */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Customer Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {getLevelOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter customer address"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-xs text-gray-700">
              Active Customer
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-1.5 md:gap-2 pt-2.5 md:pt-3 border-t flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 text-xs md:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 md:h-4 md:w-4 border-b-2 border-white mr-1.5"></div>
              )}
              {customer?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
