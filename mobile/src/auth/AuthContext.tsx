import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '@/src/api/client';
import type { AuthUser } from '@/src/types/api';

const USER_KEY = 'gym_user';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
      setIsLoading(false);
    })();
  }, []);

  async function signIn(username: string, password: string) {
    const me = await apiFetch<AuthUser>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
    });
    if (!me.isActive) throw new Error('Account is deactivated. Contact your coach.');
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(me));
    setUser(me);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
