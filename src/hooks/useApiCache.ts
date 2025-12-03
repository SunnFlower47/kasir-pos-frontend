import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  useLocalStorage?: boolean; // Flag untuk data yang perlu di-persist
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly localStoragePrefix = 'api_cache_';
  private readonly maxLocalStorageSize = 5 * 1024 * 1024; // 5MB max

  set<T>(key: string, data: T, ttl: number = this.defaultTTL, useLocalStorage: boolean = false): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiry: now + ttl,
      useLocalStorage
    };

    // Set in-memory cache
    this.cache.set(key, entry);

    // Persist to localStorage if enabled
    if (useLocalStorage) {
      try {
        const serialized = JSON.stringify(entry);
        const storageKey = this.localStoragePrefix + key;
        
        // Check size before storing (avoid quota exceeded)
        if (serialized.length < this.maxLocalStorageSize) {
          localStorage.setItem(storageKey, serialized);
        } else {
          console.warn(`⚠️ Cache entry too large for localStorage: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to persist cache to localStorage for key: ${key}`, error);
      }
    }
  }

  get<T>(key: string): T | null {
    const now = Date.now();
    
    // Check in-memory cache first
    let entry = this.cache.get(key);
    
    // If not in memory, check localStorage
    if (!entry) {
      try {
        const storageKey = this.localStoragePrefix + key;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          entry = JSON.parse(stored);
          // Restore to memory cache
          if (entry && now <= entry.expiry) {
            this.cache.set(key, entry);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load cache from localStorage for key: ${key}`, error);
      }
    }

    if (!entry) return null;

    // Check expiry
    if (now > entry.expiry) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null;
  }

  clear(pattern?: string): void {
    if (pattern) {
      // Clear matching keys
      const keysToDelete: string[] = [];
      
      // Clear from memory
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.delete(key));
      
      // Clear from localStorage
      try {
        const storageKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.localStoragePrefix) && key.includes(pattern)) {
            storageKeys.push(key);
          }
        }
        storageKeys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('⚠️ Failed to clear localStorage cache pattern:', error);
      }
    } else {
      // Clear all
      this.cache.clear();
      
      // Clear all from localStorage
      try {
        const keysToDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.localStoragePrefix)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('⚠️ Failed to clear localStorage cache:', error);
      }
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
    
    // Remove from localStorage
    try {
      const storageKey = this.localStoragePrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`⚠️ Failed to delete cache from localStorage for key: ${key}`, error);
    }
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries (call periodically)
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

const apiCache = new ApiCache();

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
    useLocalStorage?: boolean; // Persist to localStorage
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    refetchOnMount = false,
    useLocalStorage = false
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      // Check cache first
      if (!refetchOnMount && apiCache.has(key)) {
        const cachedData = apiCache.get<T>(key);
        if (cachedData && mountedRef.current) {
          setData(cachedData);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        
        if (mountedRef.current) {
          setData(result);
          apiCache.set(key, result, ttl, useLocalStorage);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [key, enabled, refetchOnMount, ttl, useLocalStorage]);

  const refetch = async () => {
    apiCache.delete(key);
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        apiCache.set(key, result, ttl, useLocalStorage);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return { data, loading, error, refetch };
}

// Cache invalidation helpers
export function invalidateCache(pattern: string): void {
  apiCache.clear(pattern);
}

export function invalidateAllCache(): void {
  apiCache.clear();
}

// Clean expired entries periodically (call on app init)
export function startCacheCleanup(interval: number = 60 * 1000): () => void {
  const cleanupInterval = setInterval(() => {
    apiCache.cleanExpired();
  }, interval);

  return () => clearInterval(cleanupInterval);
}

export { apiCache };
