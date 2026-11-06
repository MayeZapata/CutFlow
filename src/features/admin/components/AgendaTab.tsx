'use client';

import { useState, useEffect } from 'react';
import type { Appointment, Barber, Service } from '@/types/domain';
import { ClockIcon, ScissorsIcon, AlertIcon } from '@/components/ui/icons';
import { formatCop } from '@/utils/time';
import type { RescheduleModalState } from '../types';
import RescheduleModal from './RescheduleModal';
import Pagination from '@/components/ui/Pagination';

interface AgendaTabProps {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
  selectedBarberId: string;
  onSelectBarberId: (id: string) => void;
  onRefresh: () => void;
}

export default function AgendaTab({
  appointments,
  barbers,
  services,
  selectedBarberId,
  onSelectBarberId,
  onRefresh,
}: AgendaTabProps) {
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [modalState, setModalState] = useState<RescheduleModalState>({
    isOpen: false,
    appointmentId: '',
    customerName: '',
    barberName: '',
    serviceName: '',
    currentDate: '',
    currentStartTime: '',
    currentEndTime: '',
  });

  const totalAppointments = appointments.length;
  const totalConfirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const totalCancelled = appointments.filter((a) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((apt) => {
    if (selectedBarberId && apt.barberId !== selectedBarberId) return false;
    if (!showCancelled && apt.status === 'cancelled') return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));

  // Keep currentPage within bounds when filters or pageSize change
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredAppointments.length, pageSize, currentPage]);

  function handleSelectBarber(id: string) {
    onSelectBarberId(id);
    setCurrentPage(1);
  }

  function handleToggleCancelled(checked: boolean) {
    setShowCancelled(checked);
    setCurrentPage(1);
  }

  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function getBarberName(id: string) {
    return barbers.find((b) => b.id === id)?.name || id;
  }

  function getBarberAppointmentCount(barberId: string) {
    return appointments.filter((a) => a.barberId === barberId).length;
  }

  function getService(id: string) {
    return services.find((s) => s.id === id);
  }

  async function handleCancel(apt: Appointment) {
    if (!confirm(`¿Estás seguro de cancelar la cita de ${apt.customerName} a las ${apt.startTime}?`)) {
      return;
    }

    setCancellingId(apt.id);
    setActionError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: apt.id, action: 'cancel' }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'No se pudo cancelar la cita.');
        return;
      }
      onRefresh();
    } catch {
      setActionError('Error de red al cancelar la cita.');
    } finally {
      setCancellingId(null);
    }
  }

  function openReschedule(apt: Appointment) {
    const s = getService(apt.serviceId);
    setModalState({
      isOpen: true,
      appointmentId: apt.id,
      customerName: apt.customerName,
      barberName: getBarberName(apt.barberId),
      serviceName: s?.name || 'Servicio',
      currentDate: apt.date,
      currentStartTime: apt.startTime,
      currentEndTime: apt.endTime,
    });
  }

  return (
    <div className="space-y-6">
      {/* Total Appointments Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 sm:p-4 border border-line bg-surface flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Total Citas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-cream">
              {totalAppointments}
            </span>
            <span className="text-[11px] text-muted">en la fecha</span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 border border-line bg-surface flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-success uppercase tracking-wider flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success inline-block" />
            Confirmadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-success">
              {totalConfirmed}
            </span>
            <span className="text-[11px] text-muted">
              ({totalAppointments > 0 ? Math.round((totalConfirmed / totalAppointments) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 border border-line bg-surface flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-danger uppercase tracking-wider flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-danger inline-block" />
            Canceladas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-danger">
              {totalCancelled}
            </span>
            <span className="text-[11px] text-muted">
              ({totalAppointments > 0 ? Math.round((totalCancelled / totalAppointments) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 border border-line bg-surface flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gold uppercase tracking-wider">
            Filtradas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-gold">
              {filteredAppointments.length}
            </span>
            <span className="text-[11px] text-muted">
              {filteredAppointments.length === totalAppointments ? 'todas' : 'en vista'}
            </span>
          </div>
        </div>
      </div>

      {/* Barber filter pills & cancelled toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">
            Barbero:
          </span>
          <button
            type="button"
            onClick={() => handleSelectBarber('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedBarberId === ''
                ? 'bg-gold text-night font-bold shadow-md shadow-gold/20'
                : 'bg-surface-2 text-muted hover:text-cream border border-line'
            }`}
          >
            Todos ({totalAppointments})
          </button>
          {barbers.map((b) => {
            const count = getBarberAppointmentCount(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBarber(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedBarberId === b.id
                    ? 'bg-gold text-night font-bold shadow-md shadow-gold/20'
                    : 'bg-surface-2 text-muted hover:text-cream border border-line'
                }`}
              >
                {b.name} ({count}) {!b.active && '(Inactivo)'}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted hover:text-cream">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => handleToggleCancelled(e.target.checked)}
            className="rounded border-line bg-surface-2 text-gold focus:ring-gold"
          />
          <span>Mostrar citas canceladas</span>
        </label>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
          <AlertIcon className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Appointment list timeline */}
      {filteredAppointments.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-line">
          <ScissorsIcon className="mx-auto size-10 text-muted/50 mb-3" />
          <h4 className="font-display text-lg font-semibold text-cream">No hay citas registradas</h4>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            No se encontraron citas para esta fecha y barbero seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {paginatedAppointments.map((apt) => {
            const isConfirmed = apt.status === 'confirmed';
            const s = getService(apt.serviceId);

            return (
              <div
                key={apt.id}
                className={`card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition border-l-4 ${
                  isConfirmed ? 'border-l-gold hover:border-gold/60' : 'border-l-muted/40 opacity-60'
                }`}
              >
                {/* Left: Time & Details */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-2 border border-line px-3 py-2 shrink-0 min-w-[90px]">
                    <span className="flex items-center gap-1 text-xs font-semibold text-gold">
                      <ClockIcon className="size-3" />
                      {apt.startTime}
                    </span>
                    <span className="text-[11px] text-muted">{apt.endTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-cream text-base">{apt.customerName}</h4>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isConfirmed ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {isConfirmed ? 'Confirmada' : 'Cancelada'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1.5">
                      <span className="text-gold-soft font-medium">
                        💈 {getBarberName(apt.barberId)}
                      </span>
                      <span>•</span>
                      <span>✂️ {s?.name || 'Servicio'} ({s?.durationMinutes || 30} min)</span>
                      <span>•</span>
                      <span className="text-cream font-semibold">
                        {s ? formatCop(s.priceCop) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isConfirmed && (
                    <>
                      <button
                        type="button"
                        onClick={() => openReschedule(apt)}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        disabled={cancellingId === apt.id}
                        onClick={() => handleCancel(apt)}
                        className="rounded-xl border border-danger/30 text-danger hover:bg-danger/10 px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
                      >
                        {cancellingId === apt.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAppointments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="citas"
          />
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        state={modalState}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={onRefresh}
      />
    </div>
  );
}
