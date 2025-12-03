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

const normalizeUserData = (rawUser: any): User | null => {
  if (!rawUser || typeof rawUser !== 'object') {
    return null;
  }

  const normalizedRoles = Array.isArray(rawUser.roles)
    ? rawUser.roles.map((role: any) => ({
        ...role,
        permissions: Array.isArray(role?.permissions) ? role.permissions : [],
      }))
    : [];

  const primaryRole =
    typeof rawUser.role === 'string'
      ? rawUser.role
      : normalizedRoles[0]?.name || '';

  return {
    ...rawUser,
    role: primaryRole,
    roles: normalizedRoles,
  } as User;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = normalizeUserData(JSON.parse(storedUser));
          if (!parsedUser) {
            throw new Error('Invalid stored user data');
          }

          const response = await apiService.getProfile();
          const apiUser = response.success ? normalizeUserData(response.data?.user) : null;

          if (apiUser) {
            setUser(apiUser);
            localStorage.setItem('user', JSON.stringify(apiUser));
            setLoading(false);
            return;
          }

          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Auth verification failed:', error);
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
      const response = await apiService.login(email, password);
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        const normalizedUser = normalizeUserData(userData);

        if (!token || !normalizedUser) {
          throw new Error('Invalid login response');
            }

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);

        toast.success('Login berhasil!');
        return true;
      }

      toast.error(response.message || 'Login gagal');
      return false;
    } catch (error: any) {
      console.error('Login API Error:', error);
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

      // Check user.role string first (primary method for Spatie Permission)
      if (user.role && typeof user.role === 'string') {
        // Handle both exact match and case variations
        const userRole = user.role.toLowerCase().replace(/\s+/g, '_');
        const targetRole = roleName.toLowerCase().replace(/\s+/g, '_');
        if (userRole === targetRole) {
          return true;
        }
      }

      // Fallback: Check user.roles array for backward compatibility
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        for (let i = 0; i < user.roles.length; i++) {
          const role = user.roles[i];
          if (role && typeof role === 'object' && role.name === roleName) {
            return true;
          }
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
