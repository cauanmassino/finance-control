"use client";

import Link from "next/link";
import {useId, useMemo, useState} from "react";
import {Plus, Search, X} from "lucide-react";
import {CategoryActions} from "@/components/categories/category-actions";
import {CategoryIcon} from "@/components/categories/category-icon";

export type CategoryListItem = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
};

type Props = {locale: string; categories: CategoryListItem[]};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export function CategoriesBrowser({locale, categories}: Props) {
  const isEnglish = locale === "en";
  const [selected, setSelected] = useState<"income" | "expense">("expense");
  const [search, setSearch] = useState("");
  const searchId = useId();
  const listId = useId();
  const incomeCount = categories.filter((item) => item.type === "income").length;
  const expenseCount = categories.filter((item) => item.type === "expense").length;
  const filtered = useMemo(() => {
    const query = normalize(search);
    return categories.filter((item) => item.type === selected && (!query || normalize(item.name).includes(query)));
  }, [categories, selected, search]);
  const selectedLabel = selected === "expense"
    ? (isEnglish ? "Expenses" : "Despesas")
    : (isEnglish ? "Income" : "Receitas");
  const controls = [
    {value: "expense" as const, label: isEnglish ? "Expenses" : "Despesas", count: expenseCount},
    {value: "income" as const, label: isEnglish ? "Income" : "Receitas", count: incomeCount},
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-8 sm:space-y-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {isEnglish ? "Categories" : "Categorias"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isEnglish ? "Organize your income and expenses, your way." : "Organize suas receitas e despesas, do seu jeito."}
          </p>
        </div>
        <Link href={`/${locale}/categories/new`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-2xl bg-fuchsia-300 px-4 text-sm font-medium text-fuchsia-950 transition-colors hover:bg-fuchsia-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fuchsia-300">
          <Plus size={17} aria-hidden="true"/>{isEnglish ? "New category" : "Nova categoria"}
        </Link>
      </header>

      <section aria-label={isEnglish ? "Category navigation" : "Navegação das categorias"} className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full gap-1 rounded-2xl bg-white/4 p-1 sm:w-auto" role="group" aria-label={isEnglish ? "Category type" : "Tipo de categoria"}>
            {controls.map((control) => <button key={control.value} type="button"
              aria-pressed={selected === control.value} aria-controls={listId}
              onClick={() => setSelected(control.value)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-none ${selected === control.value ? "bg-white/8 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {control.label}<span className={`text-xs tabular-nums ${selected === control.value ? (control.value === "income" ? "text-emerald-200" : "text-rose-200") : "text-muted-foreground"}`}>{control.count}</span>
            </button>)}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor={searchId} className="sr-only">{isEnglish ? "Search categories" : "Buscar categorias"}</label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={isEnglish ? "Search categories" : "Buscar categoria"}
              className="min-h-11 w-full rounded-2xl border border-transparent bg-white/[0.035] py-2.5 pl-10 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring/50 sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"/>
            {search ? <button type="button" onClick={() => {setSearch(""); document.getElementById(searchId)?.focus();}}
              aria-label={isEnglish ? "Clear search" : "Limpar busca"}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"><X size={15} aria-hidden="true"/></button> : null}
          </div>
        </div>

        <div id={listId} className="rounded-3xl bg-white/2.5 p-2 sm:p-3">
          <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3 sm:px-4">
            <h2 className="text-xs font-medium text-muted-foreground">{selectedLabel}</h2>
            <p role="status" className="text-xs tabular-nums text-muted-foreground">
              {filtered.length} {isEnglish ? (filtered.length === 1 ? "category" : "categories") : (filtered.length === 1 ? "categoria" : "categorias")}
            </p>
          </div>
          {filtered.length ? <ul className="space-y-1">
            {filtered.map((category) => <li key={category.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/3 sm:px-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/4" style={{color: category.color || "#64748b"}}>
                  <CategoryIcon name={category.icon} size={20} strokeWidth={1.8}/>
                </span>
                <span className="min-w-0 wrap-break-word text-sm font-medium leading-6 text-foreground">{category.name}</span>
              </div>
              <CategoryActions locale={locale} categoryId={category.id} categoryName={category.name}/>
            </li>)}
          </ul> : <div className="px-5 py-12 text-center sm:py-16">
            <p className="text-sm font-medium text-foreground">{search
              ? (isEnglish ? "No matching categories" : "Nenhuma categoria encontrada")
              : (isEnglish ? "No categories in this group yet" : "Nenhuma categoria neste grupo")}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{search
              ? (isEnglish ? "Try another name or switch the category type." : "Tente outro nome ou alterne entre despesas e receitas.")
              : (isEnglish ? "Create a category to start organizing your records." : "Crie uma categoria para começar a organizar seus lançamentos.")}</p>
            {!search ? <Link href={`/${locale}/categories/new`} className="mt-5 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-fuchsia-200 hover:bg-white/4">{isEnglish ? "Create category" : "Criar categoria"}</Link> : null}
          </div>}
        </div>
      </section>
    </div>
  );
}
