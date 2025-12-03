/**
 * Centralized error handling utility
 * Provides consistent error messages across the application
 */

export interface ErrorInfo {
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: any): ErrorInfo => {
  // Handle axios errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    return {
      status,
      message: data?.message || getDefaultErrorMessage(status),
      errors: data?.errors
    };
  }

  // Handle network errors
  if (error.request) {
    return {
      message: 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.'
    };
  }

  // Handle other errors
  return {
    message: error.message || 'Terjadi kesalahan yang tidak diketahui'
  };
};

const getDefaultErrorMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Permintaan tidak valid',
    401: 'Sesi telah berakhir, silakan login kembali',
    403: 'Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini.',
    404: 'Data tidak ditemukan',
    422: 'Data tidak valid. Silakan periksa kembali form yang Anda isi.',
    429: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
    500: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
    502: 'Server sedang dalam pemeliharaan. Silakan coba lagi nanti.',
    503: 'Layanan tidak tersedia. Silakan coba lagi nanti.'
  };

  return messages[status] || `Terjadi kesalahan (${status})`;
};

export const handleValidationErrors = (
  errors: Record<string, string[]> | undefined
): Record<string, string> => {
  if (!errors) return {};

  const formattedErrors: Record<string, string> = {};
  Object.keys(errors).forEach(key => {
    if (Array.isArray(errors[key]) && errors[key].length > 0) {
      formattedErrors[key] = errors[key][0];
    }
  });

  return formattedErrors;
};

