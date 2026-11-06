export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  category: string;
}

export interface ConflictRule {
  serviceA: string;
  serviceB: string;
  reason: string;
}

export interface VerificationResult {
  isValid: boolean;
  totalDuration: number;
  diffMinutes: number;
  executionTimeMs: number;
}

export interface DpSolutionResult {
  found: boolean;
  combination: ServiceItem[];
  totalDuration: number;
  executionTimeMs: number;
  subsetsExploredEstimate: number;
}

/**
 * 1. PROPIEDAD NP: Verificación polinomial O(k).
 * Suma los tiempos del subconjunto propuesto y verifica si coincide con el objetivo.
 */
export function verifyProposal(
  proposedServices: ServiceItem[],
  targetMinutes: number
): VerificationResult {
  const t0 = performance.now();
  const totalDuration = proposedServices.reduce(
    (acc, service) => acc + service.durationMinutes,
    0
  );
  const executionTimeMs = performance.now() - t0;

  return {
    isValid: totalDuration === targetMinutes,
    totalDuration,
    diffMinutes: totalDuration - targetMinutes,
    executionTimeMs: Number(executionTimeMs.toFixed(4)),
  };
}

/**
 * 2. RESOLUCIÓN ÓPTIMA (Programación Dinámica O(n * W)):
 * Resuelve el problema NP-Completo de Subset Sum en pseudo-tiempo polinomial.
 */
export function solveExactGapDP(
  services: ServiceItem[],
  targetMinutes: number
): DpSolutionResult {
  const t0 = performance.now();
  const n = services.length;

  if (targetMinutes <= 0) {
    return {
      found: false,
      combination: [],
      totalDuration: 0,
      executionTimeMs: 0,
      subsetsExploredEstimate: 0,
    };
  }

  // dp[i][w] = es posible sumar w con los primeros i elementos
  const dp: boolean[][] = Array.from({ length: n + 1 }, () =>
    Array(targetMinutes + 1).fill(false)
  );

  for (let i = 0; i <= n; i++) {
    dp[i][0] = true;
  }

  for (let i = 1; i <= n; i++) {
    const dur = services[i - 1].durationMinutes;
    for (let w = 1; w <= targetMinutes; w++) {
      if (dur > w) {
        dp[i][w] = dp[i - 1][w];
      } else {
        dp[i][w] = dp[i - 1][w] || dp[i - 1][w - dur];
      }
    }
  }

  const found = dp[n][targetMinutes];
  const combination: ServiceItem[] = [];

  if (found) {
    let remaining = targetMinutes;
    for (let i = n; i > 0 && remaining > 0; i--) {
      // Si el valor no viene de dp[i-1][remaining], significa que usamos services[i-1]
      if (!dp[i - 1][remaining]) {
        const item = services[i - 1];
        combination.push(item);
        remaining -= item.durationMinutes;
      }
    }
  }

  const executionTimeMs = performance.now() - t0;

  return {
    found,
    combination,
    totalDuration: combination.reduce((acc, s) => acc + s.durationMinutes, 0),
    executionTimeMs: Number(executionTimeMs.toFixed(4)),
    subsetsExploredEstimate: Math.pow(2, n),
  };
}

/**
 * 3. VERIFICACIÓN DE GRAFOS O(E) (NP):
 * Comprueba que ninguna arista conecte dos vértices con el mismo color/estación.
 */
export function verifyGraphColoring(
  assignment: Record<string, number>,
  conflicts: ConflictRule[]
): { isValid: boolean; conflictViolations: ConflictRule[]; executionTimeMs: number } {
  const t0 = performance.now();
  const violations: ConflictRule[] = [];

  for (const conflict of conflicts) {
    const stationA = assignment[conflict.serviceA];
    const stationB = assignment[conflict.serviceB];

    if (stationA !== undefined && stationB !== undefined && stationA === stationB) {
      violations.push(conflict);
    }
  }

  const executionTimeMs = performance.now() - t0;
  return {
    isValid: violations.length === 0,
    conflictViolations: violations,
    executionTimeMs: Number(executionTimeMs.toFixed(4)),
  };
}

/**
 * 4. RESOLUCIÓN DE 3-COLORING / ASIGNACIÓN DE ESTACIONES (NP-COMPLETO):
 * Algoritmo de Backtracking con Poda.
 */
export function solveStationAssignment(
  nodes: string[],
  conflicts: ConflictRule[],
  totalStations: number
): {
  success: boolean;
  assignment: Record<string, number>;
  stepsCount: number;
  executionTimeMs: number;
} {
  const t0 = performance.now();
  const adj = new Map<string, Set<string>>();
  for (const node of nodes) {
    adj.set(node, new Set());
  }
  for (const { serviceA, serviceB } of conflicts) {
    adj.get(serviceA)?.add(serviceB);
    adj.get(serviceB)?.add(serviceA);
  }

  const assignment: Record<string, number> = {};
  let stepsCount = 0;

  function isSafe(node: string, station: number): boolean {
    const neighbors = adj.get(node);
    if (!neighbors) return true;
    for (const neighbor of neighbors) {
      if (assignment[neighbor] === station) return false;
    }
    return true;
  }

  function backtrack(idx: number): boolean {
    stepsCount++;
    if (idx === nodes.length) {
      return true;
    }

    const currentNode = nodes[idx];
    for (let station = 1; station <= totalStations; station++) {
      if (isSafe(currentNode, station)) {
        assignment[currentNode] = station;
        if (backtrack(idx + 1)) {
          return true;
        }
        delete assignment[currentNode];
      }
    }

    return false;
  }

  const success = backtrack(0);
  const executionTimeMs = performance.now() - t0;

  return {
    success,
    assignment,
    stepsCount,
    executionTimeMs: Number(executionTimeMs.toFixed(4)),
  };
}
