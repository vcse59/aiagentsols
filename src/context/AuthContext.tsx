import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { getAdminSession, loginAdmin, logoutAdmin } from '../lib/api';
import type { AdminUser } from '../types/articles';

interface AuthContextType {
  admin: AdminUser | null;
  isConfigured: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const session = await getAdminSession();
        if (!isMounted) {
          return;
        }

        setIsConfigured(session.configured);
        setAdmin(session.authenticated ? session.admin ?? null : null);
      } catch {
        if (isMounted) {
          setAdmin(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await loginAdmin(email, password);
        setAdmin(response.admin);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to sign in.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(
    () => ({ admin, isConfigured, isInitializing, isLoading, signIn, signOut }),
    [admin, isConfigured, isInitializing, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
