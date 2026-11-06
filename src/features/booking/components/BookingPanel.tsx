'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useAppointment } from '@/hooks/useAppointment';
import { useTodayIsoDate } from '@/hooks/useTodayIsoDate';
import { AlertIcon, CheckIcon, ClockIcon, MapPinIcon, StarIcon } from '@/components/ui/icons';
import { addMinutesToTime, formatCop, formatDisplayDate, timeToMinutes } from '@/utils/time';
import { BARBERS, CLOSING_TIME, LOCATIONS, OPENING_TIME, SERVICES, SLOT_STEP_SECONDS } from '../constants';
import type { Appointment, Barber, BookingErrors, BookingFeedback, Location, Service } from '../types';
import AppointmentList from './AppointmentList';
import OptionCard from './OptionCard';
import StepLegend from './StepLegend';

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2);
}

export default function BookingPanel() {
  const [locations, setLocations] = useState<Location[]>(() => [...LOCATIONS]);
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [services, setServices] = useState<Service[]>(() => [...SERVICES]);
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState(SERVICES[1]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const today = useTodayIsoDate();
  // Empty until the user picks a date; falls back to today.
  const [pickedDate, setPickedDate] = useState('');
  const date = pickedDate || today;
  const [startTime, setStartTime] = useState('');
  const [errors, setErrors] = useState<BookingErrors>({});
  const [feedback, setFeedback] = useState<BookingFeedback | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { validate, loading } = useAppointment();
  const { user } = useAuth();
  const router = useRouter();

  // Prefill customer name if authenticated
  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
  }, [user, customerName]);

  // Load locations dynamically from database
  useEffect(() => {
    let isMounted = true;
    fetch('/api/locations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.locations?.length > 0) {
          setLocations(data.locations);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Load services dynamically from database
  useEffect(() => {
    let isMounted = true;
    fetch('/api/services?onlyActive=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.services?.length > 0) {
          setServices(data.services);
          setServiceId((current) => {
            if (data.services.some((s: Service) => s.id === current)) return current;
            return data.services[0].id;
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Load barbers dynamically from database whenever locationId changes
  useEffect(() => {
    let isMounted = true;
    setBarbersLoading(true);
    fetch(`/api/barbers?locationId=${locationId}&onlyActive=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.barbers) {
          setBarbers(data.barbers);
        } else {
          const fallback = BARBERS.filter((item) => item.locationId === locationId);
          setBarbers(fallback);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback = BARBERS.filter((item) => item.locationId === locationId);
          setBarbers(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setBarbersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locationId]);

  // Reset barberId if it is no longer valid in the newly loaded list
  useEffect(() => {
    if (barberId && !barbers.some((b) => b.id === barberId)) {
      setBarberId('');
    }
  }, [barbers, barberId]);

  const location = locations.find((item) => item.id === locationId);
  const barber = barbers.find((item) => item.id === barberId);
  const service = services.find((item) => item.id === serviceId);
  const endTime = startTime && service ? addMinutesToTime(startTime, service.durationMinutes) : '';

  function handleLocationSelect(nextLocationId: string) {
    setLocationId(nextLocationId);
    setBarberId('');
  }

  function clearError(field: keyof BookingErrors) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function validateForm(): BookingErrors {
    const nextErrors: BookingErrors = {};

    if (!customerName.trim()) nextErrors.customerName = 'Por favor ingresa tu nombre completo.';

    if (!barber) nextErrors.barber = 'Elige un barbero para continuar.';

    if (!date) nextErrors.date = 'Selecciona la fecha de tu cita.';
    else if (date < today) nextErrors.date = 'La fecha no puede estar en el pasado.';

    if (!startTime) {
      nextErrors.startTime = 'Selecciona la hora de inicio.';
    } else if (service) {
      const start = timeToMinutes(startTime);
      const end = start + service.durationMinutes;
      if (start < timeToMinutes(OPENING_TIME) || end > timeToMinutes(CLOSING_TIME)) {
        nextErrors.startTime = `Atendemos de ${OPENING_TIME} a ${CLOSING_TIME}. Tu servicio debe terminar antes del cierre.`;
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!user) {
      router.push('/login?returnTo=/#reserva');
      return;
    }

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0 || !barber || !service || !location) return;

    // Collisions and appointments are tracked on the server per barber and date
    const clientName = customerName.trim() || 'Cliente Online';
    const result = await validate(barber.id, startTime, endTime, {
      locationId: location.id,
      serviceId: service.id,
      date,
      customerName: clientName,
    });

    if (!result) {
      setFeedback({
        type: 'error',
        message: 'No pudimos validar tu cita. Revisa tu conexión e inténtalo de nuevo.',
      });
      return;
    }

    const appointment: Appointment = {
      id: result.appointment?.id || crypto.randomUUID(),
      locationLabel: `${location.city} – ${location.name}`,
      barberName: barber.name,
      serviceName: service.name,
      date,
      startTime,
      endTime,
      status: result.valid ? 'confirmed' : 'rejected',
    };
    setAppointments((previous) => [appointment, ...previous]);

    if (result.valid) {
      setFeedback({
        type: 'success',
        message: `¡Listo, ${clientName}! Tu cita con ${barber.name} quedó confirmada para el ${formatDisplayDate(date)} a las ${startTime}.`,
      });
      setStartTime('');
    } else {
      setFeedback({
        type: 'error',
        message: `${barber.name} ya tiene una cita en ese horario. Prueba con otra hora.`,
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        id="booking-form"
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="reserva-title"
        className="card animate-fade-up space-y-10 p-5 sm:p-8 lg:col-span-2"
      >
        <header>
          <p className="eyebrow">Reserva en línea</p>
          <h2 id="reserva-title" className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Agenda tu cita
          </h2>
        </header>

        {/* Step 1 – Location */}
        <fieldset>
          <StepLegend step={1} title="Elige tu sede" />
          <div className="grid gap-3 sm:grid-cols-2">
            {locations.map((item) => (
              <OptionCard
                key={item.id}
                name="location"
                value={item.id}
                checked={locationId === item.id}
                onSelect={handleLocationSelect}
              >
                <span className="flex items-center gap-2 font-medium">
                  <MapPinIcon className="size-4 text-gold" />
                  {item.city} – {item.name}
                </span>
                <span className="text-sm text-muted">{item.address}</span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

        {/* Step 2 – Barber */}
        <fieldset aria-describedby={errors.barber ? 'barber-error' : undefined}>
          <StepLegend
            step={2}
            title="Elige tu barbero"
            description={`Disponibles en ${location?.name ?? 'tu sede'}`}
          />
          {barbersLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card p-5 border border-line animate-pulse flex items-center gap-3">
                <div className="size-11 rounded-full bg-surface-2" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-2 rounded w-28" />
                  <div className="h-3 bg-surface-2 rounded w-20" />
                </div>
              </div>
              <div className="card p-5 border border-line animate-pulse flex items-center gap-3">
                <div className="size-11 rounded-full bg-surface-2" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-2 rounded w-28" />
                  <div className="h-3 bg-surface-2 rounded w-20" />
                </div>
              </div>
            </div>
          ) : barbers.length === 0 ? (
            <div className="card p-6 text-center border-line/60 bg-surface-2/40">
              <p className="text-sm text-muted">
                No hay barberos disponibles en esta sede en este momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {barbers.map((item) => (
                <OptionCard
                  key={item.id}
                  name="barber"
                  value={item.id}
                  checked={barberId === item.id}
                  onSelect={(value) => {
                    setBarberId(value);
                    clearError('barber');
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-gold/30 to-gold-strong/10 font-display font-semibold text-gold-soft ring-1 ring-gold/30"
                    >
                      {getInitials(item.name)}
                    </span>
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-sm text-muted">{item.specialty}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-gold">
                        <StarIcon className="size-3.5" />
                        {(item.rating || 5.0).toFixed(1)}
                        <span className="sr-only">de 5 estrellas</span>
                      </span>
                    </span>
                  </span>
                </OptionCard>
              ))}
            </div>
          )}
          {errors.barber ? (
            <p id="barber-error" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertIcon className="size-4" />
              {errors.barber}
            </p>
          ) : null}
        </fieldset>

        {/* Step 3 – Service */}
        <fieldset>
          <StepLegend step={3} title="Elige tu servicio" />
          <div className="grid gap-3 sm:grid-cols-3">
            {services.map((item) => (
              <OptionCard
                key={item.id}
                name="service"
                value={item.id}
                checked={serviceId === item.id}
                onSelect={setServiceId}
              >
                <span className="pr-6 font-medium">{item.name}</span>
                <span className="text-sm text-muted">{item.description}</span>
                <span className="mt-2 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <ClockIcon className="size-4" />
                    {item.durationMinutes} min
                  </span>
                  <span className="font-semibold text-gold">{formatCop(item.priceCop)}</span>
                </span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

        {/* Step 4 – Customer Info, Date & time */}
        <fieldset>
          <StepLegend
            step={4}
            title="Tus datos, fecha y hora"
            description={`Horario de atención: ${OPENING_TIME} – ${CLOSING_TIME}`}
          />
          <div className="mb-4">
            <label htmlFor="customerName" className="mb-1.5 block text-sm font-medium">
              Tu nombre completo
            </label>
            <input
              id="customerName"
              type="text"
              placeholder="Ej. Andrés Restrepo"
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                clearError('customerName');
              }}
              aria-invalid={errors.customerName ? true : undefined}
              aria-describedby={errors.customerName ? 'customerName-error' : undefined}
              className="field"
            />
            {errors.customerName ? (
              <p id="customerName-error" className="mt-1.5 flex items-center gap-1.5 text-sm text-danger">
                <AlertIcon className="size-4" />
                {errors.customerName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-medium">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                value={date}
                min={today || undefined}
                onChange={(event) => {
                  setPickedDate(event.target.value);
                  clearError('date');
                }}
                aria-invalid={errors.date ? true : undefined}
                aria-describedby={errors.date ? 'date-error' : undefined}
                className="field"
              />
              {errors.date ? (
                <p id="date-error" className="mt-1.5 text-sm text-danger">
                  {errors.date}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="startTime" className="mb-1.5 block text-sm font-medium">
                Hora de inicio
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                min={OPENING_TIME}
                max={CLOSING_TIME}
                step={SLOT_STEP_SECONDS}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  clearError('startTime');
                }}
                aria-invalid={errors.startTime ? true : undefined}
                aria-describedby={errors.startTime ? 'startTime-error' : undefined}
                className="field"
              />
              {errors.startTime ? (
                <p id="startTime-error" className="mt-1.5 text-sm text-danger">
                  {errors.startTime}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="endTime" className="mb-1.5 block text-sm font-medium">
                Hora de fin
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                readOnly
                tabIndex={-1}
                aria-describedby="endTime-hint"
                className="field cursor-default border-dashed text-muted"
              />
              <p id="endTime-hint" className="mt-1.5 text-xs text-muted">
                Se calcula según el servicio.
              </p>
            </div>
          </div>
        </fieldset>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section aria-labelledby="resumen-title" className="card relative overflow-hidden p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 size-48 animate-glow rounded-full bg-gold/20 blur-3xl"
          />
          <h2 id="resumen-title" className="font-display text-lg font-semibold">
            Resumen
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {customerName.trim() ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Cliente</dt>
                <dd className="text-right font-medium text-cream">{customerName.trim()}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sede</dt>
              <dd className="text-right">{location ? `${location.city} – ${location.name}` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Barbero</dt>
              <dd className="text-right">{barber?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Servicio</dt>
              <dd className="text-right">{service?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Horario</dt>
              <dd className="text-right">{startTime && endTime ? `${startTime} – ${endTime}` : '—'}</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
            <span className="text-sm text-muted">Total</span>
            <span className="font-display text-2xl font-semibold text-gold">
              {service ? formatCop(service.priceCop) : '—'}
            </span>
          </div>

          {!user ? (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-cream flex items-center justify-between">
                <span>💡 Debes iniciar sesión para confirmar tu cita.</span>
                <Link
                  href="/login?returnTo=/#reserva"
                  className="text-gold font-semibold underline hover:text-gold-soft ml-2 shrink-0"
                >
                  Entrar
                </Link>
              </div>
              <Link
                href="/login?returnTo=/#reserva"
                className="btn-primary w-full text-center justify-center py-3 text-sm flex items-center gap-2 shadow-lg shadow-gold/20"
              >
                <span>Iniciar sesión para reservar</span>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          ) : (
            <button type="submit" form="booking-form" disabled={loading} className="btn-primary mt-6 w-full">
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-night/30 border-t-night"
                  />
                  Validando disponibilidad…
                </>
              ) : (
                'Confirmar cita'
              )}
            </button>
          )}

          <div aria-live="polite" className="mt-4 empty:hidden">
            {feedback ? (
              <p
                className={`flex animate-fade-up items-start gap-2 rounded-xl p-3 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-success/10 text-success ring-1 ring-success/30'
                    : 'bg-danger/10 text-danger ring-1 ring-danger/30'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckIcon className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <AlertIcon className="mt-0.5 size-4 shrink-0" />
                )}
                {feedback.message}
              </p>
            ) : null}
          </div>
        </section>

        <AppointmentList appointments={appointments} />
      </aside>
    </div>
  );
}
