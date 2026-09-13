import Link from "next/link";
import {redirect} from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Landmark,
  Save,
  WalletCards
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/server";

import {createTransaction} from "../actions";

type NewTransactionPageProps = {
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
  kind: "income" | "expense" | "transfer";
  color: string;
};

type Account = {
  id: string;
  name: string;
  institution: string | null;
  type: string;
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

export default async function NewTransactionPage({
  params,
  searchParams
}: NewTransactionPageProps) {
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
      .select("id, name, kind, color")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("accounts")
      .select("id, name, institution, type")
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

  const incomeCategories = categories.filter(
    (category) => category.kind === "income"
  );

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense"
  );

  const today = getLocalDateValue();

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-800 pb-6">
          <Link
            href={`/${safeLocale}/transactions`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEnglish ? "Back to transactions" : "Voltar para transações"}
          </Link>

          <p className="mt-5 text-sm font-medium text-emerald-400">
            {isEnglish ? "Financial record" : "Registro financeiro"}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isEnglish ? "New transaction" : "Nova transação"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Register income, expenses, or transfers. Amounts must always be positive."
              : "Registre receitas, despesas ou transferências. Os valores devem ser sempre positivos."}
          </p>
        </header>

        <Card className="mt-8 border-slate-800 bg-slate-900/70 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Save className="h-4 w-4 text-emerald-400" />
              {isEnglish ? "Transaction details" : "Detalhes da transação"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {errorMessage ? (
              <p className="mb-5 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                {errorMessage}
              </p>
            ) : null}

            <form action={createTransaction} className="space-y-5">
              <input type="hidden" name="locale" value={safeLocale} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="kind"
                    value="expense"
                    defaultChecked
                  />
                  <span className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-400 transition-colors peer-checked:border-rose-500/60 peer-checked:bg-rose-500/10 peer-checked:text-rose-300">
                    <ArrowDownRight className="h-4 w-4" />
                    {isEnglish ? "Expense" : "Despesa"}
                  </span>
                </label>

                <label className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="kind"
                    value="income"
                  />
                  <span className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-400 transition-colors peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300">
                    <ArrowUpRight className="h-4 w-4" />
                    {isEnglish ? "Income" : "Receita"}
                  </span>
                </label>

                <label className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="kind"
                    value="transfer"
                  />
                  <span className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-400 transition-colors peer-checked:border-sky-500/60 peer-checked:bg-sky-500/10 peer-checked:text-sky-300">
                    <ArrowLeftRight className="h-4 w-4" />
                    {isEnglish ? "Transfer" : "Transferência"}
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {isEnglish ? "Description" : "Descrição"}
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    maxLength={180}
                    placeholder={isEnglish ? "e.g. Grocery shopping" : "Ex.: Compras do mercado"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {isEnglish ? "Amount" : "Valor"}
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="occurredOn">
                    {isEnglish ? "Date" : "Data"}
                  </Label>
                  <Input
                    id="occurredOn"
                    name="occurredOn"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    {isEnglish ? "Status" : "Status"}
                  </Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="paid"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="paid" className="bg-slate-900">
                      {isEnglish ? "Paid" : "Pago"}
                    </option>
                    <option value="pending" className="bg-slate-900">
                      {isEnglish ? "Pending" : "Pendente"}
                    </option>
                    <option value="scheduled" className="bg-slate-900">
                      {isEnglish ? "Scheduled" : "Agendado"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-medium">
                    {isEnglish ? "Financial source" : "Origem financeira"}
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {isEnglish
                    ? "For income and expenses, select exactly one account or credit card. For transfers, choose origin and destination accounts."
                    : "Para receitas e despesas, selecione exatamente uma conta ou cartão. Para transferências, escolha conta de origem e destino."}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountId">
                      {isEnglish ? "Account / origin account" : "Conta / conta de origem"}
                    </Label>
                    <select
                      id="accountId"
                      name="accountId"
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="" className="bg-slate-900">
                        {isEnglish ? "Select an account" : "Selecione uma conta"}
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

                  <div className="space-y-2">
                    <Label htmlFor="creditCardId">
                      {isEnglish ? "Credit card (optional)" : "Cartão de crédito (opcional)"}
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
                    <Label htmlFor="destinationAccountId">
                      {isEnglish ? "Destination account (transfer)" : "Conta de destino (transferência)"}
                    </Label>
                    <select
                      id="destinationAccountId"
                      name="destinationAccountId"
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="" className="bg-slate-900">
                        {isEnglish ? "Select destination" : "Selecione o destino"}
                      </option>
                      {accounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                          className="bg-slate-900"
                        >
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">
                      {isEnglish ? "Payment method" : "Meio de pagamento"}
                    </Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      defaultValue="pix"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="pix" className="bg-slate-900">
                        Pix
                      </option>
                      <option value="cash" className="bg-slate-900">
                        {isEnglish ? "Cash" : "Dinheiro"}
                      </option>
                      <option value="debit_card" className="bg-slate-900">
                        {isEnglish ? "Debit card" : "Cartão de débito"}
                      </option>
                      <option value="credit_card" className="bg-slate-900">
                        {isEnglish ? "Credit card" : "Cartão de crédito"}
                      </option>
                      <option value="bank_transfer" className="bg-slate-900">
                        {isEnglish ? "Bank transfer" : "Transferência bancária"}
                      </option>
                      <option value="other" className="bg-slate-900">
                        {isEnglish ? "Other" : "Outro"}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2">
                  <WalletCards className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-medium">
                    {isEnglish ? "Classification" : "Classificação"}
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {isEnglish
                    ? "Choose an income or expense category. Transfers do not need a category."
                    : "Escolha uma categoria de receita ou despesa. Transferências não precisam de categoria."}
                </p>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="categoryId">
                    {isEnglish ? "Category" : "Categoria"}
                  </Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    defaultValue=""
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="" className="bg-slate-900">
                      {isEnglish ? "Select a category" : "Selecione uma categoria"}
                    </option>

                    {incomeCategories.length > 0 ? (
                      <optgroup
                        label={isEnglish ? "Income" : "Receitas"}
                        className="bg-slate-900"
                      >
                        {incomeCategories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                            className="bg-slate-900"
                          >
                            {category.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}

                    {expenseCategories.length > 0 ? (
                      <optgroup
                        label={isEnglish ? "Expenses" : "Despesas"}
                        className="bg-slate-900"
                      >
                        {expenseCategories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                            className="bg-slate-900"
                          >
                            {category.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                </div>
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
                      ? "Add details that will help you remember this transaction."
                      : "Adicione detalhes que ajudem você a lembrar desta transação."
                  }
                  className="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
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
                  {isEnglish ? "Save transaction" : "Salvar transação"}
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
                ? "Installment purchases will have a dedicated flow to ensure all future installments are created consistently."
                : "Compras parceladas terão um fluxo dedicado para garantir que todas as parcelas futuras sejam criadas de forma consistente."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}