import { CalendarIcon, ClockIcon, ScissorsIcon } from '@/components/ui/icons';
import { formatDisplayDate } from '@/utils/time';
import type { Appointment } from '../types';

interface AppointmentListProps {
  appointments: Appointment[];
}

export default function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <section aria-labelledby="mis-citas-title" className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="mis-citas-title" className="font-display text-lg font-semibold">
          Mis citas
        </h2>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{appointments.length}</span>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
          <ScissorsIcon className="mx-auto mb-2 size-6 text-muted" />
          <p className="text-sm text-muted">Aún no tienes citas. ¡Agenda la primera!</p>
        </div>
      ) : (
        <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {appointments.map((appointment) => {
            const isConfirmed = appointment.status === 'confirmed';
            return (
              <li
                key={appointment.id}
                className={`animate-fade-up rounded-2xl border-l-4 bg-surface-2/70 p-4 ${
                  isConfirmed ? 'border-success' : 'border-danger'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{appointment.serviceName}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isConfirmed ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {isConfirmed ? 'Confirmada' : 'Horario ocupado'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {appointment.barberName} · {appointment.locationLabel}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 capitalize">
                    <CalendarIcon className="size-3.5" />
                    {formatDisplayDate(appointment.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {appointment.startTime} – {appointment.endTime}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
