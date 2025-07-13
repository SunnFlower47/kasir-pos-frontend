import React from 'react';
import { ArrowDownTrayIcon, PrinterIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ReportStats, TopProduct, ChartData } from '../../../hooks/useReportData';

interface ExportButtonsProps {
  stats: ReportStats | null;
  topProducts: TopProduct[];
  chartData: ChartData[];
  reportType: string;
  dateRange: string;
  loading?: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  stats,
  topProducts,
  chartData,
  reportType,
  dateRange,
  loading = false
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getReportTypeName = (reportType: string) => {
    switch (reportType) {
      case 'sales': return 'Penjualan';
      case 'purchases': return 'Pembelian';
      case 'stocks': return 'Stok';
      case 'profit': return 'Keuntungan';
      default: return 'Laporan';
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Laporan ${getReportTypeName(reportType).toUpperCase()}\n`;
      csvContent += `Periode: ${dateRange}\n`;
      csvContent += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;

      // Add summary data
      if (stats) {
        csvContent += "RINGKASAN METRIK\n";
        csvContent += "Metrik,Nilai\n";
        csvContent += `Total Revenue,${formatCurrency(stats.totalRevenue)}\n`;
        csvContent += `Total Transaksi,${formatNumber(stats.totalTransactions)}\n`;
        csvContent += `Total Customer,${formatNumber(stats.totalCustomers)}\n`;
        csvContent += `Total Produk,${formatNumber(stats.totalProducts)}\n`;
        csvContent += `Rata-rata Transaksi,${formatCurrency(stats.avgTransactionValue)}\n`;
        csvContent += `Pertumbuhan,${stats.growth.toFixed(1)}%\n\n`;
      }

      // Add chart data
      if (chartData.length > 0) {
        csvContent += "DATA CHART\n";
        csvContent += "Tanggal,Revenue,Transaksi\n";
        chartData.forEach(item => {
          csvContent += `${item.date},${item.revenue},${item.transactions}\n`;
        });
        csvContent += "\n";
      }

      // Add top products data
      if (topProducts.length > 0) {
        csvContent += `TOP ${getReportTypeName(reportType).toUpperCase()}\n`;

        // Dynamic headers based on report type
        if (reportType === 'sales') {
          csvContent += "Nama,Kategori,Terjual,Revenue\n";
          topProducts.forEach(product => {
            csvContent += `${product.name},${product.category_name || '-'},${product.total_sold || 0},${formatCurrency(product.total_revenue || 0)}\n`;
          });
        } else if (reportType === 'purchases') {
          csvContent += "Nama,Kategori,Dibeli,Total Pembelian\n";
          topProducts.forEach(product => {
            csvContent += `${product.name},${product.category_name || '-'},${product.total_sold || 0},${formatCurrency(product.total_amount || 0)}\n`;
          });
        } else if (reportType === 'stocks') {
          csvContent += "Nama,Kategori,Stok,Nilai Stok\n";
          topProducts.forEach(product => {
            csvContent += `${product.name},${product.category_name || '-'},${product.stock_quantity || 0},${formatCurrency(product.stock_value || 0)}\n`;
          });
        } else if (reportType === 'profit') {
          csvContent += "Nama,Kategori,Terjual,Profit\n";
          topProducts.forEach(product => {
            csvContent += `${product.name},${product.category_name || '-'},${product.total_sold || 0},${formatCurrency(product.profit_amount || 0)}\n`;
          });
        }
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `laporan_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data berhasil diexport ke CSV!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Gagal export data ke CSV');
    }
  };

  const handleExportHTML = () => {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan ${getReportTypeName(reportType)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .metric-value { font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan ${getReportTypeName(reportType)}</h1>
            <p><strong>Periode:</strong> ${dateRange}</p>
            <p><strong>Tanggal Export:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
      `;

      // Add summary data
      if (stats) {
        htmlContent += `
          <div class="summary">
            <h2>Ringkasan Metrik</h2>
            <table>
              <thead>
                <tr><th>Metrik</th><th>Nilai</th><th>Keterangan</th></tr>
              </thead>
              <tbody>
                <tr><td>Total Revenue</td><td class="metric-value">${formatCurrency(stats.totalRevenue)}</td><td>+${stats.growth.toFixed(1)}%</td></tr>
                <tr><td>Total Transaksi</td><td class="metric-value">${formatNumber(stats.totalTransactions)}</td><td>Periode ini</td></tr>
                <tr><td>Total Customer</td><td class="metric-value">${formatNumber(stats.totalCustomers)}</td><td>Terdaftar</td></tr>
                <tr><td>Total Produk</td><td class="metric-value">${formatNumber(stats.totalProducts)}</td><td>Aktif</td></tr>
                <tr><td>Rata-rata Transaksi</td><td class="metric-value">${formatCurrency(stats.avgTransactionValue)}</td><td>Per transaksi</td></tr>
              </tbody>
            </table>
          </div>
        `;
      }

      // Add top products data
      if (topProducts.length > 0) {
        htmlContent += `
          <div>
            <h2>Top ${getReportTypeName(reportType)}</h2>
            <table>
              <thead>
                <tr><th>Nama</th><th>Kategori</th><th>Terjual</th><th>Revenue</th></tr>
              </thead>
              <tbody>
        `;
        topProducts.forEach(product => {
          htmlContent += `
            <tr>
              <td>${product.name}</td>
              <td>${product.category_name}</td>
              <td>${formatNumber(product.total_sold)}</td>
              <td class="metric-value">${formatCurrency(product.total_revenue)}</td>
            </tr>
          `;
        });
        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Create blob and download as HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan_${reportType}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Laporan HTML berhasil didownload!');
    } catch (error) {
      console.error('Error exporting HTML:', error);
      toast.error('Gagal export laporan HTML');
    }
  };

  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup diblokir. Izinkan popup untuk print.');
        return;
      }

      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Laporan ${getReportTypeName(reportType)}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .metric-value { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan ${getReportTypeName(reportType)}</h1>
            <p>Periode: ${dateRange} | Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
      `;

      if (stats) {
        printContent += `
          <h2>Ringkasan Metrik</h2>
          <table>
            <tr><th>Metrik</th><th>Nilai</th></tr>
            <tr><td>Total Revenue</td><td class="metric-value">${formatCurrency(stats.totalRevenue)}</td></tr>
            <tr><td>Total Transaksi</td><td class="metric-value">${formatNumber(stats.totalTransactions)}</td></tr>
            <tr><td>Total Customer</td><td class="metric-value">${formatNumber(stats.totalCustomers)}</td></tr>
            <tr><td>Total Produk</td><td class="metric-value">${formatNumber(stats.totalProducts)}</td></tr>
          </table>
        `;
      }

      printContent += `
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast.success('Membuka dialog print...');
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Gagal membuka print dialog');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleExportCSV}
        disabled={!stats && topProducts.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export CSV
      </button>

      <button
        onClick={handleExportHTML}
        disabled={!stats && topProducts.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <DocumentTextIcon className="h-4 w-4" />
        Export HTML
      </button>

      <button
        onClick={handlePrint}
        disabled={!stats && topProducts.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <PrinterIcon className="h-4 w-4" />
        Print
      </button>
    </div>
  );
};

export default ExportButtons;
