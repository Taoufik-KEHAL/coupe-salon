import { db } from '@/lib/firebase';
import type { Reservation, ReservationStatus } from '@/types';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

const COLLECTION = 'reservations';

export function useMyReservations(clientId: string | undefined) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setReservations([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, COLLECTION), where('clientId', '==', clientId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reservation);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setReservations(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [clientId]);

  return { reservations, loading };
}

// Planning partagé : toutes les réservations d'un jour donné, tous coiffeurs
// confondus — visible par tout coiffeur/admin, mis à jour en temps réel.
export function usePlanning(date: string) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('date', '==', date));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reservation);
      list.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
      setReservations(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [date]);

  return { reservations, loading };
}

// Réservations dans un statut donné, tous jours confondus — pour l'écran
// "Valider le panier" (coiffeur/admin) : à valider (en_attente) et en cours.
export function useReservationsByStatus(status: ReservationStatus) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('status', '==', status));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reservation);
      list.sort((a, b) => a.createdAt - b.createdAt);
      setReservations(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [status]);

  return { reservations, loading };
}

export function usePendingReservations() {
  return useReservationsByStatus('en_attente');
}

export async function setReservationStatus(id: string, status: ReservationStatus) {
  return updateDoc(doc(db, COLLECTION, id), { status });
}

// Annule une réservation et libère ses créneaux dans la même transaction
// (un créneau "libre" = absence de document, voir lib/slots.ts).
export async function cancelReservation(reservation: Reservation) {
  await runTransaction(db, async (transaction) => {
    const reservationRef = doc(db, COLLECTION, reservation.id);
    transaction.update(reservationRef, { status: 'annulee' });
    reservation.slotIds.forEach((slotId) => {
      transaction.delete(doc(db, 'creneaux', slotId));
    });
  });
}

// Commande produits seuls, sans créneau ni coiffeur.
export async function createProductOnlyOrder(params: {
  clientId: string;
  clientName: string;
  items: Reservation['items'];
  total: number;
}): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    clientId: params.clientId,
    clientName: params.clientName,
    coiffeurId: null,
    coiffeurName: null,
    date: null,
    startTime: null,
    slotIds: [],
    items: params.items,
    total: params.total,
    status: 'en_attente',
    createdAt: Date.now(),
  });
  return ref.id;
}
