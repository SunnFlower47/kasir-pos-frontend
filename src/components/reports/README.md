# 📊 Report Dashboard - Modular Architecture

## 🎯 Overview

Sistem laporan yang telah direfactor dari monolithic (1677+ lines) menjadi modular architecture dengan 8 komponen terpisah yang reusable dan maintainable.

## 📁 File Structure

```
src/
├── hooks/
│   └── useReportData.ts          # Custom hook untuk data management
└── components/reports/
    ├── ReportDashboardMain.tsx   # Main component (250 lines)
    └── components/
        ├── SummaryCards.tsx      # Stats cards component
        ├── DateRangeSelector.tsx # Date filter component
        ├── ReportTypeSelector.tsx# Report type selector
        ├── TopProductChart.tsx   # Charts component
        ├── ExportButtons.tsx     # Export functionality
        ├── TopProductsTable.tsx  # Data table component
        ├── ErrorBoundary.tsx     # Error handling
        └── LoadingSkeleton.tsx   # Loading states
```

## 🔧 Custom Hook: useReportData

### Purpose
Mengelola semua state, API calls, dan data processing untuk report dashboard.

### Features
- ✅ Data management (stats, topProducts, chartData, outlets)
- ✅ Filter management (dateRange, outlet, reportType, etc.)
- ✅ API calls dengan error handling
- ✅ Auto-refresh saat filter berubah
- ✅ Date calculations
- ✅ Data processing dan transformasi

### Usage
```typescript
const {
  loading, stats, topProducts, chartData, outlets,
  filters, setFilters, refreshData
} = useReportData();
```

## 🎨 Modular Components

### 1. SummaryCards.tsx
**Purpose:** Menampilkan ringkasan metrik dalam bentuk cards

**Props:**
- `stats: ReportStats | null` - Data statistik
- `reportType: string` - Jenis laporan (sales/purchases/stocks/profit)
- `loading?: boolean` - Loading state

**Features:**
- ✅ Dynamic labels berdasarkan report type
- ✅ Currency dan number formatting
- ✅ Loading skeleton
- ✅ Empty states
- ✅ Growth indicators dengan icons

### 2. DateRangeSelector.tsx
**Purpose:** Handle pemilihan periode laporan

**Props:**
- `filters: ReportFilters` - Current filters
- `onFiltersChange: (filters: Partial<ReportFilters>) => void` - Filter change handler

**Features:**
- ✅ Predefined ranges (today, week, month, year)
- ✅ Custom date picker
- ✅ Period info display
- ✅ Responsive design

### 3. ReportTypeSelector.tsx
**Purpose:** Pemilihan jenis laporan

**Props:**
- `filters: ReportFilters` - Current filters
- `onFiltersChange: (filters: Partial<ReportFilters>) => void` - Filter change handler
- `onRefresh?: () => void` - Refresh callback

**Features:**
- ✅ Visual report type buttons
- ✅ Report descriptions
- ✅ Toast notifications
- ✅ Auto-refresh on change

### 4. TopProductChart.tsx
**Purpose:** Menampilkan charts dan grafik

**Props:**
- `chartData: ChartData[]` - Data untuk line chart
- `topProducts: TopProduct[]` - Data untuk pie chart
- `reportType: string` - Jenis laporan
- `loading?: boolean` - Loading state

**Features:**
- ✅ Line chart dengan Recharts
- ✅ Pie chart untuk top products
- ✅ Responsive containers
- ✅ Custom tooltips
- ✅ Dynamic colors per report type

### 5. ExportButtons.tsx
**Purpose:** Export data ke berbagai format

**Props:**
- `stats: ReportStats | null` - Data statistik
- `topProducts: TopProduct[]` - Data produk
- `chartData: ChartData[]` - Data chart
- `reportType: string` - Jenis laporan
- `dateRange: string` - Periode
- `loading?: boolean` - Loading state

**Features:**
- ✅ Export CSV dengan formatting
- ✅ Export HTML dengan styling
- ✅ Print functionality
- ✅ Error handling
- ✅ Toast notifications

### 6. TopProductsTable.tsx
**Purpose:** Menampilkan tabel data detail

**Props:**
- `topProducts: TopProduct[]` - Data produk
- `reportType: string` - Jenis laporan
- `loading?: boolean` - Loading state

**Features:**
- ✅ Dynamic columns per report type
- ✅ Responsive table
- ✅ Status indicators
- ✅ Number formatting
- ✅ Loading skeleton

### 7. ErrorBoundary.tsx
**Purpose:** Error handling untuk komponen

**Features:**
- ✅ Catch JavaScript errors
- ✅ User-friendly error display
- ✅ Retry functionality
- ✅ Error details untuk debugging

### 8. LoadingSkeleton.tsx
**Purpose:** Loading states yang lebih baik

**Props:**
- `type?: 'cards' | 'chart' | 'table' | 'full'` - Jenis skeleton
- `count?: number` - Jumlah items

**Features:**
- ✅ Multiple skeleton types
- ✅ Animated placeholders
- ✅ Responsive design

## 🚀 Usage Examples

### Basic Usage
```typescript
import ReportDashboard from './components/reports/ReportDashboardMain';

function App() {
  return <ReportDashboard />;
}
```

### Using Individual Components
```typescript
import { useReportData } from './hooks/useReportData';
import SummaryCards from './components/reports/components/SummaryCards';

function CustomReport() {
  const { stats, loading, filters } = useReportData();
  
  return (
    <SummaryCards 
      stats={stats} 
      reportType={filters.reportType} 
      loading={loading} 
    />
  );
}
```

## 🔧 Development Guidelines

### Adding New Components
1. Create component in `/components/reports/components/`
2. Follow TypeScript interfaces from `useReportData.ts`
3. Add proper error handling
4. Include loading states
5. Make it responsive
6. Add to main ReportDashboard

### Modifying Data Logic
1. Update `useReportData.ts` hook
2. Update TypeScript interfaces
3. Test all dependent components
4. Update documentation

### Testing
```bash
# Run TypeScript check
npm run type-check

# Run tests
npm test

# Check for unused exports
npm run lint
```

## 📊 Performance Metrics

### Before Refactor
- ❌ 1 file - 1677+ lines
- ❌ Monolithic structure
- ❌ Hard to maintain
- ❌ Not reusable
- ❌ Complex dependencies

### After Refactor
- ✅ 8 files - avg 200 lines each
- ✅ Modular architecture
- ✅ Easy to maintain
- ✅ Highly reusable
- ✅ Clean dependencies
- ✅ 88% code reduction per file

## 🎯 Benefits

### For Developers
- 🔧 **Maintainable** - Easy to find and fix bugs
- ⚡ **Fast Development** - Parallel component development
- 🧪 **Testable** - Unit test each component
- 📖 **Readable** - Clear separation of concerns
- 🔄 **Reusable** - Components can be used elsewhere

### For Users
- ⚡ **Same Performance** - No performance impact
- 🎯 **Same Features** - All features preserved
- 📱 **Better UX** - Improved loading states
- 🔄 **More Reliable** - Better error handling

## 🔮 Future Enhancements

- [ ] Add unit tests for each component
- [ ] Add Storybook documentation
- [ ] Add more chart types
- [ ] Add real-time data updates
- [ ] Add data caching
- [ ] Add offline support
