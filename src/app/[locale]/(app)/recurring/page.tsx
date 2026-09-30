import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";
import {RecurringForm} from "@/components/recurring/recurring-form";
import {RecurringActions} from "@/components/recurring/recurring-actions";

export const metadata: Metadata = {
  title: "Recorrências",
  description: "Planeje receitas e despesas que se repetem.",
};

type RecurringPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type RecurringType = "income" | "expense";
type Frequency = "weekly" | "monthly" | "yearly";

type Account = {
  id: string;
  name: string;
  color: string | null;
};

type Category = {
  id: string;
  name: string;
  type: RecurringType;
  color: string | null;
  icon: string | null;
};

type RecurringItemFromDatabase = {
  id: string;
  description: string;
  amount: number | string;
  type: RecurringType;
  frequency: Frequency;
  start_date: string;
  next_occurrence: string;
  end_date: string | null;
  payment_method: string | null;
  notes: string | null;
  is_active: boolean;
  account: Account[] | Account | null;
  category: Category[] | Category | null;
};

type RecurringItem = Omit<
  RecurringItemFromDatabase,
  "account" | "category"
> & {
  account: Account | null;
  category: Category | null;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getFrequencyLabel(frequency: Frequency, isEnglish: boolean) {
  if (frequency === "weekly") {
    return isEnglish ? "Weekly" : "Semanal";
  }

  if (frequency === "yearly") {
    return isEnglish ? "Yearly" : "Anual";
  }

  return isEnglish ? "Monthly" : "Mensal";
}

function getDaysUntil(date: string) {
  const today = new Date();
  const todayAtMidday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );

  const target = new Date(`${date}T12:00:00`);
  const difference = target.getTime() - todayAtMidday.getTime();

  return Math.round(difference / (1000 * 60 * 60 * 24));
}

function getDueLabel(daysUntil: number, isEnglish: boolean) {
  if (daysUntil < 0) {
    return isEnglish
      ? `${Math.abs(daysUntil)} day(s) overdue`
      : `${Math.abs(daysUntil)} dia(s) em atraso`;
  }

  if (daysUntil === 0) {
    return isEnglish ? "Due today" : "Vence hoje";
  }

  if (daysUntil === 1) {
    return isEnglish ? "Due tomorrow" : "Vence amanhã";
  }

  return isEnglish
    ? `Due in ${daysUntil} days`
    : `Vence em ${daysUntil} dias`;
}

export default async function RecurringPage({
  params,
}: RecurringPageProps) {
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

  const [
    {data: accounts, error: accountsError},
    {data: categories, error: categoriesError},
    {data: recurringItems, error: recurringError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("categories")
      .select("id, name, type, color, icon")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("recurring_transactions")
      .select(`
        id,
        description,
        amount,
        type,
        frequency,
        start_date,
        next_occurrence,
        end_date,
        payment_method,
        notes,
        is_active,
        account:accounts!recurring_transactions_account_id_fkey (
          id,
          name,
          color
        ),
        category:categories!recurring_transactions_category_id_fkey (
          id,
          name,
          type,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .order("is_active", {ascending: false})
      .order("next_occurrence", {ascending: true}),
  ]);

  if (accountsError) {
    console.error("Erro ao carregar contas para recorrências:", accountsError);
    throw new Error("Não foi possível carregar as contas.");
  }

  if (categoriesError) {
    console.error(
      "Erro ao carregar categorias para recorrências:",
      categoriesError,
    );
    throw new Error("Não foi possível carregar as categorias.");
  }

  if (recurringError) {
    console.error("Erro ao carregar recorrências:", recurringError);
    throw new Error("Não foi possível carregar as recorrências.");
  }

  const typedAccounts = (accounts ?? []) as Account[];
  const typedCategories = (categories ?? []) as Category[];

  const typedRecurringItems: RecurringItem[] = (
    (recurringItems ?? []) as unknown as RecurringItemFromDatabase[]
  ).map((item) => ({
    ...item,
    account: getFirstRelation(item.account),
    category: getFirstRelation(item.category),
  }));

  const activeItems = typedRecurringItems.filter((item) => item.is_active);
  const pausedItems = typedRecurringItems.filter((item) => !item.is_active);

  const totalMonthlyExpenses = activeItems
    .filter((item) => item.type === "expense" && item.frequency === "monthly")
    .reduce((total, item) => total + Number(item.amount), 0);

  const totalMonthlyIncome = activeItems
    .filter((item) => item.type === "income" && item.frequency === "monthly")
    .reduce((total, item) => total + Number(item.amount), 0);

  const today = toDateString(new Date());

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-violet-950/28 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-400/16 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <p className="app-kicker">
            {isEnglish ? "Automatic planning" : "Planejamento automático"}
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
            {isEnglish
              ? "Keep recurring finances predictable."
              : "Mantenha suas finanças recorrentes previsíveis."}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            {isEnglish
              ? "Plan subscriptions, fixed bills, salary, and any income or expense that repeats over time."
              : "Planeje assinaturas, contas fixas, salário e qualquer receita ou despesa que se repete ao longo do tempo."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Active items" : "Itens ativos"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-violet-200">
            {activeItems.length}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Recurring income and expenses currently enabled."
              : "Receitas e despesas recorrentes atualmente ativas."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Monthly income" : "Receita mensal"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-emerald-200">
            {formatCurrency(totalMonthlyIncome, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Active monthly recurring income."
              : "Receitas recorrentes mensais ativas."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Monthly expenses" : "Despesas mensais"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-rose-300">
            {formatCurrency(totalMonthlyExpenses, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Active monthly recurring expenses."
              : "Despesas recorrentes mensais ativas."}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <RecurringForm
          locale={locale}
          accounts={typedAccounts}
          categories={typedCategories}
          today={today}
        />

        <article className="app-surface overflow-hidden rounded-[1.7rem]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="app-kicker">
                {isEnglish ? "Scheduled items" : "Itens programados"}
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Your recurrences" : "Suas recorrências"}
              </h2>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
              {typedRecurringItems.length}{" "}
              {isEnglish
                ? typedRecurringItems.length === 1
                  ? "item"
                  : "items"
                : typedRecurringItems.length === 1
                  ? "item"
                  : "itens"}
            </span>
          </div>

          {typedRecurringItems.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-violet-300/[0.1] text-2xl text-violet-200">
                ↻
              </span>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
                {isEnglish
                  ? "No recurring items yet"
                  : "Nenhuma recorrência cadastrada"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Create recurring income or expenses to plan your financial routine."
                  : "Crie receitas ou despesas recorrentes para planejar sua rotina financeira."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {typedRecurringItems.map((item) => {
                const isIncome = item.type === "income";
                const daysUntil = getDaysUntil(item.next_occurrence);

                const accentColor =
                  item.category?.color ??
                  (isIncome ? "#6ee7b7" : "#fda4af");

                return (
                  <div key={item.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: `${accentColor}1f`,
                              color: accentColor,
                              boxShadow: `0 0 18px ${accentColor}18`,
                            }}
                          >
                            {item.category?.icon ? (
                              <CategoryIcon
                                name={item.category.icon}
                                size={21}
                                strokeWidth={1.9}
                              />
                            ) : (
                              <span className="text-lg">
                                {isIncome ? "↗" : "↘"}
                              </span>
                            )}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {item.description}
                              </p>

                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                                  item.is_active
                                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                                    : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                                }`}
                              >
                                {item.is_active
                                  ? isEnglish
                                    ? "Active"
                                    : "Ativa"
                                  : isEnglish
                                    ? "Paused"
                                    : "Pausada"}
                              </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                              <span>
                                {getFrequencyLabel(item.frequency, isEnglish)}
                              </span>

                              <span className="text-slate-600">·</span>

                              <span>
                                {item.category?.name ??
                                  (isEnglish
                                    ? "No category"
                                    : "Sem categoria")}
                              </span>

                              <span className="text-slate-600">·</span>

                              <span>
                                {item.account?.name ??
                                  (isEnglish ? "No account" : "Sem conta")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p
                            className={`font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] ${
                              isIncome
                                ? "text-emerald-200"
                                : "text-rose-300"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(Number(item.amount), locale)}
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              daysUntil < 0
                                ? "text-rose-300"
                                : daysUntil <= 3
                                  ? "text-amber-200"
                                  : "text-slate-400"
                            }`}
                          >
                            {getDueLabel(daysUntil, isEnglish)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            {isEnglish ? "Next occurrence" : "Próxima ocorrência"}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-200">
                            {formatDate(item.next_occurrence, locale)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            {isEnglish ? "Payment method" : "Método de pagamento"}
                          </p>

                          <p className="mt-1 truncate text-sm font-medium text-slate-200">
                            {item.payment_method ??
                              (isEnglish ? "Not informed" : "Não informado")}
                          </p>
                        </div>
                      </div>

                      {item.notes ? (
                        <p className="text-sm leading-6 text-slate-400">
                          {item.notes}
                        </p>
                      ) : null}

                      <RecurringActions
                        locale={locale}
                        recurringId={item.id}
                        isActive={item.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      {pausedItems.length > 0 ? (
        <section className="rounded-2xl border border-slate-400/15 bg-slate-400/[0.04] px-5 py-4 text-sm text-slate-300">
          {isEnglish
            ? `${pausedItems.length} recurring item(s) are paused and will not generate transactions until resumed.`
            : `${pausedItems.length} recorrência(s) está(ão) pausada(s) e não gerará(ão) lançamentos até serem retomadas.`}
        </section>
      ) : null}

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Important" : "Importante"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Generate items when they are due"
                : "Gere os lançamentos quando vencerem"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "For now, recurring items are generated manually. Clicking “Generate entry” creates the transaction, advances the next occurrence, and updates the dashboard, budgets, and transaction list."
                : "Por enquanto, as recorrências são geradas manualmente. Ao clicar em “Gerar lançamento”, o sistema cria a transação, avança a próxima ocorrência e atualiza dashboard, orçamentos e lista de lançamentos."}
            </p>
          </div>

          <Link
            href={`/${locale}/transactions`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            {isEnglish ? "View transactions" : "Ver lançamentos"}
          </Link>
        </div>
      </section>
    </main>
  );
}