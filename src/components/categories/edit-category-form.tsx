"use client";

import Link from "next/link";
import {useActionState, useState} from "react";
import {
  type CategoryState,
  updateCategory,
} from "@/app/[locale]/(app)/categories/actions";
import {CategoryIconPicker} from "@/components/categories/category-icon-picker";

type CategoryType = "income" | "expense";

type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
};

type EditCategoryFormProps = {
  locale: string;
  category: Category;
};

const initialState: CategoryState = {
  error: undefined,
};

export function EditCategoryForm({
  locale,
  category,
}: EditCategoryFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCategory,
    initialState,
  );

  const [icon, setIcon] = useState(category.icon || "utensils");
  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="app-surface rounded-[1.7rem] p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="category_id" value={category.id} />

      <div className="mb-6">
        <p className="app-kicker">
          {isEnglish ? "Category settings" : "Configurações da categoria"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Refine your category" : "Ajuste sua categoria"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Update the name, type, icon, or color used in your records."
            : "Atualize o nome, tipo, ícone ou cor usados nos seus lançamentos."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Category name" : "Nome da categoria"}
          </span>

          <input
            name="name"
            type="text"
            defaultValue={category.name}
            maxLength={80}
            required
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-fuchsia-300/55 focus:ring-2 focus:ring-fuchsia-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Category type" : "Tipo de categoria"}
          </span>

          <select
            name="type"
            defaultValue={category.type}
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-fuchsia-300/55 focus:ring-2 focus:ring-fuchsia-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="expense">
              {isEnglish ? "Expense" : "Despesa"}
            </option>

            <option value="income">
              {isEnglish ? "Income" : "Receita"}
            </option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Icon" : "Ícone"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {isEnglish
              ? "Search and choose a new visual representation."
              : "Pesquise e escolha uma nova representação visual."}
          </p>
        </div>

        <CategoryIconPicker
          value={icon}
          onChange={setIcon}
          locale={locale}
          disabled={isPending}
        />
      </div>

      <label className="mt-6 block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {isEnglish ? "Category color" : "Cor da categoria"}
        </span>

        <div className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.1] bg-slate-950/45 px-3">
          <input
            name="color"
            type="color"
            defaultValue={category.color}
            disabled={isPending}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
            aria-label={isEnglish ? "Category color" : "Cor da categoria"}
          />

          <span className="text-sm text-slate-500">
            {isEnglish
              ? "Use a color to identify this category."
              : "Use uma cor para identificar esta categoria."}
          </span>
        </div>
      </label>

      {state.error ? (
        <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${locale}/categories`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          {isEnglish ? "Cancel" : "Cancelar"}
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-fuchsia-300 px-5 text-sm font-bold text-fuchsia-950 shadow-[0_12px_26px_rgba(232,121,249,0.18)] transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Saving changes..."
              : "Salvando alterações..."
            : isEnglish
              ? "Save changes"
              : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}