import { db } from '@/lib/firebase';
import { isMockMode, mockCreateClient, mockDeleteClient, mockUpdateClient, subscribeClients } from '@/lib/mockBackend';
import type { Client, ClientInput } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

const CLIENTS_COLLECTION = 'clients';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }
    if (isMockMode) {
      return subscribeClients(user.uid, (next) => {
        setClients(next);
        setLoading(false);
      });
    }
    const q = query(
      collection(db, CLIENTS_COLLECTION),
      where('ownerId', '==', user.uid),
      orderBy('name', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { clients, loading };
}

export async function createClient(ownerId: string, input: ClientInput) {
  if (isMockMode) return mockCreateClient(ownerId, input);
  return addDoc(collection(db, CLIENTS_COLLECTION), {
    ...input,
    ownerId,
    createdAt: Date.now(),
  });
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  if (isMockMode) return mockUpdateClient(id, input);
  return updateDoc(doc(db, CLIENTS_COLLECTION, id), input);
}

export async function deleteClient(id: string) {
  if (isMockMode) return mockDeleteClient(id);
  return deleteDoc(doc(db, CLIENTS_COLLECTION, id));
}
