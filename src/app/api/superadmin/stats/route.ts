import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { LocationModel, BarberModel, ServiceModel, AppointmentModel } from '@/lib/db/models';

export async function GET() {
  const start = performance.now();
  try {
    await connectToDatabase();
    const pingMs = Math.round(performance.now() - start);

    const [
      locationsCount,
      totalBarbers,
      activeBarbers,
      totalServices,
      totalAppointments,
      confirmedAppointments,
      cancelledAppointments,
      locations,
      barbers,
    ] = await Promise.all([
      LocationModel.countDocuments(),
      BarberModel.countDocuments(),
      BarberModel.countDocuments({ active: true }),
      ServiceModel.countDocuments({ active: true }),
      AppointmentModel.countDocuments(),
      AppointmentModel.countDocuments({ status: 'confirmed' }),
      AppointmentModel.countDocuments({ status: 'cancelled' }),
      LocationModel.find().lean(),
      BarberModel.find().lean(),
    ]);

    const locationsSummary = locations.map((loc) => {
      const locBarbers = barbers.filter((b) => b.locationId === loc._id);
      return {
        id: loc._id,
        name: loc.name,
        city: loc.city,
        address: loc.address,
        barbersCount: locBarbers.length,
        activeBarbersCount: locBarbers.filter((b) => b.active).length,
      };
    });

    return NextResponse.json(
      {
        connected: mongoose.connection.readyState === 1,
        databaseName: mongoose.connection.name || 'barber_db',
        pingMs,
        stats: {
          locationsCount,
          totalBarbers,
          activeBarbers,
          totalServices,
          totalAppointments,
          confirmedAppointments,
          cancelledAppointments,
        },
        locationsSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching superadmin stats:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Error al conectar con la base de datos',
      },
      { status: 500 }
    );
  }
}
