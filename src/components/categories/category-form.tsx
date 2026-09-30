"use client";

import {useActionState, useState} from "react";
import {createCategory} from "@/app/[locale]/(app)/categories/actions";
import {CategoryIconPicker} from "@/components/categories/category-icon-picker";

type CategoryFormProps = {
  locale: string;
};

export function CategoryForm({locale}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(createCategory, {});
  const [icon, setIcon] = useState("utensils");
  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <input type="hidden" name="locale" value={locale} />

      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">
          {isEnglish ? "New category" : "Nova categoria"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEnglish
            ? "Create groups for your income and expenses."
            : "Crie grupos para suas receitas e despesas."}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Category name" : "Nome da categoria"}
          </span>

          <input
            name="name"
            type="text"
            required
            maxLength={80}
            disabled={isPending}
            placeholder={isEnglish ? "e.g. Food" : "Ex.: Alimentação"}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Category type" : "Tipo de categoria"}
          </span>

          <select
            name="type"
            defaultValue="expense"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="expense">
              {isEnglish ? "Expense" : "Despesa"}
            </option>

            <option value="income">
              {isEnglish ? "Income" : "Receita"}
            </option>
          </select>
        </label>

        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Icon" : "Ícone"}
            </span>

            <p className="mt-1 text-xs text-slate-500">
              {isEnglish
                ? "Search or browse available icons."
                : "Pesquise ou navegue pelos ícones disponíveis."}
            </p>
          </div>

          <CategoryIconPicker
            value={icon}
            onChange={setIcon}
            locale={locale}
            disabled={isPending}
          />
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Color" : "Cor"}
          </span>

          <div className="flex h-[42px] items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3">
            <input
              name="color"
              type="color"
              defaultValue="#64748b"
              disabled={isPending}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              aria-label={isEnglish ? "Category color" : "Cor da categoria"}
            />

            <span className="text-sm text-slate-500">
              {isEnglish
                ? "Choose an identifying color."
                : "Escolha uma cor para identificar a categoria."}
            </span>
          </div>
        </label>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Saving..."
              : "Salvando..."
            : isEnglish
              ? "Create category"
              : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}