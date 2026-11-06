/** Shared domain models. Used by the data layer, API routes and UI. */

export interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  /** 0 means "new barber, no rating yet". */
  rating: number;
  locationId: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCop: number;
  active: boolean;
}

export type AppointmentStatus = 'confirmed' | 'cancelled';

export interface Appointment {
  id: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" */
  startTime: string;
  /** "HH:MM" – always computed on the server from the service duration. */
  endTime: string;
  status: AppointmentStatus;
  createdAt: string;
}

export type UserRole = 'client' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}
