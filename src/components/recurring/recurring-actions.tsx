"use client";
import {useActionState, useEffect, useRef, useState} from "react";
import {toggleRecurring, deleteRecurring, type RecurringState} from "@/app/[locale]/(app)/recurring/actions";
const initial: RecurringState = {};
export function RecurringActions({locale, recurringId, isActive}: {locale: string; recurringId: string; isActive: boolean}) {
 const en = locale === "en";
 const [open,setOpen] = useState(false);
 const root = useRef<HTMLDivElement>(null);
 const trigger = useRef<HTMLButtonElement>(null);
 const first = useRef<HTMLButtonElement>(null);
 const [toggleState,toggle,toggling] = useActionState(toggleRecurring,initial);
 const [deleteState,remove,deleting] = useActionState(deleteRecurring,initial);
 const busy = toggling || deleting;
 useEffect(() => {
  if (!open) return;
  first.current?.focus();
  const outside = (e: PointerEvent) => {if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false);};
  const escape = (e: KeyboardEvent) => {if (e.key === "Escape") {setOpen(false);trigger.current?.focus();}};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
  return () => {document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
 },[open]);
 const wasBusy = useRef(false);
 useEffect(() => {
  if (wasBusy.current && !busy && !toggleState.error && !deleteState.error) {setOpen(false);trigger.current?.focus();}
  wasBusy.current = busy;
 },[busy,toggleState.error,deleteState.error]);
 return <div ref={root} className="relative">
  <button ref={trigger} type="button" aria-label={en ? "Series actions" : "Ações da série"} aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 outline-none transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300/50"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>
  {open ? <div role="group" aria-label={en ? "Series actions" : "Ações da série"} className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
   <form action={toggle}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="recurring_id" value={recurringId}/><input type="hidden" name="next_active" value={isActive ? "false" : "true"}/><button ref={first} type="submit" disabled={busy} className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 outline-none transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:opacity-50">{toggling ? (en ? "Updating..." : "Atualizando...") : isActive ? (en ? "Pause series" : "Pausar série") : (en ? "Resume series" : "Retomar série")}</button></form>
   <form action={remove} onSubmit={e => {if (!window.confirm(en ? "Delete this series? Existing transactions remain, but lose their link to the series." : "Excluir esta série? Os lançamentos existentes permanecem, mas perdem o vínculo com a série.")) e.preventDefault();}}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="recurring_id" value={recurringId}/><button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-200 outline-none transition hover:bg-rose-300/[0.06] focus-visible:ring-2 focus-visible:ring-rose-300/40 disabled:opacity-50">{deleting ? (en ? "Deleting..." : "Excluindo...") : (en ? "Delete series" : "Excluir série")}</button></form>
   {toggleState.error || deleteState.error ? <p role="alert" className="px-3 py-2 text-xs leading-5 text-rose-200">{toggleState.error || deleteState.error}</p> : null}
  </div> : null}
 </div>;
}
