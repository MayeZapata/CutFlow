import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addBarber, getBarbers, updateBarber } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const barbers = await getBarbers(locationId, onlyActive);
    return NextResponse.json({ barbers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json({ error: 'Error al obtener los barberos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, specialty, locationId, rating = 5.0, active = true } = body;

    if (!name || !specialty || !locationId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (nombre, especialidad, sede)' }, { status: 400 });
    }

    const barber = await addBarber({
      name,
      specialty,
      locationId,
      rating: Number(rating) || 5.0,
      active: Boolean(active),
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    console.error('Error adding barber:', error);
    return NextResponse.json({ error: 'Error al registrar barbero' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del barbero' }, { status: 400 });
    }

    const updated = await updateBarber(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ barber: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating barber:', error);
    return NextResponse.json({ error: 'Error al actualizar barbero' }, { status: 500 });
  }
}
