export type UserRole = 'client' | 'coiffeur' | 'admin';

export type AppUser = {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
};

// --- Catalogue (services & produits, gérés par l'admin) ---

export type ServiceProduct = {
  id: string;
  type: 'service' | 'produit';
  name: string;
  photoUrl: string;
  price: number;
  durationMinutes?: number; // uniquement pour les services
  featured?: boolean;
};

export type ServiceProductInput = Omit<ServiceProduct, 'id'>;

// --- Panier (local, avant confirmation de réservation) ---

export type CartItem = {
  id: string;
  kind: 'service' | 'produit';
  name: string;
  price: number;
  photoUrl: string;
  durationMinutes?: number;
  quantity: number;
};

// --- Coiffeurs ---

export type WorkingHours = {
  start: string; // "09:00"
  end: string; // "19:00"
};

export type Coiffeur = {
  id: string; // == uid
  displayName: string;
  email: string;
  workingHours: WorkingHours;
  active: boolean;
};

// --- Créneaux (grille fixe par coiffeur/jour, granularité 15 min) ---

export const SLOT_GRANULARITY_MINUTES = 15;

export type SlotStatus = 'libre' | 'reserve';

export type Slot = {
  id: string; // `${coiffeurId}_${date}_${time}`
  coiffeurId: string;
  date: string; // "2026-08-20"
  time: string; // "09:15"
  status: SlotStatus;
  reservationId: string | null;
};

// --- Réservations ---

export type ReservationStatus =
  | 'confirmee'
  | 'en_attente'
  | 'en_cours'
  | 'terminee'
  | 'annulee';

export type ReservationItem = {
  id: string;
  kind: 'service' | 'produit';
  name: string;
  price: number;
  durationMinutes?: number;
  quantity: number;
};

export type Reservation = {
  id: string;
  clientId: string;
  clientName: string;
  coiffeurId: string | null; // null pour une commande produit seul, sans créneau
  coiffeurName: string | null;
  date: string | null; // "2026-08-20"
  startTime: string | null; // "09:15"
  slotIds: string[];
  items: ReservationItem[];
  total: number;
  status: ReservationStatus;
  createdAt: number;
};

// --- Avis ---

export type Review = {
  id: string;
  reservationId: string;
  clientId: string;
  clientName: string;
  coiffeurId: string | null;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
};

export type ReviewInput = Omit<Review, 'id' | 'createdAt'>;
