import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import FinancialReportDashboard from '../components/reports/FinancialReportDashboard';
import EnhancedReportDashboard from '../components/reports/EnhancedReportDashboard';
import AdvancedReportDashboard from '../components/reports/AdvancedReportDashboard';

const ProfessionalReports: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as 'financial' | 'enhanced' | 'advanced' | null;
  const [reportMode, setReportMode] = useState<'financial' | 'enhanced' | 'advanced'>(
    modeFromUrl || 'enhanced'
  );

  // Update mode when URL changes
  useEffect(() => {
    if (modeFromUrl && ['financial', 'enhanced', 'advanced'].includes(modeFromUrl)) {
      setReportMode(modeFromUrl);
    }
  }, [modeFromUrl]);

  const reportModes = [
    {
      id: 'enhanced',
      name: 'Laporan Enhanced',
      description: 'Chart interaktif dan analisis mendalam',
      icon: ChartBarIcon,
      color: 'indigo'
    },
    {
      id: 'financial',
      name: 'Laporan Keuangan',
      description: 'Pendapatan, pengeluaran, dan laba rugi',
      icon: DocumentTextIcon,
      color: 'green'
    },
    {
      id: 'advanced',
      name: 'Business Intelligence',
      description: 'KPI, analytics, dan insights mendalam',
      icon: PresentationChartLineIcon,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      const activeColors = {
        blue: 'bg-blue-600 text-white',
        purple: 'bg-purple-600 text-white',
        green: 'bg-green-600 text-white',
        indigo: 'bg-indigo-600 text-white'
      };
      return activeColors[color as keyof typeof activeColors] || activeColors.blue;
    }
    const inactiveColors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };
    return inactiveColors[color as keyof typeof inactiveColors] || inactiveColors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            nav, header, button, .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-only {
              display: block !important;
            }
            .bg-white {
              background: white !important;
            }
            .shadow-sm, .shadow-md, .border {
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
            }
          }
        `}
      </style>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <ChartBarIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Laporan Profesional</h1>
              <p className="text-xs text-gray-500">Analisis performa bisnis Anda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mode Selector - Compact Tab Style */}
        <div className="mb-6 no-print">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {reportModes.map((mode) => {
                const Icon = mode.icon;
                const isActive = reportMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setReportMode(mode.id as 'financial' | 'enhanced' | 'advanced');
                      navigate(`/professional-reports?mode=${mode.id}`, { replace: true });
                    }}
                    className={`
                      flex-1 min-w-[200px] flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 font-medium text-sm
                      ${isActive
                        ? `${getColorClasses(mode.color, true)} shadow-md transform scale-[1.02]`
                        : `${getColorClasses(mode.color, false)} border hover:shadow-sm hover:scale-[1.01]`
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    <div className="text-left flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                        {mode.name}
                      </div>
                      {!isActive && (
                        <div className="text-xs opacity-75 truncate mt-0.5">
                          {mode.description}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Print Header - hanya muncul saat print */}
          <div className="hidden print-only mb-4 pb-4 border-b px-6 pt-6">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Profesional</h1>
            <p className="text-sm text-gray-600 mt-1">
              {reportMode === 'financial' && 'Laporan Keuangan'}
              {reportMode === 'enhanced' && 'Laporan Enhanced'}
              {reportMode === 'advanced' && 'Business Intelligence'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Dicetak pada: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
          
          {reportMode === 'financial' ? (
            <FinancialReportDashboard />
          ) : reportMode === 'advanced' ? (
            <AdvancedReportDashboard />
          ) : (
            <EnhancedReportDashboard />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalReports;
