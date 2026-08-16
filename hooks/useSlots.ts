import { db } from '@/lib/firebase';
import { slotId, slotTimesForDuration } from '@/lib/slots';
import type { CartItem, Reservation, ReservationItem } from '@/types';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export class SlotUnavailableError extends Error {
  constructor() {
    super("Ce créneau vient d'être pris. Choisis-en un autre.");
    this.name = 'SlotUnavailableError';
  }
}

// Écoute en temps réel les créneaux réservés d'un coiffeur pour un jour
// donné (l'absence de document = créneau libre, voir lib/slots.ts).
export function useReservedTimes(coiffeurId: string | null, date: string | null) {
  const [reservedTimes, setReservedTimes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coiffeurId || !date) {
      setReservedTimes(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'creneaux'),
      where('coiffeurId', '==', coiffeurId),
      where('date', '==', date)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setReservedTimes(new Set(snap.docs.map((d) => d.data().time as string)));
      setLoading(false);
    });
    return unsubscribe;
  }, [coiffeurId, date]);

  return { reservedTimes, loading };
}

// Transaction atomique : vérifie que tous les créneaux nécessaires sont
// encore libres et, seulement dans ce cas, les marque réservés et crée la
// réservation — le tout dans la même transaction Firestore. Si un autre
// client a réservé entre-temps un des créneaux, la transaction échoue
// proprement (SlotUnavailableError) sans double-réservation.
export async function reserveSlots(params: {
  coiffeurId: string;
  coiffeurName: string;
  date: string;
  startTime: string;
  clientId: string;
  clientName: string;
  items: CartItem[];
  totalDurationMinutes: number;
  total: number;
}): Promise<string> {
  const times = slotTimesForDuration(params.startTime, params.totalDurationMinutes);
  const slotRefs = times.map((t) => doc(db, 'creneaux', slotId(params.coiffeurId, params.date, t)));
  const reservationRef = doc(collection(db, 'reservations'));

  await runTransaction(db, async (transaction) => {
    // Toutes les lectures doivent précéder toutes les écritures dans une
    // transaction Firestore.
    const snaps = await Promise.all(slotRefs.map((ref) => transaction.get(ref)));
    if (snaps.some((snap) => snap.exists())) {
      throw new SlotUnavailableError();
    }

    const items: ReservationItem[] = params.items.map((i) => ({
      id: i.id,
      kind: i.kind,
      name: i.name,
      price: i.price,
      durationMinutes: i.durationMinutes,
      quantity: i.quantity,
    }));

    const reservation: Omit<Reservation, 'id'> = {
      clientId: params.clientId,
      clientName: params.clientName,
      coiffeurId: params.coiffeurId,
      coiffeurName: params.coiffeurName,
      date: params.date,
      startTime: params.startTime,
      slotIds: slotRefs.map((r) => r.id),
      items,
      total: params.total,
      status: 'confirmee',
      createdAt: Date.now(),
    };

    // La réservation doit être créée avant les créneaux : les règles de
    // sécurité de `creneaux` vérifient, via get(), que la réservation
    // référencée existe déjà et appartient bien à l'auteur de la requête.
    transaction.set(reservationRef, reservation);
    slotRefs.forEach((ref, i) => {
      transaction.set(ref, {
        coiffeurId: params.coiffeurId,
        date: params.date,
        time: times[i],
        status: 'reserve',
        reservationId: reservationRef.id,
      });
    });
  });

  return reservationRef.id;
}
