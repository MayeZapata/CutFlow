'use client';

import type { Appointment, Barber, Service } from '@/types/domain';
import { formatCop, timeToMinutes } from '@/utils/time';
import KpiCard from '@/components/ui/KpiCard';

interface MetricsTabProps {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
  locationName: string;
}

export default function MetricsTab({
  appointments,
  barbers,
  services,
  locationName,
}: MetricsTabProps) {
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const cancelled = appointments.filter((a) => a.status === 'cancelled');

  function getServicePrice(serviceId: string): number {
    return services.find((s) => s.id === serviceId)?.priceCop || 0;
  }

  function getServiceDuration(serviceId: string): number {
    return services.find((s) => s.id === serviceId)?.durationMinutes || 30;
  }

  // Total revenue today
  const totalRevenue = confirmed.reduce((acc, apt) => acc + getServicePrice(apt.serviceId), 0);

  // Total booked minutes
  const totalBookedMinutes = confirmed.reduce((acc, apt) => {
    const start = timeToMinutes(apt.startTime);
    const end = timeToMinutes(apt.endTime);
    const diff = end - start;
    return acc + (diff > 0 ? diff : getServiceDuration(apt.serviceId));
  }, 0);

  // Available minutes: 12 working hours (08:00 - 20:00) = 720 mins per active barber
  const activeBarbers = barbers.filter((b) => b.active);
  const totalAvailableMinutes = (activeBarbers.length || 1) * 720;
  const occupancyPercent = Math.min(100, Math.round((totalBookedMinutes / totalAvailableMinutes) * 100));

  // Per barber breakdown
  const barberMetrics = barbers.map((barber) => {
    const barberAppointments = confirmed.filter((a) => a.barberId === barber.id);
    const revenue = barberAppointments.reduce((acc, a) => acc + getServicePrice(a.serviceId), 0);
    const bookedMins = barberAppointments.reduce((acc, a) => {
      const diff = timeToMinutes(a.endTime) - timeToMinutes(a.startTime);
      return acc + (diff > 0 ? diff : getServiceDuration(a.serviceId));
    }, 0);
    const occ = Math.min(100, Math.round((bookedMins / 720) * 100));

    return {
      barber,
      appointmentsCount: barberAppointments.length,
      revenue,
      occupancy: occ,
    };
  });

  return (
    <div className="space-y-8 animate-fade-up">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos Estimados"
          value={formatCop(totalRevenue)}
          colorClass="text-gold"
        />
        <KpiCard
          title="Citas Confirmadas"
          value={confirmed.length}
          colorClass="text-success"
        />
        <KpiCard
          title="Tasa de Ocupación"
          value={`${occupancyPercent}%`}
          colorClass="text-gold-soft"
        />
        <KpiCard
          title="Citas Canceladas"
          value={cancelled.length}
          colorClass={cancelled.length > 0 ? 'text-danger' : 'text-muted'}
        />
      </div>

      {/* Visual Progress Bar for Occupancy */}
      <div className="card p-6 border border-line">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-cream text-lg">
            Nivel de Ocupación de la Sede ({locationName})
          </h3>
          <span className="text-gold font-bold text-sm">{occupancyPercent}% de capacidad</span>
        </div>
        <p className="text-xs text-muted mb-4">
          Calculado sobre {activeBarbers.length} barberos activos en jornada continua de 08:00 a 20:00.
        </p>
        <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden border border-line">
          <div
            className="bg-linear-to-r from-gold to-gold-strong h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(4, occupancyPercent)}%` }}
          />
        </div>
      </div>

      {/* Barber Performance Breakdown Table */}
      <div className="card p-6 border border-line">
        <h3 className="font-display font-semibold text-cream text-lg mb-4">
          Rendimiento por Barbero
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Barbero</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Citas Asignadas</th>
                <th className="py-3 px-4 text-center">Ocupación</th>
                <th className="py-3 px-4 text-right">Ingresos Generados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {barberMetrics.map(({ barber, appointmentsCount, revenue, occupancy }) => (
                <tr key={barber.id} className="hover:bg-surface-2/40 transition">
                  <td className="py-3 px-4 font-medium text-cream">
                    {barber.name}
                    <span className="block text-xs text-muted">{barber.specialty}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        barber.active
                          ? 'bg-success/15 text-success'
                          : 'bg-muted/15 text-muted'
                      }`}
                    >
                      {barber.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-cream">
                    {appointmentsCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-gold font-medium">{occupancy}%</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gold">
                    {formatCop(revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
