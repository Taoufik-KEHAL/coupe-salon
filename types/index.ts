export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: number;
  ownerId: string;
};

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'ownerId'>;

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  date: string; // ISO string, e.g. 2026-08-14T10:30:00.000Z
  durationMinutes: number;
  notes?: string;
  status: AppointmentStatus;
  createdAt: number;
  ownerId: string;
};

export type AppointmentInput = Omit<
  Appointment,
  'id' | 'createdAt' | 'ownerId' | 'clientName'
>;

export type UserRole = 'client' | 'staff';

export type Service = {
  id: string;
  name: string;
  photoUrl: string;
  durationMinutes: number;
  price: number;
  featured?: boolean;
};

export type Product = {
  id: string;
  name: string;
  photoUrl: string;
  price: number;
};

export type CartItem = {
  id: string;
  kind: 'service' | 'product';
  name: string;
  price: number;
  photoUrl: string;
  quantity: number;
};
