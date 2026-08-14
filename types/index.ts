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
