import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  cancelAppointment,
  createAppointment,
  getAppointments,
  rescheduleAppointment,
} from '@/lib/db/repository';
import { timeToMinutes } from '@/utils/time';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;
    const barberId = searchParams.get('barberId') || undefined;
    const date = searchParams.get('date') || undefined;
    const statusParam = searchParams.get('status');
    const status = statusParam === 'confirmed' || statusParam === 'cancelled' ? statusParam : undefined;

    const appointments = await getAppointments({
      locationId,
      barberId,
      date,
      status,
    });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Error al obtener las citas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startTime, endTime } = body;

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan horarios de inicio y fin' }, { status: 400 });
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) {
      return NextResponse.json({ error: 'La hora fin debe ser posterior a la de inicio' }, { status: 400 });
    }

    // Handle barberId possibly formatted as "barberId:date" (used by client hook)
    let barberId: string = body.barberId || '';
    let appointmentDate: string = body.date || '';

    if (barberId.includes(':')) {
      const parts = barberId.split(':');
      barberId = parts[0];
      if (!appointmentDate && parts[1]) {
        appointmentDate = parts[1];
      }
    }

    if (!appointmentDate) {
      const now = new Date();
      appointmentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    const locationId = body.locationId || 'medellin-poblado';
    const serviceId = body.serviceId || 'standard';
    const customerName = body.customerName || 'Cliente CutFlow';

    const result = await createAppointment({
      locationId,
      barberId,
      serviceId,
      customerName,
      date: appointmentDate,
      startTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json({ valid: false, reason: result.reason || 'Collision' }, { status: 200 });
    }

    return NextResponse.json({ valid: true, appointment: result.appointment }, { status: 200 });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return NextResponse.json({ error: 'Error al procesar la cita' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Faltan parámetros id y action' }, { status: 400 });
    }

    if (action === 'cancel') {
      const success = await cancelAppointment(id);
      if (!success) {
        return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Cita cancelada exitosamente' }, { status: 200 });
    }

    if (action === 'reschedule') {
      const { date, startTime } = body;
      if (!date || !startTime) {
        return NextResponse.json({ error: 'Faltan nueva fecha u hora de inicio' }, { status: 400 });
      }

      const result = await rescheduleAppointment(id, date, startTime);
      if (!result.success) {
        if (result.reason === 'NotFound') {
          return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Conflicto de horario con otra cita', reason: 'Collision' }, { status: 409 });
      }

      return NextResponse.json({ success: true, appointment: result.appointment }, { status: 200 });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
