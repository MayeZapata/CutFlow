'use client';

import { useState, useRef, useEffect } from 'react';

export interface StressMetrics {
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface StressAiAssistantProps {
  result: StressMetrics | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SUGGESTIONS = [
  '¿Qué significa esto en el día a día para la barbería?',
  '¿Por qué el motor de CutFlow evita que la app se congele?',
  'Explícame las colisiones con palabras sencillas.',
  '¿Cómo nos ayuda un sábado de quincena con la barbería llena?',
];

/**
 * Minimalist parser for markdown text to render clean HTML paragraphs, bold highlights, lists, and code.
 */
function FormattedAiMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-cream/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-semibold text-gold">{numberMatch[1]}.</span>
              <span>{renderInline(numberMatch[2])}</span>
            </div>
          );
        }

        // Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-display font-semibold text-gold pt-2 text-base">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-display font-bold text-cream pt-3 text-lg border-b border-line pb-1">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }

        return <p key={idx}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

/**
 * Parses bold (**text**), inline code (`code`), and key numbers.
 */
function renderInline(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-gold-soft">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-night/80 px-1.5 py-0.5 font-mono text-xs text-gold border border-line"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts;
}

let msgSequence = 0;
function createMsgId(prefix: string): string {
  msgSequence += 1;
  return `${prefix}-${msgSequence}`;
}

export default function StressAiAssistant({
  result,
  isExpanded = false,
  onToggleExpand,
}: StressAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: result
        ? `¡Hola! Ya tengo los datos de la prueba con **${result.volume.toLocaleString('es-CO')} solicitudes**. Estoy preparando una explicación tranquila y clara de lo que pasó...`
        : '¡Hola! Soy tu compañero de CutFlow acá en Colombia. En cuanto ejecutes una prueba de estrés arriba, te explicaré con toda la calma y sin enredos técnicos qué significan estos números para tu barbería. Y si te queda cualquier duda, ¡la charlamos por aquí con todo el gusto!',
      timestamp: 'Ahora',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedRunId = useRef<number | null>(null);

  // Trigger automatic analysis whenever a new test finishes
  useEffect(() => {
    if (!result) return;
    const currentRunId = result.runId ?? (result.volume + result.timeLogN + result.timeQuad);
    if (lastAnalyzedRunId.current === currentRunId) return;
    lastAnalyzedRunId.current = currentRunId;

    let isMounted = true;
    async function runAutoAnalysis() {
      setLoading(true);
      setAutoAnalyzing(true);
      setError(null);

      const speedup = result ? (result.timeLogN > 0 ? (result.timeQuad / result.timeLogN).toFixed(1) : 'N/A') : 'N/A';
      const prompt = `Hola. Acabamos de correr una prueba de estrés con ${result?.volume.toLocaleString('es-CO')} solicitudes de citas en CutFlow Colombia.
Por favor, explícanos en un lenguaje MUY TRANQUILO, CERCANO, AMIGABLE Y FÁCIL DE ENTENDER (estamos en Colombia):
1. El tiempo y la rapidez: cómo le fue a nuestro motor inteligente O(n log n) (${result?.timeLogN} ms) frente al método antiguo O(n²) (${result?.timeQuad} ms), y qué significa ese ${speedup}x de rapidez para que la app responda al instante en los celulares sin quedarse colgada.
2. Las citas y las colisiones: explícanos de forma muy humana qué son esas ${result?.collisions.toLocaleString('es-CO')} colisiones (citas que querían el mismo barbero y hora) y por qué es un alivio que el sistema las haya organizado para evitar que dos clientes lleguen al mismo tiempo a la misma silla.
3. Conclusiones y tranquilidad para el negocio: qué podemos aprender de esto y cómo nos ayuda a estar súper tranquilos en días de quincena o fines de semana pesados en la barbería.

REGLA DE ORO DE VOCABULARIO: Estamos en Colombia. Comunícate en español colombiano cálido y cercano. NUNCA uses "platicar" ni "plática" (en Colombia decimos siempre "charlar", "conversar" o "hablar").`;

      try {
        const response = await fetch('/api/stress/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            result,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error al generar la explicación.');
        }

        if (isMounted) {
          const autoMessage: Message = {
            id: createMsgId('auto-analysis'),
            role: 'assistant',
            content: `### Explicación de tu Prueba de Estrés (${result?.volume.toLocaleString('es-CO')} solicitudes)\n\n${data.reply}\n\n---\n*Si algo no te quedó 100% claro o quieres revisar cualquier detalle, ¡escríbeme aquí abajo y lo charlamos con todo el gusto!*`,
            timestamp: 'Gemini',
          };
          setMessages((prev) => [...prev, autoMessage]);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Error al obtener el análisis automático.';
          setError(errMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAutoAnalyzing(false);
        }
      }
    }

    runAutoAnalysis();

    return () => {
      isMounted = false;
    };
  }, [result]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(promptText?: string) {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: createMsgId('user'),
      role: 'user',
      content: textToSend,
      timestamp: 'Tú',
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stress/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          result,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener respuesta de la IA.');
      }

      const assistantMessage: Message = {
        id: createMsgId('assistant'),
        role: 'assistant',
        content: data.reply || 'Sin respuesta del modelo.',
        timestamp: 'Gemini',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error inesperado al conectar con Gemini.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Conversación reiniciada. ¿Qué otra duda tienes sobre el rendimiento del sistema?',
        timestamp: 'Ahora',
      },
    ]);
    setError(null);
  }

  return (
    <div
      className={`rounded-3xl border border-gold/30 bg-surface/95 shadow-2xl backdrop-blur-xl ring-1 ring-gold/20 flex flex-col overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[560px]' : 'h-[500px]'
      }`}
    >
      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-inner shrink-0">
            <svg
              className="size-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-cream text-sm sm:text-base">
                Explicador Inteligente
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold border border-gold/30">
                <span className="size-1.5 rounded-full bg-gold animate-pulse" />
                Gemini IA
              </span>
            </div>
            <p className="text-[11px] text-muted line-clamp-1">
              Entiende fácilmente cómo responde CutFlow en palabras claras.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-cream hover:border-gold/50 hover:bg-gold/10 transition"
              title={isExpanded ? 'Contraer chat al lado de la gráfica' : 'Ampliar chat sobre la gráfica'}
            >
              {isExpanded ? (
                <>
                  <svg className="size-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  <span>Contraer</span>
                </>
              ) : (
                <>
                  <svg className="size-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  <span>Ampliar</span>
                </>
              )}
            </button>
          )}

          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs text-muted hover:text-cream transition px-2 py-1 rounded-lg border border-line hover:border-gold/30"
            >
              Limpiar
            </button>
          )}
        </div>
      </header>

      {/* Suggested prompts (Chips) */}
      <div className="shrink-0 border-b border-line/60 bg-night/40 px-4 py-2 sm:px-5">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => handleSend(suggestion)}
              className="text-left text-[11px] rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 text-cream/90 transition hover:border-gold/60 hover:bg-gold/10 hover:text-gold active:scale-95 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container: flex-1 min-h-0 allows smooth scroll and pins footer */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30 text-xs font-bold">
                  IA
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                  isUser
                    ? 'bg-gold/15 text-cream border border-gold/40 rounded-tr-sm'
                    : 'bg-surface-2/80 border border-line rounded-tl-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">
                    {isUser ? 'Tú' : 'Gemini CutFlow Copilot'}
                  </span>
                  <span className="text-[10px] text-muted/70">{message.timestamp}</span>
                </div>
                {isUser ? (
                  <p className="text-sm leading-relaxed text-cream">{message.content}</p>
                ) : (
                  <FormattedAiMessage text={message.content} />
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30 text-xs font-bold animate-pulse">
              IA
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/80 px-4 py-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold animate-bounce" />
              <span className="size-2 rounded-full bg-gold animate-bounce [animation-delay:0.2s]" />
              <span className="size-2 rounded-full bg-gold animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-muted pl-2">
                {autoAnalyzing
                  ? 'Gemini está preparando una explicación clara y tranquila de tus resultados...'
                  : 'Gemini está escribiendo una respuesta sencilla para ti...'}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-danger underline hover:text-danger/80 ml-3"
            >
              Cerrar
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box - Permanently pinned at bottom */}
      <footer className="shrink-0 border-t border-line bg-surface-2/95 backdrop-blur-md p-3.5 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              result
                ? 'Pregúntame lo que quieras con confianza (ej. "¿Cómo ayuda esto a los clientes?")...'
                : 'Escribe tu pregunta aquí o ejecuta una prueba de estrés arriba...'
            }
            disabled={loading}
            className="field flex-1 text-sm py-2.5 px-4"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary py-2.5 px-5 text-sm shrink-0"
          >
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3.5 border-2 border-night border-t-transparent rounded-full animate-spin" />
                <span>Analizando...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Preguntar</span>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
