import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user credentials for demonstration
const MOCK_USERS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'admin@aiagents.dev',
    password: 'Admin@123',
    user: { id: '1', name: 'Admin User', email: 'admin@aiagents.dev' },
  },
  {
    email: 'demo@aiagents.dev',
    password: 'Demo@123',
    user: { id: '2', name: 'Demo User', email: 'demo@aiagents.dev' },
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const trimmedEmail = email.trim().toLowerCase();
      const match = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
      );

      setIsLoading(false);

      if (match) {
        setUser(match.user);
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password. Please try again.' };
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
