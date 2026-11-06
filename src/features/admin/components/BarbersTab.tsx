'use client';

import { useEffect, useState } from 'react';
import type { Barber, Location } from '@/types/domain';
import { StarIcon, AlertIcon } from '@/components/ui/icons';

interface BarbersTabProps {
  barbers: Barber[];
  locationId: string;
  locations?: Location[];
  onRefresh: () => void;
}

export default function BarbersTab({ barbers, locationId, locations = [], onRefresh }: BarbersTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [targetLocationId, setTargetLocationId] = useState(locationId);
  const [rating, setRating] = useState('5.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Sync target location when selected branch changes
  useEffect(() => {
    setTargetLocationId(locationId);
  }, [locationId]);

  async function handleAddBarber(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          specialty,
          locationId: targetLocationId,
          rating: parseFloat(rating),
          active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al agregar el barbero.');
        return;
      }

      setName('');
      setSpecialty('');
      setRating('5.0');
      setIsAdding(false);
      onRefresh();
    } catch {
      setError('Error de conexión al agregar el barbero.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(barber: Barber) {
    setTogglingId(barber.id);
    try {
      const res = await fetch('/api/barbers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: barber.id,
          active: !barber.active,
        }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-cream text-lg">
            Equipo de Barberos ({barbers.length})
          </h3>
          <p className="text-sm text-muted">
            Gestiona la disponibilidad y el perfil de los barberos en esta sede.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary text-sm px-4 py-2"
        >
          {isAdding ? 'Cerrar formulario' : '+ Nuevo Barbero'}
        </button>
      </div>

      {/* Add Barber Form Modal/Card */}
      {isAdding && (
        <form
          onSubmit={handleAddBarber}
          className="card p-6 border border-gold/30 bg-surface-2 animate-fade-up space-y-4"
        >
          <h4 className="font-display font-semibold text-cream text-base">
            Registrar Nuevo Barbero
          </h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="barberName" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <input
                id="barberName"
                type="text"
                placeholder="Ej. Lucas Salazar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field"
              />
            </div>

            <div>
              <label htmlFor="barberSpecialty" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Especialidad
              </label>
              <input
                id="barberSpecialty"
                type="text"
                placeholder="Ej. Fade & Color"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                className="field"
              />
            </div>

            <div>
              <label htmlFor="barberLocation" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Sede de Asignación
              </label>
              <select
                id="barberLocation"
                value={targetLocationId}
                onChange={(e) => setTargetLocationId(e.target.value)}
                className="field bg-surface text-cream cursor-pointer"
              >
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-surface-2 text-cream">
                      {loc.city} – {loc.name}
                    </option>
                  ))
                ) : (
                  <option value={locationId} className="bg-surface-2 text-cream">
                    Sede actual ({locationId})
                  </option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="barberRating" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Calificación Inicial (1.0 - 5.0)
              </label>
              <input
                id="barberRating"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
                className="field"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
              <AlertIcon className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-4 py-2"
            >
              {loading ? 'Guardando...' : 'Guardar Barbero'}
            </button>
          </div>
        </form>
      )}

      {/* Barbers Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className={`card p-5 border flex items-center justify-between gap-4 transition ${
              barber.active ? 'border-line hover:border-gold/40' : 'border-line/40 opacity-60 bg-surface-2/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-linear-to-br from-gold/20 to-gold-strong/20 border border-gold/40 flex items-center justify-center font-display font-bold text-gold text-lg shrink-0">
                {barber.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h4 className="font-semibold text-cream text-base">{barber.name}</h4>
                <p className="text-xs text-muted">{barber.specialty}</p>
                <div className="flex items-center gap-1 text-gold text-xs mt-1">
                  <StarIcon className="size-3.5 fill-current" />
                  <span className="font-semibold">{barber.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Toggle switch for active/inactive */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={barber.active}
                disabled={togglingId === barber.id}
                onClick={() => handleToggleActive(barber)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                  barber.active ? 'bg-gold' : 'bg-surface-2 border border-line'
                }`}
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-night transition-transform ${
                    barber.active ? 'translate-x-6 bg-night' : 'translate-x-1 bg-muted'
                  }`}
                />
              </button>
              <span className="text-[11px] text-muted">
                {barber.active ? 'Disponible' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
