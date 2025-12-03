import React from 'react';

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange, loading = false }) => {
  if (pagination.total === 0) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (!loading && page >= 1 && page <= pagination.last_page) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      {/* Mobile view */}
      <div className="sm:hidden space-y-3">
        {/* Keterangan pagination untuk mobile */}
        <div className="text-center">
          <p className="text-sm text-gray-700">
            Menampilkan{' '}
            <span className="font-medium">
              {((pagination.current_page - 1) * pagination.per_page) + 1}
            </span>{' '}
            sampai{' '}
            <span className="font-medium">
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </span>{' '}
            dari{' '}
            <span className="font-medium">{pagination.total}</span> hasil
          </p>
        </div>
        {/* Tombol pagination mobile */}
        <div className="flex justify-between">
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page <= 1 || loading}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page >= pagination.last_page || loading}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Menampilkan{' '}
            <span className="font-medium">
              {((pagination.current_page - 1) * pagination.per_page) + 1}
            </span>{' '}
            sampai{' '}
            <span className="font-medium">
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </span>{' '}
            dari{' '}
            <span className="font-medium">{pagination.total}</span> hasil
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1 || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            
            {/* Always show page 1 */}
            {pagination.current_page > 3 && pagination.last_page > 5 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  1
                </button>
                {pagination.current_page > 4 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
              </>
            )}
            
            {/* Show pages around current page */}
            {Array.from({ length: pagination.last_page }, (_, i) => {
              const pageNum = i + 1;
              // Show pages: current-2, current-1, current, current+1, current+2
              // But only if they're within valid range and not already shown
              if (
                pageNum >= Math.max(1, pagination.current_page - 2) &&
                pageNum <= Math.min(pagination.last_page, pagination.current_page + 2) &&
                !(pagination.current_page > 3 && pagination.last_page > 5 && pageNum === 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === pagination.current_page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            
            {/* Show ellipsis and last page if needed */}
            {pagination.current_page < pagination.last_page - 2 && pagination.last_page > 5 && (
              <>
                {pagination.current_page < pagination.last_page - 3 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                <button
                  onClick={() => handlePageChange(pagination.last_page)}
                  disabled={loading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pagination.last_page}
                </button>
              </>
            )}
            
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

