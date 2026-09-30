"use client";

import {useActionState} from "react";
import {
  createCategory,
  type CategoryState,
} from "@/app/[locale]/(app)/categories/actions";

type CategoryFormProps = {
  locale: string;
};

const initialState: CategoryState = {
  error: undefined,
};

export function CategoryForm({locale}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border p-6"
    >
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium leading-none"
        >
          Nome
        </label>

        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ex.: Alimentação"
          maxLength={50}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="type"
          className="text-sm font-medium leading-none"
        >
          Tipo
        </label>

        <select
          id="type"
          name="type"
          defaultValue="expense"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="color"
          className="text-sm font-medium leading-none"
        >
          Cor
        </label>

        <input
          id="color"
          name="color"
          type="color"
          defaultValue="#ef4444"
          className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="icon"
          className="text-sm font-medium leading-none"
        >
          Ícone opcional
        </label>

        <input
          id="icon"
          name="icon"
          type="text"
          placeholder="Ex.: 🍔"
          maxLength={10}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        <p className="text-xs text-muted-foreground">
          Você pode usar um emoji, como 🍔, 🚗 ou 🏠.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href={`/${locale}/categories`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cancelar
        </a>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}