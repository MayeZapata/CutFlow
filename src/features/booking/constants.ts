import type { Barber, Location, Service } from './types';

export const OPENING_TIME = '08:00';
export const CLOSING_TIME = '20:00';
/** Time slot granularity in seconds (used by the native time input). */
export const SLOT_STEP_SECONDS = 15 * 60;

export const LOCATIONS: readonly Location[] = [
  { id: 'medellin-poblado', name: 'El Poblado', city: 'Medellín', address: 'Cra. 37 #8A-32' },
  { id: 'bogota-chapinero', name: 'Chapinero', city: 'Bogotá', address: 'Cl. 63 #9-41' },
];

export const BARBERS: readonly Barber[] = [
  { id: 'juan-perez', name: 'Juan Pérez', specialty: 'Fades y degradados', rating: 4.9, locationId: 'medellin-poblado' },
  { id: 'carlos-gomez', name: 'Carlos Gómez', specialty: 'Barba y perfilado', rating: 4.8, locationId: 'medellin-poblado' },
  { id: 'andres-rios', name: 'Andrés Ríos', specialty: 'Cortes clásicos', rating: 4.7, locationId: 'bogota-chapinero' },
  { id: 'mateo-vargas', name: 'Mateo Vargas', specialty: 'Diseños y texturas', rating: 4.9, locationId: 'bogota-chapinero' },
];

export const SERVICES: readonly Service[] = [
  {
    id: 'quick',
    name: 'Corte rápido',
    description: 'Repaso con máquina y acabado limpio.',
    durationMinutes: 15,
    priceCop: 25000,
  },
  {
    id: 'standard',
    name: 'Corte estándar',
    description: 'Corte completo, lavado y peinado.',
    durationMinutes: 30,
    priceCop: 40000,
  },
  {
    id: 'premium',
    name: 'Corte premium',
    description: 'Corte, barba, toalla caliente y styling.',
    durationMinutes: 45,
    priceCop: 65000,
  },
];
