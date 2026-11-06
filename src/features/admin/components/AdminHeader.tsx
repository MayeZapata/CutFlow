'use client';

import { MapPinIcon, CalendarIcon } from '@/components/ui/icons';
import { LOCATIONS } from '@/features/booking/constants';
import type { Location } from '@/types/domain';
import { formatDisplayDate } from '@/utils/time';
import type { AdminTab } from '../types';

interface AdminHeaderProps {
  selectedLocationId: string;
  onSelectLocationId: (id: string) => void;
  locations?: Location[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayIsoDate: string;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  totalAppointments?: number;
}

export default function AdminHeader({
  selectedLocationId,
  onSelectLocationId,
  locations = [],
  selectedDate,
  onSelectDate,
  todayIsoDate,
  activeTab,
  onSelectTab,
  totalAppointments,
}: AdminHeaderProps) {
  function changeDate(days: number) {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onSelectDate(`${yyyy}-${mm}-${dd}`);
  }

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'agenda', label: 'Agenda del Día', count: totalAppointments },
    { id: 'metrics', label: 'Métricas de Sede' },
    { id: 'barbers', label: 'Equipo de Barberos' },
    { id: 'services', label: 'Servicios y Precios' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Location and Date Controls */}
      <div className="card p-5 sm:p-6 border border-line bg-surface/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Location Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              Sede Activa
            </span>
            <span className="text-[10px] font-semibold bg-success/15 text-success px-2 py-0.5 rounded-full">
              En Línea
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(locations.length > 0 ? locations : LOCATIONS).map((loc) => {
              const isSelected = loc.id === selectedLocationId;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectLocationId(loc.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-linear-to-r from-gold to-gold-strong text-night shadow-lg shadow-gold/20 scale-[1.02]'
                      : 'bg-surface-2 text-muted hover:text-cream border border-line'
                  }`}
                >
                  <span>{loc.city} – {loc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Date navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-2 border border-line p-1">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              aria-label="Día anterior"
              className="px-2.5 py-1.5 text-xs text-muted hover:text-cream rounded-lg hover:bg-surface transition"
            >
              &lsaquo;
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <CalendarIcon className="size-4 text-gold shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-cream focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => changeDate(1)}
              aria-label="Día siguiente"
              className="px-2.5 py-1.5 text-xs text-muted hover:text-cream rounded-lg hover:bg-surface transition"
            >
              &rsaquo;
            </button>
          </div>

          {selectedDate !== todayIsoDate && todayIsoDate && (
            <button
              type="button"
              onClick={() => onSelectDate(todayIsoDate)}
              className="btn-ghost text-xs py-2 px-3 shrink-0"
            >
              Ir a Hoy
            </button>
          )}
        </div>
      </div>

      {/* Date display label */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-medium text-muted capitalize">
          Visualizando fecha: <strong className="text-gold-soft">{formatDisplayDate(selectedDate)}</strong>
        </p>
        {typeof totalAppointments === 'number' && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-surface-2 border border-line text-muted">
            Total citas en sede:{' '}
            <strong className="text-gold font-bold">{totalAppointments}</strong>
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <nav aria-label="Navegación del panel de administración">
        <ul className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/40 shadow-sm shadow-gold/10'
                      : 'text-muted hover:text-cream hover:bg-surface-2/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold transition ${
                        isActive
                          ? 'bg-gold text-night'
                          : 'bg-surface-2 text-muted border border-line'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
