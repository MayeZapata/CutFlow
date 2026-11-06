import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addService, getServices, updateService } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const services = await getServices(onlyActive);
    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Error al obtener los servicios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, durationMinutes, priceCop, active = true } = body;

    if (!name || !durationMinutes || priceCop === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const service = await addService({
      name,
      description: description || '',
      durationMinutes: Number(durationMinutes),
      priceCop: Number(priceCop),
      active: Boolean(active),
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error adding service:', error);
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del servicio' }, { status: 400 });
    }

    if (updates.durationMinutes !== undefined) {
      updates.durationMinutes = Number(updates.durationMinutes);
    }
    if (updates.priceCop !== undefined) {
      updates.priceCop = Number(updates.priceCop);
    }

    const updated = await updateService(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ service: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
  }
}
