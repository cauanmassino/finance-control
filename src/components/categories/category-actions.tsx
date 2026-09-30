"use client";

import Link from "next/link";
import {useActionState, useState} from "react";
import {deleteCategory} from "@/app/[locale]/(app)/categories/actions";

type CategoryActionsProps = {
  locale: string;
  categoryId: string;
};

type DeleteCategoryState = {
  error?: string;
};

const initialState: DeleteCategoryState = {
  error: undefined,
};

export function CategoryActions({
  locale,
  categoryId,
}: CategoryActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const [state, formAction, isPending] = useActionState(
    deleteCategory,
    initialState,
  );

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Link
        href={`/${locale}/categories/${categoryId}/edit`}
        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
      >
        Editar
      </Link>

      {isConfirming ? (
        <form
          action={formAction}
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="locale" value={locale} />

          <input
            type="hidden"
            name="category_id"
            value={categoryId}
          />

          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Excluindo..." : "Confirmar"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 bg-background px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Excluir
        </button>
      )}

      {state.error ? (
        <p className="w-full text-xs text-red-600 sm:basis-full">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}