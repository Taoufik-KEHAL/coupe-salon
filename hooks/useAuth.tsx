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
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// Rôle choisissable librement à l'inscription. 'admin' n'est jamais
// auto-attribuable — il ne s'obtient que par promotion depuis l'espace
// "Gestion des utilisateurs" d'un admin existant.
export type RegistrableRole = Extract<UserRole, 'client' | 'coiffeur'>;

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: RegistrableRole) => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: RegistrableRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const VALID_ROLES: UserRole[] = ['client', 'coiffeur', 'admin'];

// Défend contre une valeur de rôle obsolète en base (ex. l'ancien rôle
// 'staff' d'une version précédente) — traitée comme "pas de rôle" plutôt que
// de bloquer silencieusement l'utilisateur sur un écran vide.
function sanitizeRole(value: unknown): UserRole | null {
  return VALID_ROLES.includes(value as UserRole) ? (value as UserRole) : null;
}

async function createRoleProfile(uid: string, email: string, role: UserRole) {
  await setDoc(doc(db, 'users', uid), { email, role, createdAt: Date.now() });
  if (role === 'client') {
    await setDoc(doc(db, 'clients', uid), { name: email, phone: '', notes: '', createdAt: Date.now() });
  } else if (role === 'coiffeur') {
    await setDoc(doc(db, 'coiffeurs', uid), {
      displayName: email,
      email,
      workingHours: { start: '09:00', end: '19:00' },
      active: true,
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [initializing, setInitializing] = useState(true);
  // Set right before creating a new account, so that if the Firestore
  // `users/{uid}` doc isn't visible yet to the onAuthStateChanged listener's
  // read (it can fire before our own setDoc below resolves), we don't
  // clobber the role we already know with a false "not found".
  const pendingRoleRef = useRef<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const snap = await getDoc(doc(db, 'users', nextUser.uid));
          const fetchedRole = sanitizeRole(snap.data()?.role);
          setRole(fetchedRole ?? pendingRoleRef.current ?? null);
        } catch (e) {
          console.error('Failed to fetch user role', e);
          setRole(pendingRoleRef.current ?? null);
        }
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
      pendingRoleRef.current = role;
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await createRoleProfile(credential.user.uid, email, role);
        setRole(role);
      } finally {
        pendingRoleRef.current = null;
      }
    },
    logout: async () => {
      await signOut(auth);
    },
    setUserRole: async (nextRole) => {
      if (!user) return;
      pendingRoleRef.current = nextRole;
      try {
        await createRoleProfile(user.uid, user.email ?? '', nextRole);
        setRole(nextRole);
      } finally {
        pendingRoleRef.current = null;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
