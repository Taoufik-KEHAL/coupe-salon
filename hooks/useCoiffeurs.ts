import { db } from '@/lib/firebase';
import type { Coiffeur, WorkingHours } from '@/types';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useCoiffeurs() {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coiffeurs'), (snap) => {
      setCoiffeurs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coiffeur));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { coiffeurs: coiffeurs.filter((c) => c.active), allCoiffeurs: coiffeurs, loading };
}

export async function updateCoiffeur(
  id: string,
  input: Partial<{ displayName: string; workingHours: WorkingHours; active: boolean }>
) {
  return updateDoc(doc(db, 'coiffeurs', id), input);
}
