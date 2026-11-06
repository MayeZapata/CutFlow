import type { Appointment, Barber, Location, Service } from '@/types/domain';
import { SEED_APPOINTMENTS, SEED_BARBERS, SEED_LOCATIONS, SEED_SERVICES } from './seed';


interface Store {
  locations: Location[];
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
}

function createStore(): Store {
  return {
    locations: structuredClone(SEED_LOCATIONS),
    barbers: structuredClone(SEED_BARBERS),
    services: structuredClone(SEED_SERVICES),
    appointments: structuredClone(SEED_APPOINTMENTS),
  };
}

const globalForStore = globalThis as typeof globalThis & { __cutflowStore?: Store };

export function getStore(): Store {
  globalForStore.__cutflowStore ??= createStore();
  return globalForStore.__cutflowStore;
}
