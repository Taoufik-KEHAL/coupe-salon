import { db } from '@/lib/firebase';
import {
  isMockMode,
  mockCreateAppointment,
  mockDeleteAppointment,
  mockUpdateAppointment,
  subscribeAppointments,
} from '@/lib/mockBackend';
import type { Appointment, AppointmentInput } from '@/types';
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

const APPOINTMENTS_COLLECTION = 'appointments';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    if (isMockMode) {
      return subscribeAppointments(user.uid, (next) => {
        setAppointments(next);
        setLoading(false);
      });
    }
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('ownerId', '==', user.uid),
      orderBy('date', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { appointments, loading };
}

export async function createAppointment(
  ownerId: string,
  clientName: string,
  input: AppointmentInput
) {
  if (isMockMode) return mockCreateAppointment(ownerId, clientName, input);
  return addDoc(collection(db, APPOINTMENTS_COLLECTION), {
    ...input,
    clientName,
    ownerId,
    createdAt: Date.now(),
  });
}

export async function updateAppointment(
  id: string,
  input: Partial<AppointmentInput & { clientName: string }>
) {
  if (isMockMode) return mockUpdateAppointment(id, input);
  return updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), input);
}

export async function deleteAppointment(id: string) {
  if (isMockMode) return mockDeleteAppointment(id);
  return deleteDoc(doc(db, APPOINTMENTS_COLLECTION, id));
}
