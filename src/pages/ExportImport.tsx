import React, { useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ExportSection from '../components/exportImport/ExportSection';
import ImportSection from '../components/exportImport/ImportSection';
import TemplateDownload from '../components/exportImport/TemplateDownload';

const ExportImport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'template'>('export');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export & Import Data</h1>
          <p className="text-sm text-gray-500 mt-1">
            Export data ke Excel/PDF atau import data dari file Excel
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('export')}
            className={`${
              activeTab === 'export'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`${
              activeTab === 'import'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            Import Data
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`${
              activeTab === 'template'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download Template
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'export' ? (
          <ExportSection />
        ) : activeTab === 'import' ? (
          <ImportSection />
        ) : (
          <TemplateDownload />
        )}
      </div>
    </div>
  );
};

export default ExportImport;

