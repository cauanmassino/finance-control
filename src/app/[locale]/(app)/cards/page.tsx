import Link from "next/link";
import {redirect} from "next/navigation";
import {
  CalendarClock,
  CreditCard,
  Landmark,
  ShieldCheck,
  Trash2,
  WalletCards
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/server";

import {createCard, deleteCard} from "./actions";

type CardsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type CreditCard = {
  id: string;
  name: string;
  institution: string | null;
  brand:
    | "visa"
    | "mastercard"
    | "amex"
    | "elo"
    | "hipercard"
    | "other"
    | null;
  last_four: string | null;
  credit_limit: number | string | null;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
};

function formatCurrency(value: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function cardBrandLabel(
  brand: CreditCard["brand"],
  isEnglish: boolean
) {
  if (!brand) {
    return isEnglish ? "Card" : "Cartão";
  }

  const labels = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    elo: "Elo",
    hipercard: "Hipercard",
    other: isEnglish ? "Other" : "Outra"
  };

  return labels[brand];
}

export default async function CardsPage({
  params,
  searchParams
}: CardsPageProps) {
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
    .from("credit_cards")
    .select(
      "id, name, institution, brand, last_four, credit_limit, closing_day, due_day, color, is_active"
    )
    .eq("user_id", user.id)
    .order("created_at", {ascending: true});

  if (error) {
    console.error("Could not load cards:", error.message);
  }

  const cards = (data ?? []) as CreditCard[];

  const totalCreditLimit = cards.reduce((total, card) => {
    return total + Number(card.credit_limit ?? 0);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-800 pb-6">
          <Link
            href={`/${safeLocale}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <WalletCards className="h-4 w-4" />
            {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
          </Link>

          <p className="mt-5 text-sm font-medium text-emerald-400">
            {isEnglish ? "Credit management" : "Gestão de crédito"}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isEnglish ? "Credit cards" : "Cartões de crédito"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Register card limits, closing dates and due dates to prepare for invoices and installments."
              : "Cadastre limites, fechamento e vencimento para preparar o controle de faturas e parcelas."}
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[370px_1fr]">
          <Card className="h-fit border-slate-800 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                {isEnglish ? "New credit card" : "Novo cartão"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form action={createCard} className="space-y-4">
                <input type="hidden" name="locale" value={safeLocale} />

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {isEnglish ? "Card name" : "Nome do cartão"}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    maxLength={80}
                    placeholder={isEnglish ? "e.g. Nubank Platinum" : "Ex.: Nubank Platinum"}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">
                      {isEnglish ? "Brand" : "Bandeira"}
                    </Label>
                    <select
                      id="brand"
                      name="brand"
                      defaultValue="visa"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="visa" className="bg-slate-900">Visa</option>
                      <option value="mastercard" className="bg-slate-900">Mastercard</option>
                      <option value="elo" className="bg-slate-900">Elo</option>
                      <option value="amex" className="bg-slate-900">Amex</option>
                      <option value="hipercard" className="bg-slate-900">Hipercard</option>
                      <option value="other" className="bg-slate-900">
                        {isEnglish ? "Other" : "Outra"}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastFour">
                      {isEnglish ? "Last 4 digits" : "Últimos 4 dígitos"}
                    </Label>
                    <Input
                      id="lastFour"
                      name="lastFour"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      maxLength={4}
                      placeholder="1234"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditLimit">
                    {isEnglish ? "Credit limit" : "Limite de crédito"}
                  </Label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    inputMode="decimal"
                    defaultValue="0,00"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="closingDay">
                      {isEnglish ? "Closing day" : "Dia de fechamento"}
                    </Label>
                    <Input
                      id="closingDay"
                      name="closingDay"
                      type="number"
                      min="1"
                      max="31"
                      defaultValue="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDay">
                      {isEnglish ? "Due day" : "Dia de vencimento"}
                    </Label>
                    <Input
                      id="dueDay"
                      name="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      defaultValue="10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">
                    {isEnglish ? "Card color" : "Cor do cartão"}
                  </Label>

                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue="#10B981"
                      className="h-10 w-16 cursor-pointer p-1"
                    />
                    <p className="text-xs leading-5 text-slate-400">
                      {isEnglish
                        ? "This color will identify the card in invoices and reports."
                        : "Esta cor identificará o cartão em faturas e relatórios."}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  {isEnglish ? "Create card" : "Criar cartão"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/70 text-white">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">
                  {isEnglish ? "Total registered credit limit" : "Limite total cadastrado"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-400">
                  {formatCurrency(totalCreditLimit, safeLocale)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {isEnglish
                    ? "The available amount and committed amount will appear here after transactions are implemented."
                    : "O valor disponível e o comprometimento aparecerão aqui depois que as transações forem implementadas."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {isEnglish ? "Your cards" : "Seus cartões"}
                </CardTitle>

                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {cards.length}
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

                {cards.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 p-8 text-center">
                    <CreditCard className="h-8 w-8 text-slate-600" />
                    <h2 className="mt-4 text-sm font-medium text-slate-200">
                      {isEnglish ? "No cards yet" : "Nenhum cartão ainda"}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      {isEnglish
                        ? "Create your first credit card using the form on the left."
                        : "Crie seu primeiro cartão usando o formulário ao lado."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{backgroundColor: card.color}}
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
                            <CreditCard className="h-5 w-5" />
                          </div>

                          <form action={deleteCard}>
                            <input
                              type="hidden"
                              name="locale"
                              value={safeLocale}
                            />
                            <input
                              type="hidden"
                              name="cardId"
                              value={card.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              className="h-8 w-8 px-0 text-slate-500 hover:bg-rose-950/50 hover:text-rose-300"
                              aria-label={
                                isEnglish
                                  ? `Delete ${card.name}`
                                  : `Excluir ${card.name}`
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>

                        <div className="mt-7">
                          <p className="text-lg font-semibold text-white">
                            {card.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {card.institution ?? cardBrandLabel(card.brand, isEnglish)}
                          </p>

                          <p className="mt-6 font-mono text-base tracking-[0.2em] text-slate-300">
                            •••• {card.last_four ?? "----"}
                          </p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              {isEnglish ? "Credit limit" : "Limite"}
                            </p>
                            <p className="mt-1 text-sm font-medium text-emerald-400">
                              {formatCurrency(Number(card.credit_limit ?? 0), safeLocale)}
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            <div>
                              <p className="text-xs text-slate-500">
                                {isEnglish ? "Invoice cycle" : "Ciclo da fatura"}
                              </p>
                              <p className="mt-1 text-xs text-slate-300">
                                {isEnglish
                                  ? `Closes day ${card.closing_day} · Due day ${card.due_day}`
                                  : `Fecha dia ${card.closing_day} · Vence dia ${card.due_day}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          {isEnglish
                            ? "Only the last 4 digits are stored."
                            : "Apenas os últimos 4 dígitos são armazenados."}
                        </div>
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