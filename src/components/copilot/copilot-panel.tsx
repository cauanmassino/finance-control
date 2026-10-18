"use client";

import {createPortal} from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {useChat} from "@ai-sdk/react";
import {DefaultChatTransport} from "ai";

import {CopilotMessage} from "@/components/copilot/copilot-message";
import {ProposalList} from "@/components/copilot/proposal-list";

type CopilotPanelProps = {
  locale: string;
};

const transport = new DefaultChatTransport({
  api: "/api/chat",
});

const suggestions = [
  "Quanto tenho nas contas?",
  "Quanto gastei no mês passado?",
  "Qual categoria teve mais gastos neste mês?",
];

export function CopilotPanel({
  locale,
}: CopilotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [proposalRefresh, setProposalRefresh] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);

  const titleId = useId();

  const panelRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const followRef = useRef(true);
  const sendingRef = useRef(false);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
  } = useChat({
    transport,
  });

  const isBusy =
    status === "submitted" ||
    status === "streaming";

  useEffect(() => {
    setMounted(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      if (inputRef.current && !inputRef.current.disabled) {
        inputRef.current.focus();
      } else {
        panelRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;

      if (!panel) return;

      const nodes = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
      );

      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (
        event.shiftKey &&
        (
          document.activeElement === first ||
          document.activeElement === panel ||
          !panel.contains(document.activeElement)
        )
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (
          document.activeElement === last ||
          !panel.contains(document.activeElement)
        )
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (!isOpen || !followRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const container = scrollRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages, status, isOpen]);

  const submit = async (value = input) => {
    const text = value.trim();

    if (!text || isBusy || sendingRef.current) return;

    sendingRef.current = true;
    followRef.current = true;

    setSendError(null);
    setInput("");

    try {
      await sendMessage({text});
    } catch {
      setSendError(
        "Não foi possível concluir a resposta. Confira as propostas antes de repetir o pedido.",
      );
    } finally {
      sendingRef.current = false;

      setProposalRefresh((current) => current + 1);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Abrir Copiloto FINCO"
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-300 px-5 font-sans text-sm font-bold text-emerald-950 shadow-xl transition hover:bg-emerald-200"
        onClick={() => {
          setProposalRefresh((current) => current + 1);
          setIsOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true">✦</span>
        Copiloto
      </button>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex justify-end bg-black/55 font-sans backdrop-blur-sm">
              <button
                aria-label="Fechar Copiloto"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={closePanel}
                tabIndex={-1}
                type="button"
              />

              <section
                aria-labelledby={titleId}
                aria-modal="true"
                className="relative flex h-dvh w-full min-w-0 flex-col overflow-hidden border-l border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl outline-none backdrop-blur-xl sm:max-w-md"
                lang="pt-BR"
                ref={panelRef}
                role="dialog"
                tabIndex={-1}
              >
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                      Copiloto FINCO
                    </p>

                    <h2
                      className="mt-1 text-lg font-semibold tracking-tight"
                      id={titleId}
                    >
                      Seu dinheiro, claro.
                    </h2>
                  </div>

                  <button
                    aria-label="Fechar"
                    className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
                    onClick={closePanel}
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </header>

                <div
                  className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
                  onScroll={() => {
                    const container = scrollRef.current;

                    if (!container) return;

                    followRef.current =
                      container.scrollHeight -
                        container.scrollTop -
                        container.clientHeight <
                      140;
                  }}
                  ref={scrollRef}
                >
                  {messages.length === 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm leading-6 text-slate-400">
                        Consulte seus dados ou peça uma receita ou despesa
                        simples. O lançamento só é salvo depois de revisar
                        e confirmar o cartão abaixo.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                          <button
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 disabled:opacity-40"
                            disabled={isBusy}
                            key={suggestion}
                            onClick={() => {
                              void submit(suggestion);
                            }}
                            type="button"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {messages.map((message) => {
                    const text = message.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("\n\n");

                    if (!text.trim()) return null;

                    const isUser = message.role === "user";

                    return (
                      <div
                        className="min-w-0"
                        key={message.id}
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {isUser ? "Você" : "Copiloto"}
                        </p>

                        <div
                          className={`min-w-0 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                            isUser
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                              : "border-white/10 bg-white/4 text-slate-100"
                          }`}
                        >
                          <CopilotMessage
                            isUser={isUser}
                            text={text}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {isBusy ? (
                    <div
                      className="flex items-center gap-2 text-sm text-slate-400"
                      role="status"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-300 motion-reduce:animate-none"
                      />

                      {status === "submitted"
                        ? "Consultando..."
                        : "Preparando a resposta..."}
                    </div>
                  ) : null}

                  {error || sendError ? (
                    <p
                      className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100"
                      role="alert"
                    >
                      {sendError ??
                        "Não foi possível concluir a resposta. Atualize as propostas antes de repetir um pedido de lançamento."}
                    </p>
                  ) : null}

                  <ProposalList
                    isBusy={isBusy}
                    locale={locale}
                    refreshKey={proposalRefresh}
                  />
                </div>

                <footer className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-end gap-2">
                    <textarea
                      aria-label="Mensagem para o Copiloto"
                      className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 disabled:opacity-60"
                      disabled={isBusy}
                      maxLength={4000}
                      onChange={(event) => {
                        setInput(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          void submit();
                        }
                      }}
                      placeholder="Pergunte ou descreva um lançamento..."
                      ref={inputRef}
                      rows={1}
                      value={input}
                    />

                    {isBusy ? (
                      <button
                        className="h-11 shrink-0 rounded-xl border border-white/10 px-4 text-sm text-slate-200 transition hover:bg-white/10"
                        onClick={() => {
                          void stop();
                        }}
                        type="button"
                      >
                        Parar
                      </button>
                    ) : (
                      <button
                        className="h-11 shrink-0 rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!input.trim()}
                        onClick={() => {
                          void submit();
                        }}
                        type="button"
                      >
                        Enviar
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] leading-4 text-slate-500">
                    Registros do FINCO, não consulta bancária em tempo real.
                    Parar a resposta não cancela uma proposta já preparada.
                  </p>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}