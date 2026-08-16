import { db } from '@/lib/firebase';
import { SEED_CATALOG } from '@/lib/catalog';
import type { ServiceProduct, ServiceProductInput } from '@/types';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const COLLECTION = 'services_produits';

export function useCatalog() {
  const [items, setItems] = useState<ServiceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceProduct));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    items,
    loading,
    services: items.filter((i) => i.type === 'service'),
    produits: items.filter((i) => i.type === 'produit'),
  };
}

export function useServiceProduct(id: string | undefined) {
  const { items } = useCatalog();
  return items.find((i) => i.id === id);
}

export async function createServiceProduct(input: ServiceProductInput) {
  return addDoc(collection(db, COLLECTION), input);
}

export async function updateServiceProduct(id: string, input: Partial<ServiceProductInput>) {
  return updateDoc(doc(db, COLLECTION, id), input);
}

export async function deleteServiceProduct(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

// Import manuel (admin) du catalogue de démarrage — l'auto-seed déclenché
// par n'importe quel client casserait les règles Firestore (write réservé à
// l'admin), donc c'est une action explicite depuis l'écran d'administration.
export async function seedCatalog() {
  await Promise.all(SEED_CATALOG.map((item) => addDoc(collection(db, COLLECTION), item)));
}
