'use client';

import { useEffect, useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import { AlertIcon, MapPinIcon } from '@/components/ui/icons';

interface SuperadminStats {
  connected: boolean;
  databaseName?: string;
  pingMs?: number;
  stats?: {
    locationsCount: number;
    totalBarbers: number;
    activeBarbers: number;
    totalServices: number;
    totalAppointments: number;
    confirmedAppointments: number;
    cancelledAppointments: number;
  };
  locationsSummary?: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    barbersCount: number;
    activeBarbersCount: number;
  }>;
  error?: string;
}

async function fetchStats(): Promise<SuperadminStats> {
  try {
    const res = await fetch('/api/superadmin/stats');
    if (!res.ok) {
      return { connected: false, error: 'No se pudo consultar el estado de la base de datos.' };
    }
    const json: SuperadminStats = await res.json();
    return json;
  } catch {
    return { connected: false, error: 'Error de red al consultar MongoDB.' };
  }
}

export default function DatabaseOverview() {
  const [data, setData] = useState<SuperadminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    setRefreshing(true);
    const result = await fetchStats();
    setData(result);
    setRefreshing(false);
  }

  useEffect(() => {
    let isMounted = true;
    fetchStats().then((result) => {
      if (!isMounted) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section aria-labelledby="db-status-title" className="card p-5 sm:p-8 space-y-6 mb-8">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">Base de Datos</span>
            {data?.connected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                MongoDB Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30">
                <span className="size-1.5 rounded-full bg-danger" />
                Desconectado
              </span>
            )}
          </div>
          <h2 id="db-status-title" className="font-display text-2xl font-semibold text-cream">
            Estado Global de MongoDB
          </h2>
          <p className="text-sm text-muted">
            Métricas de las colecciones activas en{' '}
            <code className="text-gold bg-surface-2 px-1.5 py-0.5 rounded text-xs">
              {data?.databaseName || 'barber_db'}
            </code>{' '}
            {data?.pingMs !== undefined ? `· Latencia de consulta: ${data.pingMs} ms` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading || refreshing}
          className="btn-ghost text-xs px-3.5 py-2 self-start sm:self-center flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-gold" />
              Actualizando...
            </>
          ) : (
            '↻ Actualizar métricas'
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted">
          <div className="size-6 mx-auto mb-2 animate-spin rounded-full border-2 border-night border-t-gold" />
          <p className="text-sm">Consultando colecciones de MongoDB...</p>
        </div>
      ) : data?.error ? (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
          <AlertIcon className="size-5 shrink-0" />
          <span>{data.error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              title="Sedes en Sistema"
              value={data?.stats?.locationsCount ?? 0}
              colorClass="text-gold"
            />
            <KpiCard
              title="Barberos Totales"
              value={`${data?.stats?.activeBarbers ?? 0} activos / ${data?.stats?.totalBarbers ?? 0}`}
              colorClass="text-cream"
            />
            <KpiCard
              title="Servicios Activos"
              value={data?.stats?.totalServices ?? 0}
              colorClass="text-muted"
            />
            <KpiCard
              title="Citas Registradas"
              value={data?.stats?.totalAppointments ?? 0}
              colorClass="text-success"
            />
          </div>

          {/* Locations Summary Breakdown */}
          {data?.locationsSummary && data.locationsSummary.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface-2/40 p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm text-cream uppercase tracking-wider flex items-center gap-2">
                <MapPinIcon className="size-4 text-gold" />
                Desglose de Sedes y Barberos Asignados
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.locationsSummary.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-xl border border-line bg-surface/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-cream text-sm">
                        {loc.city} – {loc.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold font-semibold">
                        {loc.activeBarbersCount} {loc.activeBarbersCount === 1 ? 'barbero' : 'barberos'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{loc.address}</p>
                    <p className="text-[11px] text-muted/80">
                      ID en BD: <span className="font-mono text-cream/70">{loc.id}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
