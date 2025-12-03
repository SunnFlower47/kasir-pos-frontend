import { useEffect, useRef, useCallback } from 'react';
import { handleApiError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

/**
 * Custom hook untuk handle API requests dengan abort controller
 * Mencegah race conditions dan memory leaks
 */
export const useApiRequest = <T>(
  apiCall: (signal?: AbortSignal) => Promise<T>,
  dependencies: any[],
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    showErrorToast?: boolean;
  }
) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const data = await apiCall(signal);

      if (signal.aborted || !isMountedRef.current) {
        return;
      }

      if (options?.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    } catch (error: any) {
      if (signal.aborted || !isMountedRef.current) {
        return;
      }

      const errorInfo = handleApiError(error);
      
      if (options?.showErrorToast !== false) {
        toast.error(errorInfo.message);
      }

      if (options?.onError) {
        options.onError(error as Error);
      }

      throw error;
    }
  }, dependencies);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return execute;
};

