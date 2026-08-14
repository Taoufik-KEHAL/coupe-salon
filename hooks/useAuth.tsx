import { auth } from '@/lib/firebase';
import { isMockMode, mockAuth, type MockUser } from '@/lib/mockBackend';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthContextValue = {
  user: MockUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      return mockAuth.onAuthStateChanged((nextUser) => {
        setUser(nextUser);
        setInitializing(false);
      });
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser ? { uid: nextUser.uid, email: nextUser.email } : null);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    initializing,
    login: async (email, password) => {
      if (isMockMode) return mockAuth.login(email, password);
      await signInWithEmailAndPassword(auth, email, password);
    },
    register: async (email, password) => {
      if (isMockMode) return mockAuth.register(email, password);
      await createUserWithEmailAndPassword(auth, email, password);
    },
    logout: async () => {
      if (isMockMode) return mockAuth.logout();
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
