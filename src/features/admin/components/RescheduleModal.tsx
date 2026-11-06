'use client';

import { useState } from 'react';
import { AlertIcon, ClockIcon } from '@/components/ui/icons';
import { OPENING_TIME, CLOSING_TIME, SLOT_STEP_SECONDS } from '@/constants/schedule';
import type { RescheduleModalState } from '../types';

interface RescheduleModalProps {
  state: RescheduleModalState;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({ state, onClose, onSuccess }: RescheduleModalProps) {
  const [newDate, setNewDate] = useState(state.currentDate);
  const [newStartTime, setNewStartTime] = useState(state.currentStartTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.isOpen) return null;

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: state.appointmentId,
          action: 'reschedule',
          date: newDate,
          startTime: newStartTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.reason === 'Collision') {
          setError(`Conflicto de horario: ${state.barberName} ya tiene una cita reservada que se solapa en este intervalo.`);
        } else {
          setError(data.error || 'Error al reprogramar la cita.');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión al reprogramar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reschedule-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up"
    >
      <div className="card w-full max-w-lg p-6 sm:p-8 border border-gold/30 bg-surface-2 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 text-muted hover:text-cream text-xl p-1 rounded-lg"
        >
          &times;
        </button>

        <div className="flex items-center gap-2 text-gold text-xs font-semibold tracking-wider uppercase mb-1">
          <ClockIcon className="size-4" />
          <span>Gestión de Citas</span>
        </div>
        <h3 id="modal-reschedule-title" className="font-display text-2xl font-bold text-cream">
          Reprogramar Cita
        </h3>
        <p className="text-sm text-muted mt-1">
          Cliente: <strong className="text-cream">{state.customerName}</strong> · Barbero: <strong className="text-gold">{state.barberName}</strong>
        </p>

        <form onSubmit={handleReschedule} className="mt-6 space-y-4">
          <div>
            <label htmlFor="newDate" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Nueva Fecha
            </label>
            <input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="field"
            />
          </div>

          <div>
            <label htmlFor="newStartTime" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Nueva Hora de Inicio ({OPENING_TIME} - {CLOSING_TIME})
            </label>
            <input
              id="newStartTime"
              type="time"
              min={OPENING_TIME}
              max={CLOSING_TIME}
              step={SLOT_STEP_SECONDS}
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              required
              className="field"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2">
              <AlertIcon className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-line mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-ghost text-sm px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm px-5 py-2"
            >
              {loading ? 'Validando horario...' : 'Confirmar Reprogramación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
