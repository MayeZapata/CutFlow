'use client';

import { useState } from 'react';
import BenchmarkChart from '@/components/ui/BenchmarkChart';
import KpiCard from '@/components/ui/KpiCard';
import StressAiAssistant from './StressAiAssistant';
import NpLab from './NpLab';

interface StressResult {
  volume: number;
  timeLogN: number;
  timeQuad: number;
  assigned: number;
  collisions: number;
  baseAppointmentsCount?: number;
  activeBarbersCount?: number;
  realExecution?: boolean;
  runId?: number;
}

const MAX_VOLUME = 6_000_000;
const MIN_VOLUME = 100;
const PRESET_LOAD_OPTIONS = [10000, 50000, 100000, 250000, 500000, 1000000, 3000000, 5000000] as const;

function isStressResult(data: unknown): data is StressResult {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return ['volume', 'timeLogN', 'timeQuad', 'assigned', 'collisions'].every(
    (key) => typeof record[key] === 'number',
  );
}

export default function StressLab() {
  const [labMode, setLabMode] = useState<'p-benchmark' | 'np-problems'>('p-benchmark');
  const [volume, setVolume] = useState<number>(10000);
  const [result, setResult] = useState<StressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const numberFormatter = new Intl.NumberFormat('es-CO');

  async function handleRun() {
    if (loading) return;

    if (!volume || volume < MIN_VOLUME || volume > MAX_VOLUME) {
      setError(`El volumen debe estar entre ${numberFormatter.format(MIN_VOLUME)} y ${numberFormatter.format(MAX_VOLUME)} solicitudes.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume }),
      });
      const data: unknown = await response.json();
      if (!response.ok || !isStressResult(data)) {
        setError('La prueba no devolvió resultados válidos. Inténtalo de nuevo.');
        return;
      }
      setResult(data);
    } catch {
      setError('No se pudo ejecutar la prueba. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="stress-title" className="card space-y-6 p-5 sm:p-8">
      {/* Selector de Modo Principal: P vs NP */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setLabMode('p-benchmark')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            labMode === 'p-benchmark'
              ? 'bg-gold text-night shadow-md shadow-gold/20'
              : 'border border-line bg-surface-2/60 text-muted hover:border-gold/40 hover:text-cream'
          }`}
        >
          <span>CPU</span>
          <span>Motor P: Intervalos (O(n log n) vs O(n²))</span>
        </button>

        <button
          type="button"
          onClick={() => setLabMode('np-problems')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            labMode === 'np-problems'
              ? 'bg-gold text-night shadow-md shadow-gold/20'
              : 'border border-line bg-surface-2/60 text-muted hover:border-gold/40 hover:text-cream'
          }`}
        >
          <span>NP</span>
          <span>Problemas NP y NP-Completos (Subset Sum & 3-Coloring)</span>
        </button>
      </div>

      {labMode === 'np-problems' ? (
        <NpLab />
      ) : (
        <>
          <header>
            <p className="eyebrow">Monitoreo y Rendimiento</p>
            <h2 id="stress-title" className="mt-1 font-display text-2xl font-semibold">
              Laboratorio de estrés de algoritmos
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ejecuta en tiempo real sobre Node.js la comparación del motor de intervalos $O(n \log n)$ contra la búsqueda ingenua $O(n^2)$, tomando citas base reales desde MongoDB.
            </p>
          </header>

      {/* Selector de volumen dinámico: personalizable hasta 1.000.000 de solicitudes */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
              <label htmlFor="loadSizeInput">Volumen de carga (solicitudes a evaluar)</label>
              <span className="text-xs text-gold font-medium">
                Hasta {numberFormatter.format(MAX_VOLUME)} solicitudes
              </span>
            </div>
            <div className="relative">
              <input
                id="loadSizeInput"
                type="number"
                min={MIN_VOLUME}
                max={MAX_VOLUME}
                step={1000}
                value={volume || ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === '') {
                    setVolume(0);
                    return;
                  }
                  const val = Number(raw);
                  if (!isNaN(val)) {
                    setVolume(Math.min(MAX_VOLUME, Math.max(0, val)));
                  }
                }}
                className="field pr-28 text-base font-semibold text-cream"
                placeholder={`Ej. ${numberFormatter.format(MAX_VOLUME)}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted pointer-events-none">
                solicitudes
              </span>
            </div>
          </div>

          <button
            id="run-stress-btn"
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="btn-primary shrink-0"
          >
            {loading ? 'Ejecutando en CPU...' : 'Ejecutar prueba'}
          </button>
        </div>

        {/* Botones de acceso rápido a cargas típicas */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-muted">Cargas rápidas:</span>
          {PRESET_LOAD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              disabled={loading}
              onClick={() => setVolume(option)}
              className={`rounded-xl px-2.5 py-1 text-xs font-medium transition border ${
                volume === option
                  ? 'border-gold bg-gold/20 text-gold shadow-sm shadow-gold/20'
                  : 'border-line bg-surface-2/60 text-muted hover:border-gold/40 hover:text-cream'
              }`}
            >
              {numberFormatter.format(option)}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {error ? <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/30">{error}</p> : null}
      </div>

      {result?.realExecution && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 border border-line text-xs text-cream">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span>
            Ejecución real en el servidor evaluando <strong className="text-gold">{numberFormatter.format(result.volume)}</strong> solicitudes en conflicto sobre <strong className="text-gold">{result.baseAppointmentsCount ?? 0}</strong> citas activas de MongoDB.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Tiempo O(n log n)" value={result ? `${result.timeLogN} ms` : '—'} colorClass="text-success" />
        <KpiCard title="Tiempo O(n²)" value={result ? `${result.timeQuad} ms` : '—'} colorClass="text-danger" />
        <KpiCard title="Citas asignadas" value={result ? numberFormatter.format(result.assigned) : '—'} />
        <KpiCard title="Colisiones evitadas" value={result ? numberFormatter.format(result.collisions) : '—'} />
      </div>

      {/* Zona de Gráfica de Rendimiento y Asistente IA (Lado a lado y modo ampliado) */}
      <div className="relative mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Columna Izquierda: Gráfica de Rendimiento en CPU (5 columnas en desktop, se oculta al ampliar el chat) */}
          {!isChatExpanded && (
            <div className="lg:col-span-5 flex flex-col justify-between">
              {result ? (
                <div className="rounded-3xl border border-line bg-surface-2/60 p-4 sm:p-5 flex flex-col justify-between h-[500px]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Comparativa de CPU (ms)
                      </h3>
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
                        {(result.timeQuad / (result.timeLogN || 1)).toFixed(1)}x más veloz
                      </span>
                    </div>
                    <div className="h-[300px] w-full">
                      <BenchmarkChart logN={result.timeLogN} quad={result.timeQuad} />
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 pt-3 border-t border-line/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-success shrink-0" />
                      <span className="text-muted text-[11px]">
                        O(n log n): <strong className="text-cream">{result.timeLogN} ms</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-danger shrink-0" />
                      <span className="text-muted text-[11px]">
                        O(n²): <strong className="text-cream">{result.timeQuad} ms</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-line bg-surface-2/30 p-8 flex flex-col items-center justify-center text-center text-sm text-muted h-[500px]">
                  
                  <p className="font-medium text-cream/90">Gráfica en tiempo real</p>
                  <p className="mt-1 text-xs text-muted max-w-xs">
                    Ejecuta una prueba arriba para ver las barras comparativas de latencia en CPU.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Columna Derecha: Asistente IA (7 columnas en normal, 12 columnas cuando se amplía) */}
          <div
            className={`transition-all duration-300 ${
              isChatExpanded ? 'lg:col-span-12' : 'lg:col-span-7'
            }`}
          >
            <StressAiAssistant
              result={result}
              isExpanded={isChatExpanded}
              onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
            />
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
}
