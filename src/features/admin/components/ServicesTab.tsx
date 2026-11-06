'use client';

import { useState } from 'react';
import type { Service } from '@/types/domain';
import { formatCop } from '@/utils/time';
import { ClockIcon, AlertIcon } from '@/components/ui/icons';
import { SERVICE_DURATION_OPTIONS } from '@/constants/schedule';

interface ServicesTabProps {
  services: Service[];
  onRefresh: () => void;
}

export default function ServicesTab({ services, onRefresh }: ServicesTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [priceCop, setPriceCop] = useState<number>(35000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(30);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          durationMinutes,
          priceCop,
          active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al agregar el servicio.');
        return;
      }

      setName('');
      setDescription('');
      setDurationMinutes(30);
      setPriceCop(35000);
      setIsAdding(false);
      onRefresh();
    } catch {
      setError('Error de conexión al agregar el servicio.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(service: Service) {
    setTogglingId(service.id);
    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          active: !service.active,
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

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditPrice(service.priceCop);
    setEditDuration(service.durationMinutes);
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          priceCop: editPrice,
          durationMinutes: editDuration,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-cream text-lg">
            Catálogo de Servicios ({services.length})
          </h3>
          <p className="text-sm text-muted">
            Configura tarifas y tiempos de atención del motor de citas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary text-sm px-4 py-2"
        >
          {isAdding ? 'Cerrar formulario' : '+ Nuevo Servicio'}
        </button>
      </div>

      {/* Add Service Form */}
      {isAdding && (
        <form
          onSubmit={handleAddService}
          className="card p-6 border border-gold/30 bg-surface-2 animate-fade-up space-y-4"
        >
          <h4 className="font-display font-semibold text-cream text-base">
            Crear Nuevo Servicio
          </h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="serviceName" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Nombre del Servicio
              </label>
              <input
                id="serviceName"
                type="text"
                placeholder="Ej. Barba Spa & Ritual"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field"
              />
            </div>

            <div>
              <label htmlFor="serviceDesc" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Descripción
              </label>
              <input
                id="serviceDesc"
                type="text"
                placeholder="Ej. Toalla caliente y exfoliación"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="serviceDuration" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Duración (Minutos)
              </label>
              <select
                id="serviceDuration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="field"
              >
                {SERVICE_DURATION_OPTIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur} minutos
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="servicePrice" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Precio (COP)
              </label>
              <input
                id="servicePrice"
                type="number"
                step="1000"
                min="5000"
                value={priceCop}
                onChange={(e) => setPriceCop(Number(e.target.value))}
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
              {loading ? 'Guardando...' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      )}

      {/* Services Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const isEditing = editingId === service.id;

          return (
            <div
              key={service.id}
              className={`card p-5 border flex flex-col justify-between transition ${
                service.active ? 'border-line hover:border-gold/40' : 'border-line/40 opacity-60 bg-surface-2/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-cream text-lg">{service.name}</h4>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={service.active}
                    disabled={togglingId === service.id}
                    onClick={() => handleToggleActive(service)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold ${
                      service.active ? 'bg-gold' : 'bg-surface-2 border border-line'
                    }`}
                  >
                    <span
                      className={`inline-block size-3.5 transform rounded-full bg-night transition-transform ${
                        service.active ? 'translate-x-4 bg-night' : 'translate-x-0.5 bg-muted'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-muted mb-4">{service.description}</p>
              </div>

              {/* Editing mode vs Normal display */}
              {isEditing ? (
                <div className="pt-4 border-t border-line space-y-3">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Precio (COP):</label>
                    <input
                      type="number"
                      step="1000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="field py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Duración:</label>
                    <select
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="field py-1.5 text-xs"
                    >
                      {SERVICE_DURATION_OPTIONS.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur} min
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-ghost text-xs px-2.5 py-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(service.id)}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <ClockIcon className="size-3.5 text-gold" />
                    <span>{service.durationMinutes} min</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-gold text-lg">
                      {formatCop(service.priceCop)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="text-xs text-muted hover:text-cream underline transition"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
