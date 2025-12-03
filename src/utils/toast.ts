import { toast as hotToast } from 'react-hot-toast';

// Enhanced toast utility with consistent styling and behavior
export const toast = {
  success: (message: string, options?: any) => {
    return hotToast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return hotToast.error(message, {
      duration: 6000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return hotToast(message, {
      duration: 5000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return hotToast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return hotToast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) => {
    return hotToast.promise(promise, messages, {
      position: 'top-right',
      style: {
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '400px',
      },
      success: {
        style: {
          background: '#10B981',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      },
      error: {
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      },
      loading: {
        style: {
          background: '#6B7280',
          color: '#fff',
        },
      },
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    return hotToast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    return hotToast.remove(toastId);
  },
};

// API Error handler utility
export const handleApiError = (error: any, defaultMessage: string = 'Terjadi kesalahan') => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || defaultMessage;

  if (status === 401) {
    toast.error('Sesi telah berakhir, silakan login kembali');
    // Don't redirect here, let the API interceptor handle it
  } else if (status === 403) {
    toast.error('Akses ditolak: Anda tidak memiliki permission untuk melakukan aksi ini');
  } else if (status === 422) {
    const errors = error.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      // Show first validation error
      const firstError = Object.values(errors)[0];
      const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      toast.error(`Data tidak valid: ${errorMessage}`);
    } else {
      toast.error(`Data tidak valid: ${message}`);
    }
  } else if (status === 429) {
    toast.error('Terlalu banyak permintaan, coba lagi nanti');
  } else if (status >= 500) {
    toast.error(`Server error: ${message}`);
  } else if (!status) {
    toast.error('Tidak dapat terhubung ke server');
  } else {
    toast.error(`Error ${status}: ${message}`);
  }
};

export default toast;
