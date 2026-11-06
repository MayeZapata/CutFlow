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
  rating: number;
  locationId: string;
  active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCop: number;
  active?: boolean;
}

export type AppointmentStatus = 'confirmed' | 'rejected';

export interface Appointment {
  id: string;
  locationLabel: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export type BookingField = 'customerName' | 'barber' | 'date' | 'startTime';

export type BookingErrors = Partial<Record<BookingField, string>>;

export interface BookingFeedback {
  type: 'success' | 'error';
  message: string;
}

