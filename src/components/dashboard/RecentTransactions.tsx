import React from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '../../types';
import {
  EyeIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <BanknotesIcon className="h-4 w-4" />;
      case 'transfer':
        return <CreditCardIcon className="h-4 w-4" />;
      case 'qris':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'e_wallet':
        return <WalletIcon className="h-4 w-4" />;
      default:
        return <BanknotesIcon className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'transfer':
        return 'Transfer';
      case 'qris':
        return 'QRIS';
      case 'e_wallet':
        return 'E-Wallet';
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Selesai
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Dibatalkan
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Refund
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Transaksi Terbaru</h3>
        <Link
          to="/transactions"
          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.transaction_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.total_amount)}
                    </p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        {getPaymentIcon(transaction.payment_method)}
                        <span className="ml-1">{getPaymentLabel(transaction.payment_method)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(transaction.status)}
                    {transaction.customer && (
                      <span className="text-xs text-gray-500">
                        {transaction.customer.name}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/transactions/${transaction.id}`}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
