"use client";

import Link from "next/link";
import {useActionState, useEffect, useId, useRef, useState} from "react";
import {Pencil, Trash2} from "lucide-react";
import {deleteCategory} from "@/app/[locale]/(app)/categories/actions";

type CategoryActionsProps = {locale: string; categoryId: string; categoryName?: string};
type DeleteCategoryState = {error?: string};
const initialState: DeleteCategoryState = {error: undefined};

export function CategoryActions({locale, categoryId, categoryName}: CategoryActionsProps) {
  const isEnglish = locale === "en";
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteCategory, initialState);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmationId = useId();
  const errorId = useId();
  const name = categoryName || (isEnglish ? "category" : "categoria");
  const editLabel = isEnglish ? `Edit ${name}` : `Editar ${name}`;
  const deleteLabel = isEnglish ? `Delete ${name}` : `Excluir ${name}`;
  useEffect(() => {if (isConfirming) cancelRef.current?.focus();}, [isConfirming]);
  const cancel = () => {
    if (isPending) return;
    setIsConfirming(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div className={isConfirming ? "w-full min-w-0" : "flex shrink-0 flex-col items-end"}>
      {!isConfirming ? <div className="flex items-center gap-1">
        <Link href={`/${locale}/categories/${categoryId}/edit`} aria-label={editLabel} title={editLabel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Pencil size={16} strokeWidth={1.7} aria-hidden="true"/>
        </Link>
        <button ref={triggerRef} type="button" onClick={() => setIsConfirming(true)}
          aria-label={deleteLabel} title={deleteLabel} aria-expanded={false}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-rose-300/[0.08] hover:text-rose-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Trash2 size={16} strokeWidth={1.7} aria-hidden="true"/>
        </button>
      </div> : <form action={formAction} aria-labelledby={confirmationId} aria-describedby={state.error ? errorId : undefined}
        aria-busy={isPending} onKeyDown={(event) => {if (event.key === "Escape") {event.preventDefault(); event.stopPropagation(); cancel();}}}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.035] px-3 py-3">
        <input type="hidden" name="locale" value={locale}/>
        <input type="hidden" name="category_id" value={categoryId}/>
        <p id={confirmationId} className="min-w-0 flex-1 basis-40 break-words text-xs leading-5 text-muted-foreground">{isEnglish ? `Delete “${name}”?` : `Excluir “${name}”?`}</p>
        <div className="flex items-center gap-2">
          <button ref={cancelRef} type="button" onClick={cancel} disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-xs font-medium text-foreground hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50">{isEnglish ? "Cancel" : "Cancelar"}</button>
          <button type="submit" disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-300/10 px-3 text-xs font-medium text-rose-200 hover:bg-rose-300/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? (isEnglish ? "Deleting…" : "Excluindo…") : (isEnglish ? "Confirm deletion" : "Confirmar exclusão")}
          </button>
        </div>
      </form>}
      {state.error ? <p id={errorId} role="alert" className="mt-2 max-w-sm break-words text-xs leading-5 text-rose-200">{state.error}</p> : null}
    </div>
  );
}
