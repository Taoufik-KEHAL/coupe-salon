import { db } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/types';
import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { users, loading };
}

export async function changeUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(db, 'users', uid), { role });
  // Promouvoir en coiffeur nécessite un profil coiffeurs/{uid} (horaires de
  // travail) pour que la réservation de créneaux fonctionne — on le crée
  // s'il n'existe pas encore.
  if (role === 'coiffeur') {
    const existing = await getDoc(doc(db, 'coiffeurs', uid));
    if (!existing.exists()) {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const email = (userSnap.data()?.email as string) ?? '';
      await setDoc(doc(db, 'coiffeurs', uid), {
        displayName: email,
        email,
        workingHours: { start: '09:00', end: '19:00' },
        active: true,
      });
    }
  }
}
