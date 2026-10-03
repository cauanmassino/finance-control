"use client";

import {useState} from "react";
import {createTransaction} from "@/app/[locale]/(app)/transactions/actions";

type CardOption = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
};

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TransactionFormProps = {
  locale: string;
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function TransactionForm({
  locale,
  cards,
  accounts,
  categories,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | "transfer"
  >("expense");
  const [paymentMethod, setPaymentMethod] = useState<"account" | "card">(
    "account",
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);

  const availableCategories =
    transactionType === "transfer"
      ? []
      : categories.filter((category) => category.type === transactionType);

  const isTransfer = transactionType === "transfer";
  const canUseCreditCard = transactionType === "expense";

  function handleTransactionTypeChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextType = event.target.value as "income" | "expense" | "transfer";

    setTransactionType(nextType);

    if (nextType !== "expense") {
      setPaymentMethod("account");
      setIsInstallment(false);
    }
  }

  return (
    <form action={createTransaction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Dados do lançamento
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              Tipo
            </span>

            <select
              name="type"
              value={transactionType}
              onChange={handleTransactionTypeChange}
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              Valor total
            </span>

            <input
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              Descrição
            </span>

            <input
              name="description"
              type="text"
              required
              maxLength={120}
              placeholder="Ex.: Supermercado, salário, aluguel..."
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              Categoria
            </span>

            <select
              name="category_id"
              disabled={isTransfer}
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <option value="">
                {isTransfer ? "Transferência não usa categoria" : "Sem categoria"}
              </option>

              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              Data
            </span>

            <input
              name="date"
              type="date"
              required
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
            />
          </label>
        </div>
      </section>

      {!isTransfer && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Forma de pagamento
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                Método
              </span>

              <select
                name="payment_method"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as "account" | "card",
                  )
                }
                disabled={!canUseCreditCard}
                className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <option value="account">Conta bancária</option>

                {canUseCreditCard && (
                  <option value="card">Cartão de crédito</option>
                )}
              </select>
            </label>

            {paymentMethod === "account" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-300">
                  Conta
                </span>

                <select
                  name="account_id"
                  required
                  className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                >
                  <option value="">Selecione a conta</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {paymentMethod === "card" && canUseCreditCard && (
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-300">
                  Cartão de crédito
                </span>

                <select
                  name="credit_card_id"
                  required
                  className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                >
                  <option value="">Selecione o cartão</option>

                  {cards.map((card) => {
                    const details = [
                      card.institution,
                      card.brand,
                      card.last_four ? `•••• ${card.last_four}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <option key={card.id} value={card.id}>
                        {details ? `${card.name} — ${details}` : card.name}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
          </div>

          <p className="text-xs leading-5 text-slate-400">
            {paymentMethod === "card" && canUseCreditCard
              ? "A compra será vinculada à fatura do cartão. A conta usada no pagamento será a conta vinculada ao cartão, sem permitir divergência."
              : transactionType === "income"
                ? "A receita será creditada diretamente na conta selecionada."
                : "A despesa será debitada diretamente da conta selecionada."}
          </p>
        </section>
      )}

      {isTransfer && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Transferência entre contas
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                Conta de origem
              </span>

              <select
                name="account_id"
                required
                className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
              >
                <option value="">Selecione a conta de origem</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                Conta de destino
              </span>

              <select
                name="transfer_to_account_id"
                required
                className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
              >
                <option value="">Selecione a conta de destino</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Uma transferência reduz o saldo da conta de origem e aumenta o
            saldo da conta de destino. Ela não é receita nem despesa.
          </p>
        </section>
      )}

      {!isTransfer && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Recorrência e parcelamento
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_recurring"
                checked={isRecurring}
                disabled={isInstallment}
                onChange={(event) => setIsRecurring(event.target.checked)}
                className="h-5 w-5 rounded border border-white/20 bg-white/[0.03] text-emerald-300 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
              />

              <span className="text-sm font-medium text-slate-200">
                É recorrente?
              </span>
            </label>

            {isRecurring && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Frequência
                  </span>

                  <select
                    name="frequency"
                    required
                    defaultValue="monthly"
                    className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Data final (opcional)
                  </span>

                  <input
                    name="end_date"
                    type="date"
                    className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                  />
                </label>
              </div>
            )}

            {transactionType === "expense" && (
              <>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_installment"
                    checked={isInstallment}
                    disabled={isRecurring}
                    onChange={(event) =>
                      setIsInstallment(event.target.checked)
                    }
                    className="h-5 w-5 rounded border border-white/20 bg-white/[0.03] text-emerald-300 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
                  />

                  <span className="text-sm font-medium text-slate-200">
                    É parcelado?
                  </span>
                </label>

                {isInstallment && (
                  <label className="flex max-w-xs flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-300">
                      Número de parcelas
                    </span>

                    <input
                      name="installments"
                      type="number"
                      min={2}
                      max={48}
                      required
                      defaultValue={2}
                      className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                    />
                  </label>
                )}
              </>
            )}

            <p className="text-xs leading-5 text-slate-400">
              Uma despesa não pode ser recorrente e parcelada ao mesmo tempo.
              Parcelas serão lançadas em meses consecutivos.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Observações
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">
            Notas (opcional)
          </span>

          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Informações adicionais sobre este lançamento..."
            className="app-input rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
          />
        </label>
      </section>

      <div className="flex items-center justify-end border-t border-white/10 pt-5">
        <button
          type="submit"
          className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:bg-emerald-200"
        >
          Criar lançamento
        </button>
      </div>
    </form>
  );
}