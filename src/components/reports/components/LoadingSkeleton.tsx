import React from 'react';

interface LoadingSkeletonProps {
  type?: 'cards' | 'chart' | 'table' | 'full';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'full', count = 1 }) => {
  const renderCardsSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="text-center animate-pulse">
              <div className="p-3 bg-gray-200 rounded-lg mx-auto w-fit mb-3">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 4 }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {Array.from({ length: 4 }).map((_, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFullSkeleton = () => (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-6 px-2 sm:px-4">
        
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        {renderCardsSkeleton()}

        {/* Charts Skeleton */}
        {renderChartSkeleton()}

        {/* Table Skeleton */}
        {renderTableSkeleton()}

      </div>
    </div>
  );

  switch (type) {
    case 'cards':
      return renderCardsSkeleton();
    case 'chart':
      return renderChartSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'full':
    default:
      return renderFullSkeleton();
  }
};

export default LoadingSkeleton;
