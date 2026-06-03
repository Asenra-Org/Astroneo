'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }, (error) => {
        // Firebase auth errors (e.g., invalid API key in dev) — gracefully degrade
        console.warn('[AuthContext] Firebase auth error:', error.message);
        setUser(null);
        setLoading(false);
      });
    } catch (e) {
      // Auth initialization failed (e.g., no Firebase config)
      console.warn('[AuthContext] Firebase not configured:', e);
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
