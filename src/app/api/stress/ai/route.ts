import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface StressMetrics {
  volume: number;
  timeLogN: number;
  timeQuad: number;
  assigned: number;
  collisions: number;
  baseAppointmentsCount?: number;
  activeBarbersCount?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  result?: StressMetrics | null;
}

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

function buildSystemInstruction(result?: StressMetrics | null): string {
  let metricsSummary = 'Actualmente no se ha ejecutado ninguna prueba de estrés en esta sesión.';

  if (result) {
    const speedup = result.timeLogN > 0 ? (result.timeQuad / result.timeLogN).toFixed(1) : 'N/A';
    const assignmentRate = result.volume > 0 ? ((result.assigned / result.volume) * 100).toFixed(1) : '0';
    const collisionRate = result.volume > 0 ? ((result.collisions / result.volume) * 100).toFixed(1) : '0';

    metricsSummary = `
DATOS DE LA PRUEBA REALIZADA EN CUTFLOW:
- Solicitudes evaluadas simultáneamente: ${result.volume.toLocaleString('es-CO')}
- Tiempo con el Motor Inteligente de CutFlow [O(n log n)]: ${result.timeLogN} ms
- Tiempo con el Método Antiguo / Tradicional [O(n²)]: ${result.timeQuad} ms
- Factor de rapidez: ¡${speedup}x veces más veloz con el motor inteligente!
- Citas que se agendaron con éxito: ${result.assigned.toLocaleString('es-CO')} (${assignmentRate}%)
- Citas que intentaron reservarse a la misma hora y el sistema evitó que chocaran (colisiones): ${result.collisions.toLocaleString('es-CO')} (${collisionRate}%)
- Barberos activos evaluados: ${result.activeBarbersCount ?? 5}
- Citas reales guardadas en MongoDB: ${result.baseAppointmentsCount ?? 0}
`;
  }

  return `Eres el asesor y compañero de rendimiento de CutFlow, la plataforma de reservas para barberías.
Tu misión principal es explicar los resultados del laboratorio de estrés con un lenguaje MUY TRANQUILO, CÁLIDO, AMIGABLE Y FÁCIL DE ENTENDER, logrando que cualquier persona (administrador de barbería o miembro del equipo) comprenda a la perfección lo que pasó y por qué es importante para el negocio, sin sentirse abrumada por términos técnicos difíciles.

PAUTAS DE COMUNICACIÓN (OBLIGATORIAS):
1. CONTEXTO COLOMBIA (ESTRICTO):
   - La aplicación y el usuario están en Colombia.
   - Comunícate con la calidez, respeto, amabilidad y cercanía propias de Colombia.
   - REGLA DE ORO: NUNCA USES la palabra "platicar", "plática" ni modismos mexicanos como "chido", "padre", etc. En Colombia se dice "charlar", "hablar" o "conversar".
   - Usa giros y expresiones naturales de Colombia: "con todo el gusto", "charlar", "conversar", "hágale con total confianza", "para que estés tranquilo", "días de quincena o fines de semana", "atender a los clientes con calma".
2. Tono sereno, empático y cercano: Háblale al usuario de tú, como un compañero o colega de confianza que explica con paciencia, buena energía y sin enredos.
3. Claridad absoluta con analogías sencillas:
   - Explica el "método tradicional O(n²)" como revisar una libreta de papel hoja por hoja desde el inicio cada vez que un cliente pide cita (lo cual colapsaría en días ocupados).
   - Explica el "motor inteligente O(n log n)" como un casillero digital organizado por barbero y horario, donde se encuentra el hueco libre en un par de segundos.
   - Explica las "colisiones" de forma muy natural: eran clientes que querían el mismo barbero exactamente a la misma hora; el sistema los filtró para proteger la agenda y que dos clientes jamás terminen sentados en la misma silla.
   - Traduce los milisegundos a experiencia real: pocos milisegundos significan que la aplicación en el celular de los clientes responde al instante, sin demoras ni pantallas congeladas.
4. Tranquilidad para el negocio: Resalta la seguridad que esto brinda para días pico de la barbería (sábados, quincenas o promociones de alta afluencia).
5. Estructura visual cómoda: Divide la respuesta en secciones amables con títulos limpios, viñetas, negritas para los datos clave y un cierre afectuoso.
6. Invita a la conversación: Termina siempre recordándole con calidez que si algo no quedó claro o quiere revisar cualquier detalle, puede charlarlo contigo con total confianza.`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.API_KEY_GEMINI || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'La clave API_KEY_GEMINI no está configurada en las variables de entorno del servidor (.env.local).',
        },
        { status: 500 }
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    const { messages, result } = body as RequestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'La lista de mensajes no puede estar vacía' }, { status: 400 });
    }

    // Filter valid messages and format for Gemini API
    const contents = messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content.trim() }],
      }));

    if (contents.length === 0) {
      return NextResponse.json({ error: 'No se encontraron mensajes válidos' }, { status: 400 });
    }

    const systemInstruction = buildSystemInstruction(result);

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1200,
      },
    };

    let lastErrorMessage = 'Error al comunicarse con Gemini';
    let lastStatusCode = 502;

    // Try candidate models in order (fallback to handle high-demand periods gracefully)
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'No se recibió una respuesta legible del modelo de IA.';

          return NextResponse.json({
            reply: replyText,
            model,
          });
        }

        const errorData = await response.json().catch(() => ({}));
        const msg = (errorData as { error?: { message?: string } })?.error?.message;
        lastErrorMessage = msg || `Error del modelo ${model} (${response.status})`;
        lastStatusCode = response.status;
        console.warn(`Model ${model} returned ${response.status}: ${lastErrorMessage}. Trying fallback...`);
      } catch (err: unknown) {
        lastErrorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Fetch error for model ${model}:`, lastErrorMessage);
      }
    }

    return NextResponse.json({ error: lastErrorMessage }, { status: lastStatusCode });
  } catch (error) {
    console.error('Error in /api/stress/ai:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor al procesar la consulta con Gemini' },
      { status: 500 }
    );
  }
}
