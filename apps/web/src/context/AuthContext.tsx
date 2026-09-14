import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import type { AuthResponse, User } from '../types';

interface AuthContextValue {
  readonly user: User | null;
  readonly loading: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  readonly logout: () => void;
  readonly refreshUser: () => Promise<void>;
  readonly setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<void> => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>('/users/me');
      setUser(data);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const applyAuth = useCallback((data: AuthResponse): void => {
    setStoredToken(data.accessToken);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      applyAuth(data);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<void> => {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        displayName,
      });
      applyAuth(data);
    },
    [applyAuth],
  );

  const logout = useCallback((): void => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
