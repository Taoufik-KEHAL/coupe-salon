import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/types';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const snap = await getDoc(doc(db, 'users', nextUser.uid));
        setRole((snap.data()?.role as UserRole) ?? null);
      } else {
        setRole(null);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    role,
    initializing,
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    register: async (email, password, role) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        email,
        role,
        createdAt: Date.now(),
      });
      setRole(role);
    },
    logout: async () => {
      await signOut(auth);
    },
    setUserRole: async (nextRole) => {
      if (!user) return;
      await setDoc(doc(db, 'users', user.uid), { email: user.email, role: nextRole, createdAt: Date.now() }, { merge: true });
      setRole(nextRole);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
