import type { Appointment, AppointmentStatus, Barber, Location, Service } from '@/types/domain';
import { connectToDatabase } from './mongodb';
import { LocationModel, BarberModel, ServiceModel, AppointmentModel, type IAppointment } from './models';
import { addMinutesToTime, minutesToTime, timeToMinutes } from '@/utils/time';

/**
 * Data Access Layer (DAL) for CutFlow backed by MongoDB and Mongoose.
 */

// Helper mappers
function toLocation(doc: { _id: string; id?: string; name: string; city: string; address: string }): Location {
  return {
    id: doc._id || doc.id || '',
    name: doc.name,
    city: doc.city,
    address: doc.address,
  };
}

function toBarber(doc: { _id: string; id?: string; name: string; specialty: string; rating: number; locationId: string; active: boolean }): Barber {
  return {
    id: doc._id || doc.id || '',
    name: doc.name,
    specialty: doc.specialty,
    rating: doc.rating,
    locationId: doc.locationId,
    active: doc.active,
  };
}

function toService(doc: { _id: string; id?: string; name: string; description: string; durationMinutes: number; priceCop: number; active: boolean }): Service {
  return {
    id: doc._id || doc.id || '',
    name: doc.name,
    description: doc.description || '',
    durationMinutes: doc.durationMinutes,
    priceCop: doc.priceCop,
    active: doc.active,
  };
}

function toAppointment(doc: IAppointment & { id?: string }): Appointment {
  const startTime =
    doc.startTime ||
    (doc.startMinutes !== undefined ? minutesToTime(doc.startMinutes) : '08:00');
  const endTime =
    doc.endTime ||
    (doc.endMinutes !== undefined ? minutesToTime(doc.endMinutes) : '08:30');

  const customerName =
    doc.customerName ||
    doc.snapshot?.clientName ||
    doc.snapshot?.barberName ||
    'Cliente CutFlow';

  const status: AppointmentStatus =
    doc.status === 'cancelled' ? 'cancelled' : 'confirmed';

  return {
    id: String(doc._id || doc.id || ''),
    locationId: doc.locationId || '',
    barberId: doc.barberId || '',
    serviceId: doc.serviceId || '',
    customerName,
    date: doc.date,
    startTime,
    endTime,
    status,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || new Date().toISOString()),
  };
}

// --- Locations ---
export async function getLocations(): Promise<Location[]> {
  await connectToDatabase();
  const docs = await LocationModel.find({ active: true }).lean();
  return docs.map(toLocation);
}

export async function getLocationById(id: string): Promise<Location | null> {
  await connectToDatabase();
  const doc = await LocationModel.findById(id).lean();
  return doc ? toLocation(doc) : null;
}

// --- Barbers ---
export async function getBarbers(locationId?: string, onlyActive = false): Promise<Barber[]> {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (locationId) {
    query.locationId = locationId;
  }
  if (onlyActive) {
    query.active = true;
  }
  const docs = await BarberModel.find(query).lean();
  return docs.map(toBarber);
}

export async function addBarber(data: Omit<Barber, 'id'>): Promise<Barber> {
  await connectToDatabase();
  const id = `barber-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const created = await BarberModel.create({
    _id: id,
    ...data,
    rating: data.rating || 5.0,
    active: data.active ?? true,
  });
  return toBarber(created.toObject());
}

export async function updateBarber(id: string, updates: Partial<Barber>): Promise<Barber | null> {
  await connectToDatabase();
  const updated = await BarberModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  return updated ? toBarber(updated) : null;
}

// --- Services ---
export async function getServices(onlyActive = false): Promise<Service[]> {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (onlyActive) {
    query.active = true;
  }
  const docs = await ServiceModel.find(query).lean();
  return docs.map(toService);
}

export async function getServiceById(id: string): Promise<Service | null> {
  await connectToDatabase();
  const doc = await ServiceModel.findById(id).lean();
  return doc ? toService(doc) : null;
}

export async function addService(data: Omit<Service, 'id'>): Promise<Service> {
  await connectToDatabase();
  const id = `service-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const created = await ServiceModel.create({
    _id: id,
    ...data,
    active: data.active ?? true,
  });
  return toService(created.toObject());
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
  await connectToDatabase();
  const updated = await ServiceModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  return updated ? toService(updated) : null;
}

// --- Appointments & Collision Validation ---

export interface AppointmentFilter {
  locationId?: string;
  barberId?: string;
  date?: string;
  status?: 'confirmed' | 'cancelled';
}

export async function getAppointments(filters?: AppointmentFilter): Promise<Appointment[]> {
  await connectToDatabase();
  const query: Record<string, unknown> = {};

  if (filters?.locationId) {
    query.locationId = filters.locationId;
  }
  if (filters?.barberId) {
    query.barberId = filters.barberId;
  }
  if (filters?.date) {
    query.date = filters.date;
  }
  if (filters?.status) {
    query.status = filters.status;
  }

  // Limit to recent/relevant list to stay fast even with 200k documents
  const docs = await AppointmentModel.find(query).limit(100).lean();
  const appointments = docs.map((d) => toAppointment(d as unknown as IAppointment));

  // Sort by startTime
  return appointments.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}


export async function checkCollision(
  barberId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  await connectToDatabase();
  const candStart = timeToMinutes(startTime);
  const candEnd = timeToMinutes(endTime);

  const query: Record<string, unknown> = {
    barberId,
    date,
    status: { $in: ['confirmed', 'completed'] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const activeAppointments = await AppointmentModel.find(query).lean();

  return activeAppointments.some((existing) => {
    const exStart =
      existing.startMinutes !== undefined
        ? existing.startMinutes
        : (existing.startTime ? timeToMinutes(existing.startTime) : 0);
    const exEnd =
      existing.endMinutes !== undefined
        ? existing.endMinutes
        : (existing.endTime ? timeToMinutes(existing.endTime) : 0);

    return !(candEnd <= exStart || candStart >= exEnd);
  });
}

export async function createAppointment(data: {
  locationId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId?: string;
}): Promise<{ success: boolean; appointment?: Appointment; reason?: string }> {
  await connectToDatabase();
  const hasCollision = await checkCollision(data.barberId, data.date, data.startTime, data.endTime);
  if (hasCollision) {
    return { success: false, reason: 'Collision' };
  }

  // Lookup barber, service, location for rich snapshot
  const [barber, service, location] = await Promise.all([
    BarberModel.findById(data.barberId).lean(),
    ServiceModel.findById(data.serviceId).lean(),
    LocationModel.findById(data.locationId).lean(),
  ]);

  const id = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startMinutes = timeToMinutes(data.startTime);
  const endMinutes = timeToMinutes(data.endTime);

  const created = await AppointmentModel.create({
    _id: id,
    ...data,
    startMinutes,
    endMinutes,
    status: 'confirmed',
    snapshot: {
      barberName: barber?.name || data.barberId,
      serviceName: service?.name || data.serviceId,
      locationLabel: location?.name || data.locationId,
      priceCop: service?.priceCop || 0,
      clientName: data.customerName,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { success: true, appointment: toAppointment(created.toObject() as unknown as IAppointment) };
}

export async function cancelAppointment(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await AppointmentModel.findByIdAndUpdate(id, { $set: { status: 'cancelled' } });
  return Boolean(result);
}

export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newStartTime: string
): Promise<{ success: boolean; appointment?: Appointment; reason?: string }> {
  await connectToDatabase();
  const appointmentDoc = await AppointmentModel.findById(id).lean();
  if (!appointmentDoc) return { success: false, reason: 'NotFound' };

  // Calculate new end time based on original duration or service
  const currentDuration =
    (appointmentDoc.endMinutes !== undefined && appointmentDoc.startMinutes !== undefined)
      ? appointmentDoc.endMinutes - appointmentDoc.startMinutes
      : (appointmentDoc.endTime && appointmentDoc.startTime)
      ? timeToMinutes(appointmentDoc.endTime) - timeToMinutes(appointmentDoc.startTime)
      : 30;

  const newEndTime = addMinutesToTime(newStartTime, currentDuration > 0 ? currentDuration : 30);

  const hasCollision = await checkCollision(
    appointmentDoc.barberId,
    newDate,
    newStartTime,
    newEndTime,
    id
  );

  if (hasCollision) {
    return { success: false, reason: 'Collision' };
  }

  const updated = await AppointmentModel.findByIdAndUpdate(
    id,
    {
      $set: {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        startMinutes: timeToMinutes(newStartTime),
        endMinutes: timeToMinutes(newEndTime),
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      },
    },
    { new: true }
  ).lean();

  if (!updated) return { success: false, reason: 'NotFound' };

  return { success: true, appointment: toAppointment(updated as unknown as IAppointment) };
}
