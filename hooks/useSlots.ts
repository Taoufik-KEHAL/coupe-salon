import { db } from '@/lib/firebase';
import { slotId, slotTimesForDuration } from '@/lib/slots';
import type { CartItem, Reservation, ReservationItem } from '@/types';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
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

// Réserve les créneaux nécessaires pour la durée totale du panier.
//
// Implémentation en deux temps :
//  1. La réservation est créée par une écriture séparée (committée), status
//     'confirmee'.
//  2. Une transaction Firestore vérifie ensuite atomiquement que tous les
//     créneaux nécessaires sont encore libres et, seulement dans ce cas, les
//     marque réservés en référençant cette réservation.
// (Les deux étapes ne peuvent PAS être faites dans une seule transaction :
// les règles de sécurité des créneaux valident la réservation via get(), et
// Firestore n'expose pas les écritures d'une transaction aux get() faits
// pendant l'évaluation des règles de cette même transaction.)
// Si le créneau n'est plus libre, la réservation orpheline est annulée et
// SlotUnavailableError est levée — sans double-réservation.
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

  await setDoc(reservationRef, reservation);

  try {
    await runTransaction(db, async (transaction) => {
      // Toutes les lectures doivent précéder toutes les écritures dans une
      // transaction Firestore.
      const snaps = await Promise.all(slotRefs.map((ref) => transaction.get(ref)));
      if (snaps.some((snap) => snap.exists())) {
        throw new SlotUnavailableError();
      }
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
  } catch (e) {
    await updateDoc(reservationRef, { status: 'annulee' }).catch(() => {});
    throw e;
  }

  return reservationRef.id;
}
