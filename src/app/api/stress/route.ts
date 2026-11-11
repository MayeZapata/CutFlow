import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { BarberModel, AppointmentModel } from '@/lib/db/models';

interface CandidateRequest {
  barberId: string;
  day: number;
  start: number;
  end: number;
}

/**
 * Detección ingenua de colisiones de intervalos por fuerza bruta O(n²).
 * Compara cada candidato secuencialmente contra todos los candidatos previamente aceptados.
 */
function runNaiveQuad(candidates: CandidateRequest[]): { assigned: number; collisions: number; timeMs: number } {
  const start = performance.now();
  const accepted: CandidateRequest[] = [];
  let collisions = 0;
  let assigned = 0;

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    let hasConflict = false;

    for (let j = 0; j < accepted.length; j++) {
      const ex = accepted[j];
      if (cand.barberId === ex.barberId && cand.day === ex.day) {
        if (!(cand.end <= ex.start || cand.start >= ex.end)) {
          hasConflict = true;
          break;
        }
      }
    }

    if (hasConflict) {
      collisions++;
    } else {
      assigned++;
      accepted.push(cand);
    }
  }

  const timeMs = performance.now() - start;
  return { assigned, collisions, timeMs };
}

/**
 * Algoritmo optimizado O(n log n): Particionamiento Hash con Búsqueda Binaria.
 * 1. Particiona por clave (barberId, day) en O(1).
 * 2. Mantiene los intervalos ordenados y busca solapamientos con Búsqueda Binaria en O(log k).
 */
function runLogN(candidates: CandidateRequest[]): { assigned: number; collisions: number; timeMs: number } {
  const start = performance.now();

  // Particiones: clave -> arreglo ordenado de intervalos aceptados
  const buckets = new Map<string, { start: number; end: number }[]>();
  let collisions = 0;
  let assigned = 0;

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const key = `${cand.barberId}_${cand.day}`;
    let list = buckets.get(key);

    if (!list) {
      list = [];
      buckets.set(key, list);
    }

    // Búsqueda binaria para detectar solapamientos en la lista ordenada
    let low = 0;
    let high = list.length - 1;
    let conflict = false;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const ex = list[mid];

      // Verificación de intervalo: ¿chocan los horarios?
      if (!(cand.end <= ex.start || cand.start >= ex.end)) {
        conflict = true;
        break;
      }

      if (cand.start < ex.start) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (conflict) {
      collisions++;
    } else {
      assigned++;
      // Inserción ordenada manteniendo la estructura para la siguiente búsqueda
      list.splice(low, 0, { start: cand.start, end: cand.end });
    }
  }

  const timeMs = performance.now() - start;
  return { assigned, collisions, timeMs };
}

const MAX_VOLUME = 7_000_000;

export async function POST(request: NextRequest) {
  try {
    const { volume } = await request.json();
    const n = Number(volume);
    if (!n || n <= 0 || n > MAX_VOLUME) {
      return NextResponse.json(
        { error: `El volumen debe ser un número entero entre 1 y ${MAX_VOLUME.toLocaleString('es-CO')} solicitudes` },
        { status: 400 }
      );
    }

    // Conectar a MongoDB y obtener los barberos reales y el conteo de citas de la base de datos
    await connectToDatabase();
    const [barbers, dbAppointmentsCount] = await Promise.all([
      BarberModel.find({ active: true }).select('_id name').lean(),
      AppointmentModel.countDocuments(),
    ]);

    const barberIds = barbers.length > 0 ? barbers.map((b) => b._id) : ['juan-perez', 'carlos-mendoza'];

    // Generar N solicitudes de citas realistas entre los barberos activos y una ventana de 7 días
    const durations = [15, 30, 45, 60];
    const candidates: CandidateRequest[] = [];

    for (let i = 0; i < n; i++) {
      const barberId = barberIds[Math.floor(Math.random() * barberIds.length)];
      const day = Math.floor(Math.random() * 7); // 7 días simulados
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const maxStart = 1200 - duration;
      const slotSteps = Math.floor((maxStart - 480) / 15);
      const startMinutes = 480 + Math.floor(Math.random() * slotSteps) * 15;

      candidates.push({
        barberId,
        day,
        start: startMinutes,
        end: startMinutes + duration,
      });
    }

    // Ejecutar pruebas de rendimiento reales sobre exactamente los mismos candidatos
    const resLogN = runLogN(candidates);
    const resQuad = runNaiveQuad(candidates);

    return NextResponse.json({
      runId: Date.now(),
      volume: n,
      baseAppointmentsCount: dbAppointmentsCount,
      activeBarbersCount: barberIds.length,
      timeLogN: Number(resLogN.timeMs.toFixed(2)),
      timeQuad: Number(resQuad.timeMs.toFixed(2)),
      assigned: resLogN.assigned,
      collisions: resLogN.collisions,
      realExecution: true,
    });
  } catch (e) {
    console.error('Error in stress benchmark:', e);
    return NextResponse.json({ error: 'Error al ejecutar la prueba de estrés en el servidor' }, { status: 500 });
  }
}
