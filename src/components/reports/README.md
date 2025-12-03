# Struktur Laporan Kasir POS

## File Report yang Digunakan:

### 1. ProfessionalReports.tsx (di pages/)
- **Route**: `/professional-reports`
- **Fungsi**: Halaman utama untuk memilih mode laporan
- **Mode**:
  - Enhanced: Laporan dengan chart interaktif dan filter lanjutan
  - Financial: Laporan keuangan lengkap
  - Advanced: Business Intelligence

### 2. EnhancedReportDashboard.tsx
- **Fungsi**: Laporan enhanced dengan chart interaktif dan filter lanjutan
- **Endpoint**: `/reports/enhanced`
- **Fitur**:
  - Multiple chart types (Area, Bar, Pie, Line)
  - Advanced filters (tanggal, outlet, periode)
  - Tab-based navigation (Overview, Revenue, Products, Customers, Analytics)
  - Daily/Monthly/Yearly revenue analysis
  - Top products and categories
  - Customer segmentation
  - Payment method analysis

### 3. FinancialReportDashboard.tsx
- **Fungsi**: Laporan keuangan lengkap
- **Endpoint**: `/reports/financial/comprehensive`
- **Fitur**:
  - Revenue analysis (dengan refund tracking)
  - Expenses breakdown (purchase + operational)
  - Cost of Goods Sold (COGS)
  - Profit & Loss analysis
  - Cash flow analysis
  - Financial ratios
  - Monthly/quarterly/yearly reports
  - Export PDF/Excel

### 4. AdvancedReportDashboard.tsx
- **Fungsi**: Laporan Business Intelligence
- **Endpoint**: `/reports/business-intelligence`
- **Fitur**:
  - KPI metrics (Revenue, Transactions, Customers, Products)
  - Revenue analytics dan trends
  - Customer analytics (segmentation, loyalty)
  - Product performance (best sellers, slow movers)
  - Operational metrics
  - Financial health indicators
  - Peak hours analysis

## Struktur Route:
```
/reports → EnhancedReportDashboard
/reports/financial → FinancialReportDashboard
/professional-reports → ProfessionalReports (dengan 3 mode)
```

## Optimasi:
- Semua komponen menggunakan lazy loading
- Debounced search untuk performa
- API caching untuk mengurangi request
- Virtual scrolling untuk list besar
