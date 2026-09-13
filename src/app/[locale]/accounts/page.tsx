import Link from "next/link";
import {redirect} from "next/navigation";
import {
  Building2,
  Landmark,
  PiggyBank,
  PlusCircle,
  Trash2,
  Wallet,
  WalletCards
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/server";

import {createAccount, deleteAccount} from "./actions";

type AccountsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type Account = {
  id: string;
  name: string;
  institution: string | null;
  type:
    | "checking"
    | "savings"
    | "cash"
    | "digital_wallet"
    | "investment"
    | "other";
  initial_balance: number | string;
  is_active: boolean;
};

function formatCurrency(value: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function accountTypeLabel(accountType: Account["type"], isEnglish: boolean) {
  const labels = {
    checking: isEnglish ? "Checking account" : "Conta corrente",
    savings: isEnglish ? "Savings account" : "Poupança",
    cash: isEnglish ? "Cash" : "Dinheiro",
    digital_wallet: isEnglish ? "Digital wallet" : "Carteira digital",
    investment: isEnglish ? "Investment" : "Investimento",
    other: isEnglish ? "Other" : "Outra"
  };

  return labels[accountType];
}

function AccountIcon({type}: {type: Account["type"]}) {
  const className = "h-5 w-5";

  if (type === "savings") {
    return <PiggyBank className={className} />;
  }

  if (type === "cash") {
    return <Wallet className={className} />;
  }

  if (type === "investment") {
    return <PlusCircle className={className} />;
  }

  return <Building2 className={className} />;
}

export default async function AccountsPage({
  params,
  searchParams
}: AccountsPageProps) {
  const {locale} = await params;
  const {error: errorMessage, message} = await searchParams;

  const safeLocale = locale === "en" ? "en" : "pt";
  const isEnglish = safeLocale === "en";

  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const {data, error} = await supabase
    .from("accounts")
    .select("id, name, institution, type, initial_balance, is_active")
    .eq("user_id", user.id)
    .order("created_at", {ascending: true});

  if (error) {
    console.error("Could not load accounts:", error.message);
  }

  const accounts = (data ?? []) as Account[];

  const totalInitialBalance = accounts.reduce((total, account) => {
    return total + Number(account.initial_balance);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-slate-800 pb-6">
          <Link
            href={`/${safeLocale}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <WalletCards className="h-4 w-4" />
            {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
          </Link>

          <p className="mt-5 text-sm font-medium text-emerald-400">
            {isEnglish ? "Financial structure" : "Estrutura financeira"}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isEnglish ? "Accounts" : "Contas"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Register the accounts, wallets and balances you use to manage your money."
              : "Cadastre as contas, carteiras e saldos que você utiliza para gerenciar seu dinheiro."}
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="h-fit border-slate-800 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-emerald-400" />
                {isEnglish ? "New account" : "Nova conta"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form action={createAccount} className="space-y-4">
                <input type="hidden" name="locale" value={safeLocale} />

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {isEnglish ? "Account name" : "Nome da conta"}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    maxLength={80}
                    placeholder={isEnglish ? "e.g. Nubank account" : "Ex.: Conta Nubank"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">
                    {isEnglish ? "Institution (optional)" : "Instituição (opcional)"}
                  </Label>
                  <Input
                    id="institution"
                    name="institution"
                    maxLength={100}
                    placeholder={isEnglish ? "e.g. Nubank" : "Ex.: Nubank"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    {isEnglish ? "Account type" : "Tipo de conta"}
                  </Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue="checking"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="checking" className="bg-slate-900">
                      {isEnglish ? "Checking account" : "Conta corrente"}
                    </option>
                    <option value="savings" className="bg-slate-900">
                      {isEnglish ? "Savings account" : "Poupança"}
                    </option>
                    <option value="cash" className="bg-slate-900">
                      {isEnglish ? "Cash" : "Dinheiro"}
                    </option>
                    <option value="digital_wallet" className="bg-slate-900">
                      {isEnglish ? "Digital wallet" : "Carteira digital"}
                    </option>
                    <option value="investment" className="bg-slate-900">
                      {isEnglish ? "Investment" : "Investimento"}
                    </option>
                    <option value="other" className="bg-slate-900">
                      {isEnglish ? "Other" : "Outra"}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialBalance">
                    {isEnglish ? "Initial balance" : "Saldo inicial"}
                  </Label>
                  <Input
                    id="initialBalance"
                    name="initialBalance"
                    inputMode="decimal"
                    defaultValue="0,00"
                    placeholder="0,00"
                    required
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    {isEnglish
                      ? "Use a negative value if this account starts with debt."
                      : "Use valor negativo se a conta iniciar com dívida."}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  {isEnglish ? "Create account" : "Criar conta"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/70 text-white">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">
                  {isEnglish ? "Registered initial balance" : "Saldo inicial cadastrado"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={[
                    "text-3xl font-semibold",
                    totalInitialBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                  ].join(" ")}
                >
                  {formatCurrency(totalInitialBalance, safeLocale)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {isEnglish
                    ? "This total will later be combined with transactions to calculate your current balance."
                    : "Esse total será combinado com as transações para calcular seu saldo atual."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {isEnglish ? "Your accounts" : "Suas contas"}
                </CardTitle>

                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {accounts.length}
                </span>
              </CardHeader>

              <CardContent>
                {errorMessage ? (
                  <p className="mb-4 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                    {errorMessage}
                  </p>
                ) : null}

                {message ? (
                  <p className="mb-4 rounded-md border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
                    {message}
                  </p>
                ) : null}

                {accounts.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 p-8 text-center">
                    <Landmark className="h-8 w-8 text-slate-600" />
                    <h2 className="mt-4 text-sm font-medium text-slate-200">
                      {isEnglish ? "No accounts yet" : "Nenhuma conta ainda"}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      {isEnglish
                        ? "Create your first account using the form on the left."
                        : "Crie sua primeira conta usando o formulário ao lado."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <AccountIcon type={account.type} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {account.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {account.institution
                              ? `${accountTypeLabel(account.type, isEnglish)} · ${account.institution}`
                              : accountTypeLabel(account.type, isEnglish)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={[
                              "text-sm font-medium",
                              Number(account.initial_balance) >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            ].join(" ")}
                          >
                            {formatCurrency(
                              Number(account.initial_balance),
                              safeLocale
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {isEnglish ? "Initial balance" : "Saldo inicial"}
                          </p>
                        </div>

                        <form action={deleteAccount}>
                          <input
                            type="hidden"
                            name="locale"
                            value={safeLocale}
                          />
                          <input
                            type="hidden"
                            name="accountId"
                            value={account.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            className="ml-1 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300"
                            aria-label={
                              isEnglish
                                ? `Delete ${account.name}`
                                : `Excluir ${account.name}`
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}