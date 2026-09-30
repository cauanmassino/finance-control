import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryActions} from "@/components/categories/category-actions";
import {CategoryIcon} from "@/components/categories/category-icon";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Organize receitas e despesas por categoria.",
};

type CategoriesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type CategoryType = "income" | "expense";

type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
};

type CategoryItemProps = {
  category: Category;
  locale: string;
  isEnglish: boolean;
};

function CategoryItem({
  category,
  locale,
  isEnglish,
}: CategoryItemProps) {
  const typeLabel =
    category.type === "income"
      ? isEnglish
        ? "Income"
        : "Receita"
      : isEnglish
        ? "Expense"
        : "Despesa";

  const color = category.color || "#64748b";
  const currentLocale = locale === "en" ? "en" : "pt";

  return (
    <li className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 transition hover:border-white/[0.15] hover:bg-white/[0.065] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${color}20`,
            color,
            boxShadow: `0 0 18px ${color}24`,
          }}
          title={category.icon ?? "other"}
        >
          <CategoryIcon
            name={category.icon}
            size={21}
            strokeWidth={1.9}
          />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">
            {category.name}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />

            <p className="text-xs text-slate-400">{typeLabel}</p>
          </div>
        </div>
      </div>

      <div className="opacity-100 transition-opacity sm:opacity-75 sm:group-hover:opacity-100">
        <CategoryActions
          locale={currentLocale}
          categoryId={category.id}
        />
      </div>
    </li>
  );
}

export default async function CategoriesPage({
  params,
}: CategoriesPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: categories, error} = await supabase
    .from("categories")
    .select("id, name, type, color, icon")
    .eq("user_id", user.id)
    .order("name", {ascending: true});

  if (error) {
    console.error("Erro detalhado ao carregar categorias:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Não foi possível carregar as categorias.");
  }

  const typedCategories = (categories ?? []) as Category[];

  const incomeCategories = typedCategories.filter(
    (category) => category.type === "income",
  );

  const expenseCategories = typedCategories.filter(
    (category) => category.type === "expense",
  );

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-fuchsia-950/24 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-fuchsia-400/16 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-44 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Financial structure" : "Estrutura financeira"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Give every transaction meaning."
                : "Dê sentido a cada lançamento."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Use categories to understand where money comes from and where it goes."
                : "Use categorias para entender de onde seu dinheiro vem e para onde ele vai."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {typedCategories.length}{" "}
                {isEnglish
                  ? typedCategories.length === 1
                    ? "category"
                    : "categories"
                  : typedCategories.length === 1
                    ? "categoria"
                    : "categorias"}
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                {incomeCategories.length}{" "}
                {isEnglish ? "income" : "de receita"}
              </span>

              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs font-semibold text-rose-100">
                {expenseCategories.length}{" "}
                {isEnglish ? "expense" : "de despesa"}
              </span>
            </div>
          </div>

          <Link
            href={`/${locale}/categories/new`}
            className="app-shine inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-300 px-5 text-sm font-bold text-fuchsia-950 shadow-[0_16px_34px_rgba(232,121,249,0.18)] transition hover:-translate-y-0.5 hover:bg-fuchsia-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "New category" : "Nova categoria"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Total" : "Total"}
          </p>

          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white">
            {typedCategories.length}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {isEnglish
              ? "Categories available for your records."
              : "Categorias disponíveis para seus lançamentos."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Income" : "Receitas"}
          </p>

          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-emerald-200">
            {incomeCategories.length}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {isEnglish
              ? "Sources that increase your balance."
              : "Fontes que aumentam seu saldo."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Expenses" : "Despesas"}
          </p>

          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-rose-200">
            {expenseCategories.length}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {isEnglish
              ? "Destinations that consume your budget."
              : "Destinos que consomem seu orçamento."}
          </p>
        </article>
      </section>

      {typedCategories.length === 0 ? (
        <section className="app-surface rounded-[1.7rem] p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-fuchsia-300/[0.1] text-2xl text-fuchsia-200">
            ◉
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
            {isEnglish
              ? "No categories created yet"
              : "Nenhuma categoria criada"}
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Create categories to classify income and expenses with clarity."
              : "Crie categorias para classificar receitas e despesas com clareza."}
          </p>

          <Link
            href={`/${locale}/categories/new`}
            className="app-shine mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-fuchsia-300 px-4 text-sm font-bold text-fuchsia-950 shadow-[0_10px_24px_rgba(232,121,249,0.18)] transition hover:bg-fuchsia-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "Create first category" : "Criar primeira categoria"}
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          <article className="app-surface overflow-hidden rounded-[1.7rem]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/[0.12] text-lg text-emerald-200">
                  ↗
                </span>

                <div>
                  <p className="app-kicker">
                    {isEnglish ? "Positive flow" : "Fluxo positivo"}
                  </p>

                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
                    {isEnglish ? "Income categories" : "Categorias de receita"}
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-100">
                {incomeCategories.length}
              </span>
            </div>

            {incomeCategories.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-slate-400">
                  {isEnglish
                    ? "No income categories created."
                    : "Nenhuma categoria de receita criada."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2 p-4 sm:p-5">
                {incomeCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    locale={locale}
                    isEnglish={isEnglish}
                  />
                ))}
              </ul>
            )}
          </article>

          <article className="app-surface overflow-hidden rounded-[1.7rem]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-300/[0.12] text-lg text-rose-200">
                  ↘
                </span>

                <div>
                  <p className="app-kicker">
                    {isEnglish ? "Outgoing flow" : "Fluxo de saída"}
                  </p>

                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
                    {isEnglish ? "Expense categories" : "Categorias de despesa"}
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 text-xs font-bold text-rose-100">
                {expenseCategories.length}
              </span>
            </div>

            {expenseCategories.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-slate-400">
                  {isEnglish
                    ? "No expense categories created."
                    : "Nenhuma categoria de despesa criada."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2 p-4 sm:p-5">
                {expenseCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    locale={locale}
                    isEnglish={isEnglish}
                  />
                ))}
              </ul>
            )}
          </article>
        </section>
      )}
    </main>
  );
}