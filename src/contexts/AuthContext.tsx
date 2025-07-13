import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          console.log('🔄 Checking stored auth...');
          const parsedUser = JSON.parse(userData);

          // Validate and fix user data structure
          const validateUserData = (user: any) => {
            if (!user || typeof user !== 'object') {
              return null;
            }

            // Ensure roles is always an array
            if (!user.roles || !Array.isArray(user.roles)) {
              user.roles = [];
            }

            // Ensure each role has permissions array
            user.roles = user.roles.map((role: any) => {
              if (!role || typeof role !== 'object') {
                return { name: 'Unknown', permissions: [] };
              }
              if (!role.permissions || !Array.isArray(role.permissions)) {
                role.permissions = [];
              }
              return role;
            });

            return user;
          };

          // Verify token with API
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            console.log('✅ Auth verified with API');
            const validatedUser = validateUserData(response.data.user);
            if (validatedUser) {
              setUser(validatedUser);
            } else {
              throw new Error('Invalid user data from API');
            }
          } else {
            console.log('⚠️ Token invalid, using stored user data');
            const validatedUser = validateUserData(parsedUser);
            if (validatedUser) {
              setUser(validatedUser);
            } else {
              throw new Error('Invalid stored user data');
            }
          }
        } catch (error) {
          console.error('❌ Auth verification failed:', error);
          // Clear invalid auth
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🔄 Attempting login with API...');
      console.log('📍 API URL:', process.env.REACT_APP_API_URL);
      const response = await apiService.login(email, password);
      console.log('📥 Login response:', response);

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        console.log('✅ Login successful!');
        console.log('🔑 Token:', token.substring(0, 30) + '...');
        console.log('👤 User data:', userData);
        console.log('🎭 User roles:', userData.roles?.map((r: any) => r.name));
        console.log('🔐 User permissions:', userData.roles?.flatMap((r: any) => r.permissions?.map((p: any) => p.name) || []));

        // Validate and fix user data structure
        const validateUserData = (user: any) => {
          if (!user || typeof user !== 'object') {
            throw new Error('Invalid user data');
          }

          // Ensure roles is always an array
          if (!user.roles || !Array.isArray(user.roles)) {
            user.roles = [];
          }

          // Ensure each role has permissions array
          user.roles = user.roles.map((role: any) => {
            if (!role || typeof role !== 'object') {
              return { name: 'Unknown', permissions: [] };
            }
            if (!role.permissions || !Array.isArray(role.permissions)) {
              role.permissions = [];
            }
            return role;
          });

          return user;
        };

        const validatedUser = validateUserData(userData);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(validatedUser));
        setUser(validatedUser);

        // Test API call immediately after login
        console.log('🧪 Testing API call after login...');
        setTimeout(async () => {
          try {
            const testResponse = await apiService.getProducts({});
            console.log('🧪 Test API call result:', testResponse.success ? '✅ SUCCESS' : '❌ FAILED');
            if (!testResponse.success) {
              console.log('🧪 Test API error details:', testResponse.message);
            }
          } catch (error: any) {
            console.error('🧪 Test API call error:', error);
          }
        }, 1000);

        toast.success('Login berhasil!');
        return true;
      } else {
        console.error('❌ Login failed:', response.message);
        const errorMessage = response.message || 'Login gagal';
        toast.error(errorMessage);
        return false;
      }
    } catch (error: any) {
      console.error('🚨 Login API Error:', error);
      let errorMessage = 'Terjadi kesalahan saat login';

      if (error.response?.status === 401) {
        errorMessage = 'Email atau password salah';
      } else if (error.response?.status === 422) {
        errorMessage = 'Data login tidak valid';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server sedang bermasalah, coba lagi nanti';
      } else if (!error.response) {
        errorMessage = 'Tidak dapat terhubung ke server';
      } else {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      }

      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logout berhasil');
    }
  };

  const hasPermission = (permission: string): boolean => {
    try {
      // Early return for invalid inputs
      if (!permission || typeof permission !== 'string') {
        return false;
      }

      if (!user || typeof user !== 'object') {
        return false;
      }

      if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        return false;
      }

      // Use traditional for loop to avoid potential 'some' issues
      for (let i = 0; i < user.roles.length; i++) {
        const role = user.roles[i];
        if (!role || typeof role !== 'object' || !role.permissions || !Array.isArray(role.permissions)) {
          continue;
        }

        for (let j = 0; j < role.permissions.length; j++) {
          const perm = role.permissions[j];
          if (perm && typeof perm === 'object' && perm.name === permission) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error in hasPermission:', error, { user: user?.name, permission });
      return false;
    }
  };

  const hasRole = (roleName: string): boolean => {
    try {
      // Early return for invalid inputs
      if (!roleName || typeof roleName !== 'string') {
        return false;
      }

      if (!user || typeof user !== 'object') {
        return false;
      }

      if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        return false;
      }

      // Use traditional for loop to avoid potential 'some' issues
      for (let i = 0; i < user.roles.length; i++) {
        const role = user.roles[i];
        if (role && typeof role === 'object' && role.name === roleName) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in hasRole:', error, { user: user?.name, roleName });
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
