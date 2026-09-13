
import Link from "next/link";
import {redirect} from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Landmark,
  LogOut,
  Plus,
  Settings,
  Tags,
  WalletCards
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/server";
import {signOut} from "../auth/actions";

type DashboardPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function formatCurrency(value: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export default async function DashboardPage({
  params
}: DashboardPageProps) {
  const {locale} = await params;
  const safeLocale = locale === "en" ? "en" : "pt";
  const isEnglish = safeLocale === "en";

  const supabase = await createClient();

  // getUser valida o token do usuário contra o Supabase Auth.
  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "Usuário";

  const navigation = [
    {
      href: `/${safeLocale}/dashboard`,
      label: isEnglish ? "Overview" : "Visão geral",
      icon: WalletCards,
      active: true
    },
    {
      href: `/${safeLocale}/transactions`,
      label: isEnglish ? "Transactions" : "Transações",
      icon: Landmark,
      active: false
    },
    {
      href: `/${safeLocale}/accounts`,
      label: isEnglish ? "Accounts" : "Contas",
      icon: WalletCards,
      active: false
    },
    {
      href: `/${safeLocale}/cards`,
      label: isEnglish ? "Cards" : "Cartões",
      icon: CreditCard,
      active: false
    },
    {
      href: `/${safeLocale}/categories`,
      label: isEnglish ? "Categories" : "Categorias",
      icon: Tags,
      active: false
    },
    {
      href: `/${safeLocale}/settings`,
      label: isEnglish ? "Settings" : "Configurações",
      icon: Settings,
      active: false
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-5 md:flex md:flex-col">
          <Link
            href={`/${safeLocale}/dashboard`}
            className="mb-10 text-lg font-semibold tracking-tight text-white"
          >
            Finance <span className="text-emerald-400">Control</span>
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    item.active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOut.bind(null, safeLocale)} className="mt-auto">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {isEnglish ? "Sign out" : "Sair"}
            </Button>
          </form>
        </aside>

        <section className="min-w-0 flex-1 p-5 sm:p-8">
          <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                {isEnglish ? "Welcome back," : "Bem-vindo de volta,"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {firstName}
              </h1>
            </div>

            <Link
              href={`/${safeLocale}/transactions/new`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              {isEnglish ? "New transaction" : "Nova transação"}
            </Link>
          </header>

          <div className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  {isEnglish ? "September 2026" : "Setembro de 2026"}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {isEnglish ? "Financial overview" : "Resumo financeiro"}
                </h2>
              </div>

              <p className="text-sm text-slate-400">
                {isEnglish
                  ? "Data will appear after your first transaction."
                  : "Os dados aparecerão após sua primeira transação."}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card className="border-slate-800 bg-slate-900/70 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {isEnglish ? "Current balance" : "Saldo atual"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(0, safeLocale)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {isEnglish
                      ? "Calculated from your accounts and transactions."
                      : "Calculado a partir das suas contas e transações."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {isEnglish ? "Income this month" : "Receitas no mês"}
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-emerald-400">
                    {formatCurrency(0, safeLocale)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {isEnglish
                      ? "No income registered this month."
                      : "Nenhuma receita registrada neste mês."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {isEnglish ? "Expenses this month" : "Despesas no mês"}
                  </CardTitle>
                  <ArrowDownRight className="h-4 w-4 text-rose-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-rose-400">
                    {formatCurrency(0, safeLocale)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {isEnglish
                      ? "No expenses registered this month."
                      : "Nenhuma despesa registrada neste mês."}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card className="min-h-72 border-slate-800 bg-slate-900/70 text-white">
                <CardHeader>
                  <CardTitle className="text-base">
                    {isEnglish
                      ? "Monthly cash flow"
                      : "Fluxo de caixa mensal"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-48 items-center justify-center">
                  <p className="max-w-xs text-center text-sm leading-6 text-slate-500">
                    {isEnglish
                      ? "Your income and expense chart will appear here after transactions are added."
                      : "Seu gráfico de receitas e despesas aparecerá aqui após adicionar transações."}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-h-72 border-slate-800 bg-slate-900/70 text-white">
                <CardHeader>
                  <CardTitle className="text-base">
                    {isEnglish ? "Expenses by category" : "Despesas por categoria"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-48 items-center justify-center">
                  <p className="max-w-xs text-center text-sm leading-6 text-slate-500">
                    {isEnglish
                      ? "Your category distribution will appear here after transactions are added."
                      : "A distribuição das suas categorias aparecerá aqui após adicionar transações."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}