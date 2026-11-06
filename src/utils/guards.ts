import type { Appointment, Barber, Location, Service } from '@/types/domain';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStrings(record: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => typeof record[key] === 'string');
}

function hasNumbers(record: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => typeof record[key] === 'number' && Number.isFinite(record[key]));
}

export function isLocation(value: unknown): value is Location {
  return isRecord(value) && hasStrings(value, ['id', 'name', 'city', 'address']);
}

export function isBarber(value: unknown): value is Barber {
  return (
    isRecord(value) &&
    hasStrings(value, ['id', 'name', 'specialty', 'locationId']) &&
    hasNumbers(value, ['rating']) &&
    typeof value.active === 'boolean'
  );
}

export function isService(value: unknown): value is Service {
  return (
    isRecord(value) &&
    hasStrings(value, ['id', 'name', 'description']) &&
    hasNumbers(value, ['durationMinutes', 'priceCop']) &&
    typeof value.active === 'boolean'
  );
}

export function isAppointment(value: unknown): value is Appointment {
  return (
    isRecord(value) &&
    hasStrings(value, ['id', 'locationId', 'barberId', 'serviceId', 'customerName', 'date', 'startTime', 'endTime', 'createdAt']) &&
    (value.status === 'confirmed' || value.status === 'cancelled')
  );
}

export function pickArray<T>(body: unknown, key: string, guard: (item: unknown) => item is T): T[] | null {
  if (!isRecord(body)) return null;
  const list = body[key];
  return Array.isArray(list) && list.every(guard) ? list : null;
}

export function pickItem<T>(body: unknown, key: string, guard: (item: unknown) => item is T): T | null {
  if (!isRecord(body)) return null;
  const item = body[key];
  return guard(item) ? item : null;
}
