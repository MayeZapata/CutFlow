import { NextResponse } from 'next/server';
import { getLocations } from '@/lib/db/repository';

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json({ locations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Error al obtener las sedes' }, { status: 500 });
  }
}
