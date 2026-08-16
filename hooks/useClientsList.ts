import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
};

export function useClientsList() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClientProfile);
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { clients, loading };
}
