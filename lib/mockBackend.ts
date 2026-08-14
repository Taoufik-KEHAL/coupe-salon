import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appointment, AppointmentInput, Client, ClientInput } from '@/types';

/**
 * Local-only backend used when no Firebase project is configured
 * (EXPO_PUBLIC_FIREBASE_API_KEY unset). Lets the GUI be exercised
 * end-to-end without a Firebase account, storing data in AsyncStorage.
 */
export const isMockMode = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

export type MockUser = { uid: string; email: string | null };

const USER_KEY = 'mock:user';
const CLIENTS_KEY = 'mock:clients';
const APPOINTMENTS_KEY = 'mock:appointments';

let currentUser: MockUser | null = null;
let clients: Client[] = [];
let appointments: Appointment[] = [];
let ready: Promise<void> | null = null;

const authListeners = new Set<() => void>();
const clientListeners = new Set<() => void>();
const appointmentListeners = new Set<() => void>();

function seedIfEmpty(ownerId: string) {
  if (clients.some((c) => c.ownerId === ownerId)) return;
  const now = Date.now();
  clients.push(
    {
      id: 'demo-client-1',
      name: 'Camille Durand',
      phone: '0612345678',
      email: 'camille@example.com',
      notes: 'Préfère les rendez-vous en matinée.',
      createdAt: now,
      ownerId,
    },
    {
      id: 'demo-client-2',
      name: 'Lucas Bernard',
      phone: '0698765432',
      createdAt: now,
      ownerId,
    }
  );
  appointments.push({
    id: 'demo-appointment-1',
    clientId: 'demo-client-1',
    clientName: 'Camille Durand',
    service: 'Coupe + brushing',
    date: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    status: 'scheduled',
    createdAt: now,
    ownerId,
  });
}

function init() {
  if (!ready) {
    ready = (async () => {
      const stored = await AsyncStorage.multiGet([USER_KEY, CLIENTS_KEY, APPOINTMENTS_KEY]);
      const [storedUser, storedClients, storedAppointments] = stored.map(([, v]) => v);
      currentUser = storedUser ? JSON.parse(storedUser) : null;
      clients = storedClients ? JSON.parse(storedClients) : [];
      appointments = storedAppointments ? JSON.parse(storedAppointments) : [];
      if (currentUser) seedIfEmpty(currentUser.uid);
    })();
  }
  return ready;
}

async function persistData() {
  await AsyncStorage.multiSet([
    [CLIENTS_KEY, JSON.stringify(clients)],
    [APPOINTMENTS_KEY, JSON.stringify(appointments)],
  ]);
}

function authError(code: string) {
  const err = new Error(code) as Error & { code: string };
  err.code = code;
  return err;
}

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const mockAuth = {
  onAuthStateChanged(listener: (user: MockUser | null) => void) {
    const emit = () => listener(currentUser);
    authListeners.add(emit);
    init().then(emit);
    return () => authListeners.delete(emit);
  },
  async login(email: string, password: string) {
    await init();
    if (!password || password.length < 6) throw authError('auth/invalid-credential');
    currentUser = { uid: `mock-${email.trim().toLowerCase()}`, email: email.trim() };
    seedIfEmpty(currentUser.uid);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    await persistData();
    authListeners.forEach((emit) => emit());
    clientListeners.forEach((emit) => emit());
    appointmentListeners.forEach((emit) => emit());
  },
  async register(email: string, password: string) {
    if (!password || password.length < 6) throw authError('auth/weak-password');
    return mockAuth.login(email, password);
  },
  async logout() {
    currentUser = null;
    await AsyncStorage.removeItem(USER_KEY);
    authListeners.forEach((emit) => emit());
  },
};

export function subscribeClients(ownerId: string, listener: (clients: Client[]) => void) {
  const emit = () =>
    listener(
      clients
        .filter((c) => c.ownerId === ownerId)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  clientListeners.add(emit);
  init().then(emit);
  return () => clientListeners.delete(emit);
}

export async function mockCreateClient(ownerId: string, input: ClientInput) {
  await init();
  clients.push({ id: id(), ...input, ownerId, createdAt: Date.now() });
  await persistData();
  clientListeners.forEach((emit) => emit());
}

export async function mockUpdateClient(clientId: string, input: Partial<ClientInput>) {
  await init();
  clients = clients.map((c) => (c.id === clientId ? { ...c, ...input } : c));
  await persistData();
  clientListeners.forEach((emit) => emit());
}

export async function mockDeleteClient(clientId: string) {
  await init();
  clients = clients.filter((c) => c.id !== clientId);
  appointments = appointments.filter((a) => a.clientId !== clientId);
  await persistData();
  clientListeners.forEach((emit) => emit());
  appointmentListeners.forEach((emit) => emit());
}

export function subscribeAppointments(
  ownerId: string,
  listener: (appointments: Appointment[]) => void
) {
  const emit = () =>
    listener(
      appointments
        .filter((a) => a.ownerId === ownerId)
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  appointmentListeners.add(emit);
  init().then(emit);
  return () => appointmentListeners.delete(emit);
}

export async function mockCreateAppointment(
  ownerId: string,
  clientName: string,
  input: AppointmentInput
) {
  await init();
  appointments.push({ id: id(), ...input, clientName, ownerId, createdAt: Date.now() });
  await persistData();
  appointmentListeners.forEach((emit) => emit());
}

export async function mockUpdateAppointment(
  appointmentId: string,
  input: Partial<AppointmentInput & { clientName: string }>
) {
  await init();
  appointments = appointments.map((a) => (a.id === appointmentId ? { ...a, ...input } : a));
  await persistData();
  appointmentListeners.forEach((emit) => emit());
}

export async function mockDeleteAppointment(appointmentId: string) {
  await init();
  appointments = appointments.filter((a) => a.id !== appointmentId);
  await persistData();
  appointmentListeners.forEach((emit) => emit());
}
