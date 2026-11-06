import type { Appointment, Barber, Location, Service } from '@/types/domain';

export const SEED_LOCATIONS: Location[] = [
  { id: 'medellin-poblado', name: 'El Poblado', city: 'Medellín', address: 'Cra. 37 #8A-32' },
  { id: 'bogota-chapinero', name: 'Chapinero', city: 'Bogotá', address: 'Cl. 63 #9-41' },
];

export const SEED_BARBERS: Barber[] = [
  { id: 'juan-perez', name: 'Juan Pérez', specialty: 'Fades y degradados', rating: 4.9, locationId: 'medellin-poblado', active: true },
  { id: 'carlos-gomez', name: 'Carlos Gómez', specialty: 'Barba y perfilado', rating: 4.8, locationId: 'medellin-poblado', active: true },
  { id: 'andres-rios', name: 'Andrés Ríos', specialty: 'Cortes clásicos', rating: 4.7, locationId: 'bogota-chapinero', active: true },
  { id: 'mateo-vargas', name: 'Mateo Vargas', specialty: 'Diseños y texturas', rating: 4.9, locationId: 'bogota-chapinero', active: true },
];

export const SEED_SERVICES: Service[] = [
  { id: 'quick', name: 'Corte rápido', description: 'Repaso con máquina y acabado limpio.', durationMinutes: 15, priceCop: 25000, active: true },
  { id: 'standard', name: 'Corte estándar', description: 'Corte completo, lavado y peinado.', durationMinutes: 30, priceCop: 40000, active: true },
  { id: 'premium', name: 'Corte premium', description: 'Corte, barba, toalla caliente y styling.', durationMinutes: 45, priceCop: 65000, active: true },
];

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'seed-apt-1',
    locationId: 'medellin-poblado',
    barberId: 'juan-perez',
    serviceId: 'standard',
    customerName: 'Santiago Restrepo',
    date: getTodayString(),
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-apt-2',
    locationId: 'medellin-poblado',
    barberId: 'juan-perez',
    serviceId: 'premium',
    customerName: 'Mateo Henao',
    date: getTodayString(),
    startTime: '11:00',
    endTime: '11:45',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-apt-3',
    locationId: 'medellin-poblado',
    barberId: 'carlos-gomez',
    serviceId: 'standard',
    customerName: 'David Jaramillo',
    date: getTodayString(),
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-apt-4',
    locationId: 'bogota-chapinero',
    barberId: 'andres-rios',
    serviceId: 'premium',
    customerName: 'Felipe Mendoza',
    date: getTodayString(),
    startTime: '14:00',
    endTime: '14:45',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  passwordPlain: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'client';
}

export const SEED_USERS: SeedUser[] = [
  {
    id: 'user-superadmin-1',
    name: 'Superadmin CutFlow',
    email: 'superadmin@cutflow.com',
    passwordPlain: 'super123',
    phone: '3001234567',
    role: 'superadmin',
  },
  {
    id: 'user-admin-1',
    name: 'Admin Barbería Poblado',
    email: 'admin@cutflow.com',
    passwordPlain: 'admin123',
    phone: '3109876543',
    role: 'admin',
  },
  {
    id: 'user-client-1',
    name: 'Carlos Zapata',
    email: 'cliente@cutflow.com',
    passwordPlain: 'cliente123',
    phone: '3205554321',
    role: 'client',
  },
];
