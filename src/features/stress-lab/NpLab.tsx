'use client';

import { useState } from 'react';
import {
  ServiceItem,
  ConflictRule,
  verifyProposal,
  solveExactGapDP,
  verifyGraphColoring,
  solveStationAssignment,
  VerificationResult,
  DpSolutionResult,
} from '@/utils/algorithms/npLabAlgorithms';

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 'A', name: 'Corte Fade Clásico', durationMinutes: 30, category: 'Corte' },
  { id: 'B', name: 'Perfilado & Barba Spa', durationMinutes: 25, category: 'Barba' },
  { id: 'C', name: 'Limpieza Facial Profunda', durationMinutes: 20, category: 'Tratamiento' },
  { id: 'D', name: 'Tinte & Matizado', durationMinutes: 45, category: 'Color' },
  { id: 'E', name: 'Cejas & Contorno', durationMinutes: 15, category: 'Estética' },
  { id: 'F', name: 'Mascarilla Negra Carbón', durationMinutes: 10, category: 'Spa' },
  { id: 'G', name: 'Corte Premium & Lavado', durationMinutes: 40, category: 'Corte' },
];

const PRESET_TARGETS = [45, 60, 75, 90, 100];

const BARBER_NODES = [
  { id: 'A', name: 'Barbero A (Corte Fade)' },
  { id: 'B', name: 'Barbero B (Tinte Químico)' },
  { id: 'C', name: 'Barbero C (Tratamiento Capilar)' },
  { id: 'D', name: 'Barbero D (Barba Premium)' },
];

const DEFAULT_CONFLICTS: ConflictRule[] = [
  { serviceA: 'A', serviceB: 'B', reason: 'Comparten máquina vaporizadora facial' },
  { serviceA: 'A', serviceB: 'C', reason: 'Comparten el sillón con toma eléctrica especial' },
  { serviceA: 'B', serviceB: 'C', reason: 'Comparten extractor de humos de tintes' },
  { serviceA: 'B', serviceB: 'D', reason: 'Comparten esterilizador UV principal' },
  { serviceA: 'C', serviceB: 'D', reason: 'Comparten la única estación de lava-cabezas' },
];

const STATION_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  1: { bg: 'bg-gold/10', border: 'border-gold', text: 'text-gold', badge: 'bg-gold text-night' },
  2: { bg: 'bg-blue-500/10', border: 'border-blue-400', text: 'text-blue-300', badge: 'bg-blue-400 text-night' },
  3: { bg: 'bg-emerald-500/10', border: 'border-emerald-400', text: 'text-emerald-300', badge: 'bg-emerald-400 text-night' },
};

export default function NpLab() {
  const [activeTab, setActiveTab] = useState<'subset-sum' | 'graph-coloring'>('subset-sum');

  // --- Estado Módulo 1: Subset Sum ---
  const [targetMinutes, setTargetMinutes] = useState<number>(75);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['A', 'B', 'C']);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [dpResult, setDpResult] = useState<DpSolutionResult | null>(null);

  // --- Estado Módulo 2: Graph Coloring ---
  const [assignments, setAssignments] = useState<Record<string, number>>({ A: 1, B: 2, C: 3, D: 1 });
  const [graphVerification, setGraphVerification] = useState<{
    isValid: boolean;
    conflictViolations: ConflictRule[];
    executionTimeMs: number;
  } | null>(null);
  const [graphSolveMeta, setGraphSolveMeta] = useState<{ steps: number; timeMs: number } | null>(null);

  // Helpers Módulo 1
  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setVerificationResult(null);
  }

  function handleVerifySubset() {
    const selectedServices = DEFAULT_SERVICES.filter((s) => selectedServiceIds.includes(s.id));
    const res = verifyProposal(selectedServices, targetMinutes);
    setVerificationResult(res);
  }

  function handleSolveSubsetDP() {
    const res = solveExactGapDP(DEFAULT_SERVICES, targetMinutes);
    setDpResult(res);
    if (res.found) {
      setSelectedServiceIds(res.combination.map((s) => s.id));
      setVerificationResult({
        isValid: true,
        totalDuration: res.totalDuration,
        diffMinutes: 0,
        executionTimeMs: res.executionTimeMs,
      });
    }
  }

  // Helpers Módulo 2
  function handleAssignStationManual(nodeId: string, station: number) {
    setAssignments((prev) => ({ ...prev, [nodeId]: station }));
    setGraphVerification(null);
  }

  function handleVerifyGraph() {
    const res = verifyGraphColoring(assignments, DEFAULT_CONFLICTS);
    setGraphVerification(res);
  }

  function handleSolveGraphAuto() {
    const res = solveStationAssignment(
      BARBER_NODES.map((n) => n.id),
      DEFAULT_CONFLICTS,
      3
    );
    if (res.success) {
      setAssignments(res.assignment);
      setGraphSolveMeta({ steps: res.stepsCount, timeMs: res.executionTimeMs });
      const verify = verifyGraphColoring(res.assignment, DEFAULT_CONFLICTS);
      setGraphVerification(verify);
    }
  }

  const currentSelectionSum = DEFAULT_SERVICES
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('subset-sum')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'subset-sum'
              ? 'bg-gold text-night shadow-md shadow-gold/20'
              : 'border border-line bg-surface-2/60 text-muted hover:border-gold/40 hover:text-cream'
          }`}
        >
          <span>⏱</span>
          <span>1. Huecos de Agenda (Subset Sum)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('graph-coloring')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'graph-coloring'
              ? 'bg-gold text-night shadow-md shadow-gold/20'
              : 'border border-line bg-surface-2/60 text-muted hover:border-gold/40 hover:text-cream'
          }`}
        >
          <span>💈</span>
          <span>2. Estaciones sin Conflicto (3-Coloring)</span>
        </button>
      </div>

      {/* ===================== TAB 1: SUBSET SUM ===================== */}
      {activeTab === 'subset-sum' && (
        <div className="space-y-6">
          <header className="rounded-2xl border border-line bg-surface-2/40 p-4">
            <span className="eyebrow">Problema NP-Completo #1</span>
            <h3 className="mt-1 font-display text-lg font-semibold text-cream">
              Llenado Exacto de Huecos de Agenda (Subset Sum)
            </h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Cuando un cliente cancela, queda un hueco libre de $W$ minutos. CutFlow debe responder:
              <strong className="text-cream"> ¿Existe una combinación exacta de servicios en lista de espera que sume exactamente $W$ minutos sin dejar tiempo muerto?</strong>
            </p>
          </header>

          {/* Configuración del Hueco */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
              <label htmlFor="target-minutes-input" className="block text-xs font-medium text-muted">
                Tiempo libre por cancelación ($W$ minutos requeridos):
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="target-minutes-input"
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  value={targetMinutes}
                  onChange={(e) => {
                    setTargetMinutes(Number(e.target.value) || 0);
                    setVerificationResult(null);
                    setDpResult(null);
                  }}
                  className="field w-28 text-center text-lg font-bold text-gold"
                />
                <span className="text-sm font-semibold text-cream">minutos exactos</span>
              </div>

              {/* Botones de presets */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted">Ajustes rápidos:</span>
                {PRESET_TARGETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTargetMinutes(t);
                      setVerificationResult(null);
                      setDpResult(null);
                    }}
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium transition ${
                      targetMinutes === t
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-surface text-muted border border-line hover:text-cream'
                    }`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            {/* Suma actual vs objetivo */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface-2/60 p-4">
              <div>
                <p className="text-xs font-medium text-muted">Estado de la selección actual:</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`font-display text-3xl font-bold ${
                      currentSelectionSum === targetMinutes
                        ? 'text-success'
                        : currentSelectionSum > targetMinutes
                        ? 'text-danger'
                        : 'text-gold'
                    }`}
                  >
                    {currentSelectionSum}
                  </span>
                  <span className="text-sm text-muted">/ {targetMinutes} min objetivo</span>
                </div>
              </div>

              <div className="mt-3">
                {currentSelectionSum === targetMinutes ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success border border-success/30">
                    ✓ Suma exacta alcanzada (75 min)
                  </span>
                ) : currentSelectionSum > targetMinutes ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-3 py-1 text-xs font-semibold text-danger border border-danger/30">
                    ⚠ Se excede por {currentSelectionSum - targetMinutes} minutos
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold border border-gold/30">
                    ⏳ Faltan {targetMinutes - currentSelectionSum} minutos para llenar el hueco
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lista interactiva de servicios */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Servicios disponibles en cola ({DEFAULT_SERVICES.length})
              </span>
              <span className="text-[11px] text-muted">Haz clic para armar una propuesta manual</span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {DEFAULT_SERVICES.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-gold bg-gold/15 text-cream shadow-sm shadow-gold/20'
                        : 'border-line bg-surface-2/40 text-muted hover:border-gold/30 hover:text-cream'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`grid size-5 place-items-center rounded-md border text-xs font-bold transition ${
                          isSelected ? 'border-gold bg-gold text-night' : 'border-line bg-surface text-muted'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-cream">{s.name}</p>
                        <span className="text-[10px] text-muted">{s.category}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-gold' : 'text-muted'
                      }`}
                    >
                      {s.durationMinutes} min
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción: Demostración NP vs DP */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleVerifySubset}
              className="btn-ghost text-xs"
            >
              <span>🔍</span>
              <span>1. Verificar propuesta manual (O(k) - Tiempo Polinomial NP)</span>
            </button>

            <button
              type="button"
              onClick={handleSolveSubsetDP}
              className="btn-primary text-xs"
            >
              <span>⚡</span>
              <span>2. Resolver óptimo con CutFlow (Programación Dinámica O(n·W))</span>
            </button>
          </div>

          {/* Panel de resultados y verificación */}
          {verificationResult && (
            <div
              className={`rounded-2xl border p-4 text-xs ${
                verificationResult.isValid
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-danger/40 bg-danger/10 text-danger'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>
                  {verificationResult.isValid
                    ? '✅ Propuesta válida: La combinación suma exactamente los minutos requeridos.'
                    : `❌ Propuesta rechazada: Suma ${verificationResult.totalDuration} min (diferencia de ${Math.abs(
                        verificationResult.diffMinutes
                      )} min).`}
                </span>
                <span className="text-[11px] font-mono text-muted">
                  Tiempo de verificación: {verificationResult.executionTimeMs} ms
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                <strong>¿Por qué es NP?</strong> Porque verificar si una propuesta es correcta tomó solo{' '}
                <span className="text-cream">{verificationResult.executionTimeMs} ms</span> mediante una simple suma
                lineal $O(k)$.
              </p>
            </div>
          )}

          {dpResult && dpResult.found && (
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-xs text-cream">
              <div className="flex items-center justify-between font-semibold text-gold">
                <span>⚡ Solución óptima calculada por CutFlow en {dpResult.executionTimeMs} ms</span>
                <span className="text-[11px] font-mono text-muted">
                  Espacio evaluado por fuerza bruta: {dpResult.subsetsExploredEstimate} combinaciones
                </span>
              </div>
              <p className="mt-1.5 text-cream/90">
                El algoritmo seleccionó:{' '}
                <strong className="text-gold">
                  {dpResult.combination.map((c) => `${c.name} (${c.durationMinutes} min)`).join(' + ')}
                </strong>{' '}
                = <strong>{dpResult.totalDuration} minutos</strong>.
              </p>
              <p className="mt-2 text-[11px] text-muted">
                Si CutFlow usara fuerza bruta $O(2^n)$ para 40 servicios en cola, tardaría{' '}
                <span className="text-danger">35 años</span>. Con Programación Dinámica $O(n \cdot W)$, lo resuelve en{' '}
                <span className="text-success">{dpResult.executionTimeMs} milisegundos</span>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: GRAPH COLORING ===================== */}
      {activeTab === 'graph-coloring' && (
        <div className="space-y-6">
          <header className="rounded-2xl border border-line bg-surface-2/40 p-4">
            <span className="eyebrow">Problema NP-Completo #2</span>
            <h3 className="mt-1 font-display text-lg font-semibold text-cream">
              Asignación de Estaciones de Trabajo sin Conflicto (3-Coloring)
            </h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              La sede dispone de <strong className="text-gold">3 sillones de corte físicos</strong>. Algunos barberos o
              servicios comparten máquinas o zonas que no pueden operar simultáneamente. CutFlow debe responder:{' '}
              <strong className="text-cream">¿Se pueden asignar los 4 barberos a los 3 sillones sin colisiones?</strong>
            </p>
          </header>

          {/* Conflictos definidos */}
          <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="text-xs font-semibold text-gold uppercase tracking-wider">
              Restricciones de incompatibilidad activas ({DEFAULT_CONFLICTS.length} aristas de conflicto)
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEFAULT_CONFLICTS.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 p-2.5 text-xs">
                  <span className="text-danger font-bold shrink-0">⚡ {c.serviceA} ↔ {c.serviceB}</span>
                  <span className="text-[11px] text-muted truncate">{c.reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Barberos y selector manual de estación */}
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              Barberos y Estación Asignada
            </span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {BARBER_NODES.map((b) => {
                const assignedStation = assignments[b.id] ?? 1;
                const style = STATION_COLORS[assignedStation] || STATION_COLORS[1];
                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border p-4 transition ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${style.text}`}>{b.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                        Sillón {assignedStation}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-cream">{b.name}</p>

                    {/* Selector interactivo de estación */}
                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleAssignStationManual(b.id, st)}
                          className={`flex-1 rounded-lg py-1 text-xs font-medium transition border ${
                            assignedStation === st
                              ? 'border-gold bg-gold text-night font-bold'
                              : 'border-line bg-surface text-muted hover:text-cream'
                          }`}
                        >
                          S{st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visualización de los 3 Sillones Físicos */}
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              Distribución en los 3 Sillones de la Sede
            </span>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((st) => {
                const barbersInStation = BARBER_NODES.filter((b) => assignments[b.id] === st);
                const style = STATION_COLORS[st];
                return (
                  <div
                    key={st}
                    className={`rounded-2xl border p-4 ${style.border} ${style.bg} flex flex-col justify-between min-h-[130px]`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
                          Sillón {st}
                        </span>
                        <span className="text-[10px] text-muted">{barbersInStation.length} asignado(s)</span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {barbersInStation.length > 0 ? (
                          barbersInStation.map((b) => (
                            <div
                              key={b.id}
                              className="rounded-lg bg-surface/80 border border-line px-2.5 py-1 text-xs font-medium text-cream flex items-center justify-between"
                            >
                              <span>{b.name}</span>
                              <span className="text-[10px] text-gold font-bold">{b.id}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted/60 italic py-2">Sillón libre</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-muted border-t border-line/40 pt-1.5">
                      {st === 1 && 'Sillón principal (A y D compatibles en turnos alternos)'}
                      {st === 2 && 'Sillón químico (Barbero B)'}
                      {st === 3 && 'Sillón de tratamientos (Barbero C)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleVerifyGraph}
              className="btn-ghost text-xs"
            >
              <span>🔍</span>
              <span>1. Validar conflictos en sillones (O(E) - Verificación NP)</span>
            </button>

            <button
              type="button"
              onClick={handleSolveGraphAuto}
              className="btn-primary text-xs"
            >
              <span>💈</span>
              <span>2. Distribuir automáticamente con Backtracking (NP-Completo)</span>
            </button>
          </div>

          {/* Resultado de verificación de grafo */}
          {graphVerification && (
            <div
              className={`rounded-2xl border p-4 text-xs ${
                graphVerification.isValid
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-danger/40 bg-danger/10 text-danger'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>
                  {graphVerification.isValid
                    ? '✅ Asignación válida: Ninguna pareja con conflicto comparte el mismo sillón.'
                    : `❌ Colisión detectada: Hay ${graphVerification.conflictViolations.length} conflicto(s) en la misma estación.`}
                </span>
                <span className="text-[11px] font-mono text-muted">
                  Tiempo: {graphVerification.executionTimeMs} ms
                </span>
              </div>

              {!graphVerification.isValid && (
                <ul className="mt-2 space-y-1 text-[11px] text-danger/90">
                  {graphVerification.conflictViolations.map((v, i) => (
                    <li key={i}>
                      • <strong>{v.serviceA}</strong> y <strong>{v.serviceB}</strong> coinciden en el Sillón{' '}
                      {assignments[v.serviceA]} ({v.reason}).
                    </li>
                  ))}
                </ul>
              )}

              {graphSolveMeta && graphVerification.isValid && (
                <p className="mt-2 text-[11px] text-muted">
                  El algoritmo de Backtracking exploró la solución óptima en solo{' '}
                  <strong className="text-gold">{graphSolveMeta.steps} pasos</strong> ({graphSolveMeta.timeMs} ms),
                  demostrando cómo podar ramas inviables resuelve el problema NP-Completo de 3-Coloración eficientemente.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
