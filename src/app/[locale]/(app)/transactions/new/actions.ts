"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type TransactionType = "income" | "expense";
type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export type TransactionState = {
  error?: string;
  warning?: string;
  requiresNegativeBalanceConfirmation: boolean;
};

function parseAmount(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizePaymentMethod(
  value: FormDataEntryValue | null,
): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const legacyValues: Record<string, string> = {
    debitcard: "debit_card",
    creditcard: "credit_card",
    banktransfer: "bank_transfer",
  };

  const normalized = legacyValues[value] ?? value;

  const allowedPaymentMethods = new Set([
    "pix",
    "debit_card",
    "credit_card",
    "cash",
    "bank_transfer",
    "boleto",
    "other",
  ]);

  return allowedPaymentMethods.has(normalized) ? normalized : null;
}

function isValidDate(value: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addMonthsKeepingDay(dateValue: string, months: number): string {
  const [yearText, monthText, dayText] = dateValue.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();

  const targetDay = Math.min(day, lastDayOfTargetMonth);

  return formatDate(new Date(targetYear, targetMonth, targetDay));
}

function isValidFrequency(value: string | null): value is RecurrenceFrequency {
  return value === "weekly" || value === "monthly" || value === "yearly";
}

function getErrorMessage(locale: string, pt: string, en: string) {
  return locale === "en" ? en : pt;
}

export async function createTransaction(
  _previousState: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const supabase = await createClient();

  const {
    data: {user},
    error: authError,
  } = await supabase.auth.getUser();

  const locale = formData.get("locale") === "en" ? "en" : "pt";

  if (authError || !user) {
    return {
      error: getErrorMessage(
        locale,
        "Você precisa estar autenticado para criar um lançamento.",
        "You must be signed in to create a transaction.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  const typeValue = formData.get("type");
  const type: TransactionType =
    typeValue === "income" ? "income" : "expense";

  const amount = parseAmount(formData.get("amount"));
  const description = toOptionalString(formData.get("description"));
  const occurredOn = toOptionalString(formData.get("date"));
  const accountId = toOptionalString(formData.get("accountid"));
  const categoryId = toOptionalString(formData.get("categoryid"));
  const paymentMethod = normalizePaymentMethod(
    formData.get("paymentmethod"),
  );
  const notes = toOptionalString(formData.get("notes"));

  const isRecurring = formData.get("isrecurring") === "on";

  const installmentsValue = formData.get("installments");
  const installmentsRaw =
    typeof installmentsValue === "string"
      ? Number(installmentsValue)
      : 1;

  const installments = Number.isInteger(installmentsRaw)
    ? installmentsRaw
    : 1;

  const firstInstallmentDate = toOptionalString(
    formData.get("firstinstallmentdate"),
  );

  const frequencyValue = toOptionalString(formData.get("frequency"));
  const endDate = toOptionalString(formData.get("enddate"));

  const confirmNegativeBalance =
    formData.get("confirmnegativebalance") === "true";

  if (!description) {
    return {
      error: getErrorMessage(
        locale,
        "Informe uma descrição para o lançamento.",
        "Enter a description for the transaction.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (!amount) {
    return {
      error: getErrorMessage(
        locale,
        "Informe um valor maior que zero.",
        "Enter an amount greater than zero.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (!isValidDate(occurredOn)) {
    return {
      error: getErrorMessage(
        locale,
        "Informe uma data válida.",
        "Enter a valid date.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (installments < 1 || installments > 12) {
    return {
      error: getErrorMessage(
        locale,
        "O número de parcelas deve estar entre 1 e 12.",
        "The number of installments must be between 1 and 12.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (isRecurring && installments > 1) {
    return {
      error: getErrorMessage(
        locale,
        "Um lançamento não pode ser recorrente e parcelado ao mesmo tempo.",
        "A transaction cannot be recurring and installment-based at the same time.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (installments > 1 && !isValidDate(firstInstallmentDate)) {
    return {
      error: getErrorMessage(
        locale,
        "Informe a data da primeira parcela.",
        "Enter the date of the first installment.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (isRecurring && !isValidFrequency(frequencyValue)) {
    return {
      error: getErrorMessage(
        locale,
        "Selecione uma frequência válida para a recorrência.",
        "Select a valid recurrence frequency.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  if (endDate && !isValidDate(endDate)) {
    return {
      error: getErrorMessage(
        locale,
        "Informe uma data final válida.",
        "Enter a valid end date.",
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  /*
   * A confirmação acontece antes de criar qualquer registro. Se a despesa
   * deixará a conta negativa, o usuário precisa confirmar em um segundo envio.
   */
  if (type === "expense" && accountId && !confirmNegativeBalance) {
    const {data: account, error: accountError} = await supabase
      .from("accounts")
      .select("id, name, initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return {
        error: getErrorMessage(
          locale,
          "Não foi possível validar a conta selecionada.",
          "The selected account could not be validated.",
        ),
        requiresNegativeBalanceConfirmation: false,
      };
    }

    const {data: accountTransactions, error: transactionsError} =
      await supabase
        .from("transactions")
        .select("type, amount, account_id, transfer_account_id")
        .eq("user_id", user.id)
        .or(
          `account_id.eq.${account.id},transfer_account_id.eq.${account.id}`,
        );

    if (transactionsError) {
      return {
        error: getErrorMessage(
          locale,
          "Não foi possível calcular o saldo da conta.",
          "The account balance could not be calculated.",
        ),
        requiresNegativeBalanceConfirmation: false,
      };
    }

    const currentBalance = (accountTransactions ?? []).reduce(
      (total, transaction) => {
        const transactionAmount = Number(transaction.amount);

        if (transaction.type === "income") {
          return transaction.account_id === account.id
            ? total + transactionAmount
            : total;
        }

        if (transaction.type === "expense") {
          return transaction.account_id === account.id
            ? total - transactionAmount
            : total;
        }

        if (transaction.type === "transfer") {
          if (transaction.account_id === account.id) {
            return total - transactionAmount;
          }

          if (transaction.transfer_account_id === account.id) {
            return total + transactionAmount;
          }
        }

        return total;
      },
      Number(account.initial_balance ?? 0),
    );

    const projectedBalance = currentBalance - amount;

    if (projectedBalance < 0) {
      return {
        warning: getErrorMessage(
          locale,
          `Este lançamento deixará a conta "${account.name}" com saldo de ${projectedBalance.toFixed(2)}.`,
          `This transaction will leave "${account.name}" with a balance of ${projectedBalance.toFixed(2)}.`,
        ),
        requiresNegativeBalanceConfirmation: true,
      };
    }
  }

  /*
   * Divide o valor em centavos para que a soma das parcelas seja sempre
   * exatamente igual ao valor total informado.
   */
  const totalInCents = Math.round(amount * 100);
  const baseInstallmentInCents = Math.floor(totalInCents / installments);
  const remainderInCents = totalInCents % installments;

  const transactionsToCreate: Array<{
    user_id: string;
    description: string;
    amount: number;
    type: TransactionType;
    occurred_on: string;
    account_id: string | null;
    category_id: string | null;
    payment_method: string | null;
    notes: string | null;
    recurring_transaction_id?: string;
    installment_number?: number;
    total_installments?: number;
  }> = [];

  if (isRecurring) {
    /*
     * Registra tanto a regra de recorrência como o lançamento atual.
     * Dessa forma, o gasto entra imediatamente no mês escolhido.
     */
    const {data: recurring, error: recurringError} = await supabase
      .from("recurring_transactions")
      .insert({
        user_id: user.id,
        description,
        amount,
        type,
        account_id: accountId,
        category_id: categoryId,
        payment_method: paymentMethod,
        notes,
        frequency: frequencyValue,
        start_date: occurredOn,
        next_occurrence: occurredOn,
        end_date: endDate,
        is_active: true,
      })
      .select("id")
      .single();

    if (recurringError || !recurring) {
      return {
        error: getErrorMessage(
          locale,
          `Não foi possível criar a recorrência: ${recurringError?.message ?? "erro desconhecido"}`,
          `Could not create the recurrence: ${recurringError?.message ?? "unknown error"}`,
        ),
        requiresNegativeBalanceConfirmation: false,
      };
    }

    transactionsToCreate.push({
      user_id: user.id,
      description,
      amount,
      type,
      occurred_on: occurredOn,
      account_id: accountId,
      category_id: categoryId,
      payment_method: paymentMethod,
      notes,
      recurring_transaction_id: recurring.id,
    });
  } else if (installments > 1) {
    const installmentStart = firstInstallmentDate ?? occurredOn;

    for (let index = 0; index < installments; index += 1) {
      const installmentInCents =
        baseInstallmentInCents +
        (index < remainderInCents ? 1 : 0);

      const installmentNumber = index + 1;

      transactionsToCreate.push({
        user_id: user.id,
        description: `${description} (${installmentNumber}/${installments})`,
        amount: installmentInCents / 100,
        type,
        occurred_on: addMonthsKeepingDay(installmentStart, index),
        account_id: accountId,
        category_id: categoryId,
        payment_method: paymentMethod,
        notes:
          notes ??
          getErrorMessage(
            locale,
            `Parcela ${installmentNumber} de ${installments}`,
            `Installment ${installmentNumber} of ${installments}`,
          ),
        installment_number: installmentNumber,
        total_installments: installments,
      });
    }
  } else {
    transactionsToCreate.push({
      user_id: user.id,
      description,
      amount,
      type,
      occurred_on: occurredOn,
      account_id: accountId,
      category_id: categoryId,
      payment_method: paymentMethod,
      notes,
    });
  }

  const {error: insertError} = await supabase
    .from("transactions")
    .insert(transactionsToCreate);

  if (insertError) {
    return {
      error: getErrorMessage(
        locale,
        `Não foi possível salvar o lançamento: ${insertError.message}`,
        `Could not save the transaction: ${insertError.message}`,
      ),
      requiresNegativeBalanceConfirmation: false,
    };
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/recurring`);

  redirect(`/${locale}/transactions`);
}