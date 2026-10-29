"use client";

import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import Link from "next/link";
import { createContext, use, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { formatNumber } from "@/lib/format";
import { runSetLab, runSetLaunchSpeed, runShowOrbit } from "@/lib/tutor/actions";
import { shownError } from "@/lib/tutor/errors";
import { LIMITS, toolCallsSinceLastUser, type TutorUIMessage } from "@/lib/tutor/messages";
import { useLearn } from "./learn-state";

type Availability = "checking" | "available" | "unavailable";

const availabilitySchema = z.object({ available: z.boolean() });

const transport = new DefaultChatTransport<TutorUIMessage>({ api: "/api/tutor" });

type TutorState = Pick<UseChatHelpers<TutorUIMessage>, "messages" | "status" | "error" | "stop" | "setMessages"> & {
  readonly availability: Availability;
  /** Sends a message to the tutor along with the page state it is written in. */
  readonly ask: (text: string) => void;
};

const TutorContext = createContext<TutorState | null>(null);

/**
 * The conversation with the tutor, kept above the lessons so a check question can ask it
 * too. Tool calls run here, on the same state the sliders change: useChat always calls
 * the onToolCall of the latest render, so it sees the page as it is now.
 */
export function TutorProvider({ children }: { readonly children: ReactNode }) {
  const learn = useLearn();
  // The last message as it was at the last automatic send. An answer that adds nothing is
  // never written into the conversation, which then looks the same as before that send:
  // without this check it would be sent again and again, each time a paid model call.
  const lastAutomaticSend = useRef("");
  const { messages, status, error, stop, setMessages, sendMessage, addToolOutput } = useChat<TutorUIMessage>({
    transport,
    // Every automatic send is another model call: after a few tool calls the tutor waits for the user.
    sendAutomaticallyWhen: ({ messages }) => {
      const last = messages[messages.length - 1];
      if (!lastAssistantMessageIsCompleteWithToolCalls({ messages }) || toolCallsSinceLastUser(messages) > LIMITS.toolCalls) {
        return false;
      }
      const sending = `${last.id}:${last.parts.length}`;
      if (sending === lastAutomaticSend.current) return false;
      lastAutomaticSend.current = sending;
      return true;
    },
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;
      switch (toolCall.toolName) {
        case "setLab": {
          const { values, output } = runSetLab(learn.lab, toolCall.input);
          learn.setLab(values);
          addToolOutput({ tool: "setLab", toolCallId: toolCall.toolCallId, output });
          return;
        }
        case "setLaunchSpeed": {
          const { speed, output } = runSetLaunchSpeed(toolCall.input);
          learn.setLaunchSpeed(speed);
          addToolOutput({ tool: "setLaunchSpeed", toolCallId: toolCall.toolCallId, output });
          return;
        }
        case "showOrbit":
          addToolOutput({ tool: "showOrbit", toolCallId: toolCall.toolCallId, output: runShowOrbit(toolCall.input) });
          return;
      }
    },
  });

  const [availability, setAvailability] = useState<Availability>("checking");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tutor", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        const parsed = availabilitySchema.safeParse(data);
        setAvailability(parsed.success && parsed.data.available ? "available" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability("unavailable");
      });
    return () => controller.abort();
  }, []);

  const state: TutorState = {
    messages,
    status,
    error,
    stop,
    setMessages,
    availability,
    ask: (text) => {
      const { firstAnswers, lab, launchSpeed } = learn;
      void sendMessage({ text, metadata: { context: { answers: firstAnswers, lab, launchSpeed } } });
    },
  };

  return <TutorContext value={state}>{children}</TutorContext>;
}

export function useTutor(): TutorState {
  const state = use(TutorContext);
  if (!state) throw new Error("useTutor needs a TutorProvider above it");
  return state;
}

const SUGGESTIONS = [
  "¿Por qué la fuerza baja tanto al separar los cuerpos?",
  "Enséñame en el lanzador una órbita alargada",
  "¿Por qué con tres cuerpos no hay una fórmula?",
] as const;

function ToolNote({ children }: { readonly children: ReactNode }) {
  return <p className="rounded-lg border border-line px-3 py-2 text-sm text-muted">{children}</p>;
}

function Part({ part }: { readonly part: TutorUIMessage["parts"][number] }) {
  switch (part.type) {
    case "text":
      return <p className="whitespace-pre-line">{part.text}</p>;
    case "tool-setLab":
      if (part.state === "output-error") return <ToolNote>No se ha podido cambiar el laboratorio.</ToolNote>;
      if (part.state !== "output-available") return <ToolNote>Cambiando el laboratorio…</ToolNote>;
      return (
        <ToolNote>
          Laboratorio cambiado: masas {formatNumber(part.output.mass1, 0)} y {formatNumber(part.output.mass2, 0)}, distancia{" "}
          {formatNumber(part.output.distance, 1)}, fuerza {formatNumber(part.output.force, 3)} G.{" "}
          <a href="#todo-atrae" className="text-ink underline underline-offset-2">
            Ver el laboratorio
          </a>
        </ToolNote>
      );
    case "tool-setLaunchSpeed":
      if (part.state === "output-error") return <ToolNote>No se ha podido mover el lanzador.</ToolNote>;
      if (part.state !== "output-available") return <ToolNote>Moviendo el lanzador…</ToolNote>;
      return (
        <ToolNote>
          Lanzador al {formatNumber(part.output.percent, 0)} % de la velocidad circular.{" "}
          <a href="#orbitas" className="text-ink underline underline-offset-2">
            Ver el lanzador
          </a>
        </ToolNote>
      );
    case "tool-showOrbit":
      if (part.state !== "output-available") return null;
      return (
        <p>
          <Link href={`/galeria/${part.output.slug}`} className="inline-block rounded-lg border border-accent/60 px-3 py-1.5 text-sm hover:border-accent">
            Ver {part.output.name} en la galería
          </Link>
        </p>
      );
    default:
      return null;
  }
}

function Message({ message }: { readonly message: TutorUIMessage }) {
  const mine = message.role === "user";
  return (
    <li className={mine ? "ml-6 space-y-2 rounded-xl bg-accent/10 px-3 py-2" : "space-y-2"}>
      <span className="sr-only">{mine ? "Tú:" : "El tutor:"}</span>
      {message.parts.map((part, index) => (
        <Part key={index} part={part} />
      ))}
    </li>
  );
}

export function TutorPanel() {
  const { messages, status, error, stop, setMessages, availability, ask } = useTutor();
  const inputId = useId();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    ask(trimmed);
    setInput("");
  };

  return (
    <section
      id="tutor"
      aria-labelledby="tutor-titulo"
      className="flex scroll-mt-6 flex-col rounded-2xl border border-line bg-panel/70 p-4 lg:max-h-[calc(100dvh-3rem)]"
    >
      <h2 id="tutor-titulo" className="font-display text-xl font-semibold">
        Pregúntale al tutor
      </h2>
      <p className="mt-1 text-sm text-muted">
        Un modelo de lenguaje (Claude, de Anthropic) que explica, corrige y puede mover el laboratorio y el lanzador.
        Lo que escribas se le envía para responderte y no se guarda.
      </p>

      {availability === "checking" && <p className="mt-4 text-sm text-muted">Comprobando si el tutor está disponible…</p>}
      {availability === "unavailable" && (
        <p className="mt-4 rounded-lg border border-line px-3 py-2 text-sm">
          El tutor no está disponible en esta copia de la web: falta la clave del modelo. Las preguntas de comprobación
          siguen corrigiéndose con su explicación.
        </p>
      )}

      {messages.length > 0 && (
        <ol
          ref={listRef}
          role="log"
          aria-label="Conversación con el tutor"
          aria-busy={busy}
          className="mt-4 max-h-[60vh] min-h-0 flex-1 space-y-4 overflow-y-auto leading-relaxed"
        >
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </ol>
      )}
      <p role="status" className="mt-2 min-h-5 text-sm text-muted">
        {status === "submitted" ? "El tutor está pensando…" : status === "streaming" ? "El tutor está escribiendo…" : ""}
      </p>
      {error && (
        <p role="alert" className="rounded-lg border border-accent/60 px-3 py-2 text-sm">
          {shownError(error.message)}
        </p>
      )}

      {availability === "available" && (
        <>
          {messages.length === 0 && (
            <ul aria-label="Preguntas para empezar" className="mt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-line px-3 py-1.5 text-left text-sm hover:border-accent/70"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="mt-3"
          >
            <label htmlFor={inputId} className="text-sm text-muted">
              Tu pregunta
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={inputId}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-line bg-night px-3 py-2"
              />
              {busy ? (
                <button type="button" onClick={() => void stop()} className="rounded-lg border border-line px-4 py-2">
                  Parar
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="rounded-lg bg-accent px-4 py-2 font-medium text-night disabled:opacity-50">
                  Enviar
                </button>
              )}
            </div>
          </form>
          {messages.length > 0 && !busy && (
            <button type="button" onClick={() => setMessages([])} className="mt-3 self-start text-sm text-muted underline underline-offset-2">
              Empezar otra conversación
            </button>
          )}
        </>
      )}
    </section>
  );
}
