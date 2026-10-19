"use client";

import {createPortal} from "react-dom";
import {useCallback, useEffect, useId, useRef, useState} from "react";
import {useChat} from "@ai-sdk/react";
import {DefaultChatTransport} from "ai";
import {CopilotMessage} from "@/components/copilot/copilot-message";
import {ProposalList} from "@/components/copilot/proposal-list";
import "./copilot.css";

const transport = new DefaultChatTransport({api: "/api/chat"});
const suggestions = [
  {symbol: "↗", title: "Meu saldo", detail: "Veja o que está nas suas contas", text: "Quanto tenho nas contas?"},
  {symbol: "≋", title: "Meus gastos", detail: "Entenda as despesas deste mês", text: "Quanto gastei neste mês?"},
  {symbol: "+", title: "Registrar despesa", detail: "Prepare e revise antes de salvar", text: "Quero registrar uma despesa."},
  {symbol: "▭", title: "Compra no crédito", detail: "Organize os gastos na fatura", text: "Quero registrar uma compra no crédito."},
];

function Mark({small = false}: {small?: boolean}) {
  return <span className={`fc-mark${small ? " fc-mark-small" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none"><path d="M8 24V8h16M8 16h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="m22 19 2 3 3 2-3 2-2 3-2-3-3-2 3-2 2-3Z" fill="currentColor"/></svg>
  </span>;
}

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function CopilotPanel({locale}: {locale: string}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [proposalRefresh, setProposalRefresh] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [following, setFollowing] = useState(true);
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);
  const sendingRef = useRef(false);
  const {messages, sendMessage, status, stop, error} = useChat({transport});
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {setMounted(true);}, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => {triggerRef.current?.focus();});
  }, []);

  const scrollToLatest = useCallback(() => {
    followRef.current = true;
    setFollowing(true);
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      // Keep the mobile keyboard closed until the user chooses to write.
      if (window.matchMedia("(pointer: fine)").matches && inputRef.current && !inputRef.current.disabled) {
        inputRef.current.focus();
      } else {
        panelRef.current?.focus();
      }
    }, 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault(); closePanel(); return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
      )).filter((node) => node.getClientRects().length > 0);
      if (!nodes.length) {event.preventDefault(); panel.focus(); return;}
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel || !panel.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
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
    const frame = window.requestAnimationFrame(scrollToLatest);
    return () => {window.cancelAnimationFrame(frame);};
  }, [messages, status, isOpen, scrollToLatest]);

  useEffect(() => {
    if (!isOpen || !contentRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (followRef.current) scrollToLatest();
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [isOpen, scrollToLatest]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input, isOpen]);

  const submit = async (value = input) => {
    const text = value.trim();
    if (!text || isBusy || sendingRef.current) return;
    sendingRef.current = true;
    followRef.current = true;
    setFollowing(true);
    setSendError(null);
    setInput("");
    try {
      await sendMessage({text});
    } catch {
      setSendError("Não foi possível concluir a resposta. Confira as propostas antes de repetir o pedido.");
    } finally {
      sendingRef.current = false;
      setProposalRefresh((current) => current + 1);
    }
  };

  if (!mounted) return null;
  return <>
    <button className="fc-launcher" type="button" ref={triggerRef}
      aria-label="Abrir Copiloto FINCO" aria-expanded={isOpen} aria-haspopup="dialog" aria-controls={isOpen ? dialogId : undefined}
      onClick={() => {setProposalRefresh((current) => current + 1); setIsOpen(true);}}>
      <Mark small/><span>Copiloto<span className="fc-launcher-sub">FINCO</span></span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    {isOpen ? createPortal(
      <div className="finco-copilot fc-overlay">
        <button className="fc-backdrop" aria-label="Fechar Copiloto" tabIndex={-1} onClick={closePanel} type="button"/>
        <section className="fc-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
          id={dialogId} lang="pt-BR" tabIndex={-1} ref={panelRef}>
          <header className="fc-header">
            <div className="fc-identity"><Mark small/><div><h2 id={titleId}>Copiloto <span>FINCO</span></h2><p>Seu dinheiro, claro.</p></div></div>
            <button className="fc-icon-button" onClick={closePanel} type="button" aria-label="Fechar Copiloto">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
          </header>
          <p id={descriptionId} className="fc-trust"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="m10 2 6 2v5c0 4-6 8-6 8S4 13 4 9V4l6-2Z" stroke="currentColor" strokeWidth="1.3"/><path d="m7 9 2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>Você revisa. Só a sua confirmação salva.</p>
          <div className="fc-body">
            <div className="fc-scroll" ref={scrollRef} onScroll={() => {
              const container = scrollRef.current;
              if (!container) return;
              const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              followRef.current = atBottom; setFollowing(atBottom);
            }}>
              <div className="fc-content" ref={contentRef}>
                {messages.length === 0 ? <div className="fc-welcome">
                  <div className="fc-eyebrow">UM POUCO MAIS DE CLAREZA</div>
                  <h3>Vamos cuidar<br/>do seu <span>dinheiro?</span></h3>
                  <p>Consulte seus registros ou prepare um lançamento. Eu organizo os detalhes; você decide o que salvar.</p>
                  <div className="fc-suggestions">{suggestions.map((suggestion) => <button key={suggestion.title} type="button" disabled={isBusy} onClick={() => {void submit(suggestion.text);}}>
                    <span className="fc-suggestion-icon" aria-hidden="true">{suggestion.symbol}</span>
                    <span><span className="fc-suggestion-title">{suggestion.title}</span><span className="fc-suggestion-detail">{suggestion.detail}</span></span>
                    <span className="fc-suggestion-arrow" aria-hidden="true">↗</span>
                  </button>)}</div>
                </div> : null}
                <div className="fc-conversation" role="log" aria-label="Conversa com o Copiloto" aria-live="off">
                  {messages.map((message) => {
                    const text = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n\n");
                    if (!text.trim()) return null;
                    const isUser = message.role === "user";
                    return <div key={message.id} className={`fc-message ${isUser ? "fc-message-user" : "fc-message-assistant"}`}>
                      <div className="fc-message-author">{!isUser ? <Mark small/> : null}<span>{isUser ? "Você" : "Copiloto"}</span></div>
                      <div className="fc-message-text"><CopilotMessage text={text} isUser={isUser}/></div>
                    </div>;
                  })}
                </div>
                {isBusy ? <div className="fc-thinking" role="status"><span className="fc-thinking-dots" aria-hidden="true"><i/><i/><i/></span><span>{status === "submitted" ? "Consultando seus registros…" : "Preparando a resposta…"}</span></div> : null}
                {error || sendError ? <div className="fc-error" role="alert">{sendError ?? "Não foi possível concluir a resposta. Atualize as propostas antes de repetir um pedido de lançamento."}</div> : null}
                <div className="fc-proposals"><ProposalList locale={locale} isBusy={isBusy} refreshKey={proposalRefresh}/></div>
              </div>
            </div>
            {!following && messages.length > 0 ? <button className="fc-latest" type="button" onClick={scrollToLatest}>Últimas mensagens <span aria-hidden="true">↓</span></button> : null}
          </div>
          <footer className="fc-footer">
            <form className="fc-composer" onSubmit={(event) => {event.preventDefault(); void submit();}}>
              <label className="fc-sr-only" htmlFor={`${dialogId}-input`}>Mensagem para o Copiloto</label>
              <textarea id={`${dialogId}-input`} ref={inputRef} rows={1} value={input} disabled={isBusy} maxLength={4000}
                placeholder="O que vamos organizar hoje?" onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault(); void submit();
                  }
                }}/>
              {isBusy ? <button className="fc-send fc-stop" type="button" aria-label="Parar resposta" title="Parar resposta" onClick={() => {void stop();}}><span aria-hidden="true"/></button>
                : <button className="fc-send" type="submit" disabled={!input.trim()} aria-label="Enviar mensagem" title="Enviar mensagem"><Arrow/></button>}
            </form>
            <div className="fc-composer-meta"><span>{isBusy ? "Parar não cancela propostas já preparadas." : "Dados registrados no FINCO, não consulta bancária em tempo real."}</span><span className="fc-key-hint">↵ enviar</span></div>
          </footer>
        </section>
      </div>, document.body,
    ) : null}
  </>;
}
