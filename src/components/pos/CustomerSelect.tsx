import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { UserIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CustomerForm from '../customers/CustomerForm';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({
  selectedCustomer,
  onCustomerSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // No more mock data - 100% API backend

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getCustomers({ search: searchTerm || undefined });

      if (response.success && response.data) {
        const customers = response.data.data || response.data;
        setCustomers(Array.isArray(customers) ? customers : []);
      } else {
        setCustomers([]);
        toast.error('Gagal memuat data pelanggan');
      }
    } catch (error: any) {
      console.error('❌ Error fetching POS customers:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Gagal memuat data pelanggan';

      if (status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
      } else if (status === 403) {
        toast.error('Akses ditolak: Anda tidak memiliki permission untuk melihat data pelanggan');
      } else {
        toast.error(`Error ${status || 'Network'}: ${message}`);
      }

      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Refetch when search changes
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        fetchCustomers();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [fetchCustomers, searchTerm]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'platinum': return 'Platinum';
      case 'gold': return 'Gold';
      case 'silver': return 'Silver';
      default: return 'Bronze';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pelanggan
      </label>

      {/* Selected Customer Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        {selectedCustomer ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedCustomer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedCustomer.phone} • {selectedCustomer.loyalty_points} poin
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(selectedCustomer.level)}`}>
                {getLevelText(selectedCustomer.level)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomerSelect(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-500">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">Pilih pelanggan (opsional)</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pelanggan..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <>
                {/* General Customer Option */}
                <div
                  onClick={() => {
                    onCustomerSelect(null);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b"
                >
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Pelanggan Umum</span>
                  </div>
                </div>

                {/* Customer Options */}
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      onCustomerSelect(customer);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.phone} • {customer.loyalty_points} poin
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(customer.level)}`}>
                        {getLevelText(customer.level)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Tidak ada pelanggan ditemukan
              </div>
            )}
          </div>

          {/* Add New Customer Button */}
          <div className="p-3 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setShowAddCustomerModal(true);
              }}
              className="w-full py-2 px-3 text-sm text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors"
            >
              + Tambah Pelanggan Baru
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Add Customer Modal */}
      <CustomerForm
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={async () => {
          // Refresh customer list first
          await fetchCustomers();
          // Close modal
          setShowAddCustomerModal(false);
          // Note: CustomerForm already shows success toast, so we don't need to show it again
        }}
      />
    </div>
  );
};

export default CustomerSelect;
