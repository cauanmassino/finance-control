import Link from "next/link";
import {redirect} from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  Layers3,
  ReceiptText,
  Save,
  WalletCards
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/server";

import {createInstallmentPurchase} from "../../installment-actions";

type NewInstallmentPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type Account = {
  id: string;
  name: string;
  institution: string | null;
};

type CreditCard = {
  id: string;
  name: string;
  institution: string | null;
  last_four: string | null;
};

function getLocalDateValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

export default async function NewInstallmentPage({
  params,
  searchParams
}: NewInstallmentPageProps) {
  const {locale} = await params;
  const {error: errorMessage} = await searchParams;

  const safeLocale = locale === "en" ? "en" : "pt";
  const isEnglish = safeLocale === "en";

  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const [categoriesResult, accountsResult, cardsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, color")
      .eq("user_id", user.id)
      .eq("kind", "expense")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("accounts")
      .select("id, name, institution")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("credit_cards")
      .select("id, name, institution, last_four")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name")
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  const accounts = (accountsResult.data ?? []) as Account[];
  const cards = (cardsResult.data ?? []) as CreditCard[];

  const today = getLocalDateValue();

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-800 pb-6">
          <Link
            href={`/${safeLocale}/transactions`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <WalletCards className="h-4 w-4" />
            {isEnglish ? "Back to transactions" : "Voltar para transações"}
          </Link>

          <p className="mt-5 text-sm font-medium text-emerald-400">
            {isEnglish ? "Future commitments" : "Compromissos futuros"}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isEnglish ? "Installment purchase" : "Compra parcelada"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Register the total purchase once and automatically project every future installment."
              : "Registre o valor total uma vez e projete automaticamente todas as parcelas futuras."}
          </p>
        </header>

        <Card className="mt-8 border-slate-800 bg-slate-900/70 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-emerald-400" />
              {isEnglish ? "Installment details" : "Detalhes do parcelamento"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {errorMessage ? (
              <p className="mb-5 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                {errorMessage}
              </p>
            ) : null}

            <form action={createInstallmentPurchase} className="space-y-5">
              <input type="hidden" name="locale" value={safeLocale} />

              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {isEnglish ? "Purchase description" : "Descrição da compra"}
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    maxLength={180}
                    placeholder={isEnglish ? "e.g. New laptop" : "Ex.: Notebook novo"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">
                    {isEnglish ? "Total amount" : "Valor total"}
                  </Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="installmentsCount">
                    {isEnglish ? "Number of installments" : "Número de parcelas"}
                  </Label>
                  <Input
                    id="installmentsCount"
                    name="installmentsCount"
                    type="number"
                    min="2"
                    max="48"
                    defaultValue="2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstDueDate">
                    {isEnglish ? "First installment date" : "Data da primeira parcela"}
                  </Label>
                  <Input
                    id="firstDueDate"
                    name="firstDueDate"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-medium">
                    {isEnglish ? "Payment source" : "Origem do pagamento"}
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {isEnglish
                    ? "Choose exactly one credit card or account. For purchases on credit, choose the card."
                    : "Escolha exatamente um cartão ou uma conta. Para compras no crédito, escolha o cartão."}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="creditCardId">
                      {isEnglish ? "Credit card" : "Cartão de crédito"}
                    </Label>
                    <select
                      id="creditCardId"
                      name="creditCardId"
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="" className="bg-slate-900">
                        {isEnglish ? "Do not use a card" : "Não usar cartão"}
                      </option>
                      {cards.map((card) => (
                        <option
                          key={card.id}
                          value={card.id}
                          className="bg-slate-900"
                        >
                          {card.name}
                          {card.last_four ? ` · •••• ${card.last_four}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountId">
                      {isEnglish ? "Account" : "Conta"}
                    </Label>
                    <select
                      id="accountId"
                      name="accountId"
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="" className="bg-slate-900">
                        {isEnglish ? "Do not use an account" : "Não usar conta"}
                      </option>
                      {accounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                          className="bg-slate-900"
                        >
                          {account.name}
                          {account.institution
                            ? ` · ${account.institution}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">
                  {isEnglish ? "Expense category" : "Categoria de despesa"}
                </Label>

                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue=""
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  required
                >
                  <option value="" className="bg-slate-900">
                    {isEnglish ? "Select a category" : "Selecione uma categoria"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-slate-900"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {isEnglish ? "Notes (optional)" : "Observações (opcional)"}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  maxLength={1000}
                  rows={3}
                  placeholder={
                    isEnglish
                      ? "Add information about this purchase."
                      : "Adicione informações sobre esta compra."
                  }
                  className="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="leading-6">
                    {isEnglish
                      ? "The system will create all future installments in one atomic operation. If any record cannot be created, no installment will be saved."
                      : "O sistema criará todas as parcelas futuras em uma operação atômica. Se qualquer registro não puder ser criado, nenhuma parcela será salva."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/${safeLocale}/transactions`}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
                >
                  {isEnglish ? "Cancel" : "Cancelar"}
                </Link>

                <Button
                  type="submit"
                  className="gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  <Save className="h-4 w-4" />
                  {isEnglish
                    ? "Create installment purchase"
                    : "Criar compra parcelada"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="leading-6">
              {isEnglish
                ? "For credit card purchases, the installment dates are what will later compose each monthly invoice."
                : "Para compras no cartão, as datas das parcelas serão usadas futuramente para compor cada fatura mensal."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}