"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type TransactionType = "income" | "expense";
type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type TransactionState = {
  error?: string;
  warning?: string;
  requiresNegativeBalanceConfirmation?: boolean;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getLocale(value: string) {
  return value === "en" ? "en" : "pt";
}

function getValidAmount(value: string) {
  const rawValue = value.trim();

  if (!rawValue) {
    return null;
  }

  let normalizedValue = rawValue.replace(/\s/g, "");

  const hasComma = normalizedValue.includes(",");
  const hasDot = normalizedValue.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalizedValue.lastIndexOf(",");
    const lastDot = normalizedValue.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Exemplo brasileiro: 1.234,56
      normalizedValue = normalizedValue
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      // Exemplo americano: 1,234.56
      normalizedValue = normalizedValue.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Exemplo brasileiro simples: 5,60
    normalizedValue = normalizedValue.replace(",", ".");
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function isValidType(value: string): value is TransactionType {
  return value === "income" || value === "expense";
}

function isValidFrequency(value: string): value is RecurringFrequency {
  return (
    value === "weekly" ||
    value === "monthly" ||
    value === "yearly"
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function revalidateTransactionPaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transactions/new`);
  revalidatePath(`/${locale}/reports`);
  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/budgets`);
  revalidatePath(`/${locale}/accounts`);
}

async function getAccountBalance({
  supabase,
  userId,
  accountId,
  initialBalance,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  accountId: string;
  initialBalance: number | string | null;
}) {
  const {data: transactions, error} = await supabase
    .from("transactions")
    .select("amount, type, account_id, transfer_account_id")
    .eq("user_id", userId)
    .or(
      `account_id.eq.${accountId},transfer_account_id.eq.${accountId}`,
    );

  if (error) {
    throw error;
  }

  return (transactions ?? []).reduce(
    (total, transaction) => {
      const transactionAmount = Number(transaction.amount);

      if (transaction.type === "income") {
        return transaction.account_id === accountId
          ? total + transactionAmount
          : total;
      }

      if (transaction.type === "expense") {
        return transaction.account_id === accountId
          ? total - transactionAmount
          : total;
      }

      if (transaction.type === "transfer") {
        if (transaction.account_id === accountId) {
          return total - transactionAmount;
        }

        if (transaction.transfer_account_id === accountId) {
          return total + transactionAmount;
        }
      }

      return total;
    },
    Number(initialBalance ?? 0),
  );
}

export async function createTransaction(
  _previousState: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const receivedLocale = getText(formData, "locale");
  const locale = getLocale(receivedLocale);

  const description = getText(formData, "description");
  const amount = getValidAmount(getText(formData, "amount"));
  const type = getText(formData, "type");
  const occurredOn = getText(formData, "date");
  const accountId = getText(formData, "account_id") || null;
  const categoryId = getText(formData, "category_id") || null;
  const paymentMethod = getText(formData, "payment_method") || null;
  const notes = getText(formData, "notes") || null;

  const isRecurring = formData.get("is_recurring") === "on";
  const frequency = getText(formData, "frequency") || null;
  const endDate = getText(formData, "end_date") || null;

  const confirmedNegativeBalance =
    formData.get("confirm_negative_balance") === "true";

  if (!description) {
    return {
      error:
        locale === "en"
          ? "Enter a description."
          : "Informe uma descrição.",
    };
  }

  if (description.length > 120) {
    return {
      error:
        locale === "en"
          ? "The description can have up to 120 characters."
          : "A descrição deve ter no máximo 120 caracteres.",
    };
  }

  if (!amount) {
    return {
      error:
        locale === "en"
          ? "Enter an amount greater than zero."
          : "Informe um valor maior que zero.",
    };
  }

  if (!isValidType(type)) {
    return {
      error:
        locale === "en"
          ? "Invalid transaction type."
          : "Tipo de transação inválido.",
    };
  }

  if (!isValidDate(occurredOn)) {
    return {
      error:
        locale === "en"
          ? "Enter a valid date."
          : "Informe uma data válida.",
    };
  }

  if (notes && notes.length > 500) {
    return {
      error:
        locale === "en"
          ? "The note can have up to 500 characters."
          : "A observação deve ter no máximo 500 caracteres.",
    };
  }

  if (isRecurring) {
    if (!frequency || !isValidFrequency(frequency)) {
      return {
        error:
          locale === "en"
            ? "Choose a valid frequency for the recurring item."
            : "Escolha uma frequência válida para a recorrência.",
      };
    }

    if (endDate && !isValidDate(endDate)) {
      return {
        error:
          locale === "en"
            ? "Enter a valid end date for the recurring item."
            : "Informe uma data final válida para a recorrência.",
      };
    }

    if (endDate && endDate < occurredOn) {
      return {
        error:
          locale === "en"
            ? "The end date cannot be before the transaction date."
            : "A data final da recorrência não pode ser anterior à data do lançamento.",
      };
    }
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  let selectedAccount: {
    id: string;
    name: string;
    initial_balance: number | string | null;
  } | null = null;

  if (accountId) {
    const {data: account, error: accountError} = await supabase
      .from("accounts")
      .select("id, name, initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError || !account) {
      return {
        error:
          locale === "en"
            ? "The selected account is invalid."
            : "A conta selecionada não é válida.",
      };
    }

    selectedAccount = account;
  }

  if (categoryId) {
    const {data: category, error: categoryError} = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (categoryError || !category) {
      return {
        error:
          locale === "en"
            ? "The selected category is invalid."
            : "A categoria selecionada não é válida.",
      };
    }

    if (category.type !== type) {
      return {
        error:
          locale === "en"
            ? "Choose a category with the same type as the transaction."
            : "Escolha uma categoria do mesmo tipo da transação.",
      };
    }
  }

  if (type === "expense" && selectedAccount) {
    try {
      const currentBalance = await getAccountBalance({
        supabase,
        userId: user.id,
        accountId: selectedAccount.id,
        initialBalance: selectedAccount.initial_balance,
      });

      const projectedBalance = currentBalance - amount;

      if (projectedBalance < 0 && !confirmedNegativeBalance) {
        const accountName = selectedAccount.name;
        const currentBalanceText = formatCurrency(currentBalance, locale);
        const projectedBalanceText = formatCurrency(
          projectedBalance,
          locale,
        );

        return {
          warning:
            locale === "en"
              ? `This expense will make the "${accountName}" account negative. Current balance: ${currentBalanceText}. Projected balance: ${projectedBalanceText}.`
              : `Esta despesa deixará a conta "${accountName}" negativa. Saldo atual: ${currentBalanceText}. Saldo após o lançamento: ${projectedBalanceText}.`,
          requiresNegativeBalanceConfirmation: true,
        };
      }
    } catch (balanceError) {
      console.error("Erro ao calcular saldo da conta:", balanceError);

      return {
        error:
          locale === "en"
            ? "Could not validate the account balance."
            : "Não foi possível validar o saldo da conta.",
      };
    }
  }

  let recurringTransactionId: string | null = null;

  if (isRecurring) {
    const {data: recurringTransaction, error: recurringError} =
      await supabase
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
          frequency,
          start_date: occurredOn,
          next_occurrence: occurredOn,
          end_date: endDate,
          is_active: true,
        })
        .select("id")
        .single();

    if (recurringError || !recurringTransaction) {
      console.error("Erro detalhado ao criar recorrência:", {
        code: recurringError?.code,
        message: recurringError?.message,
        details: recurringError?.details,
        hint: recurringError?.hint,
      });

      return {
        error:
          locale === "en"
            ? "Could not create the recurring item."
            : "Não foi possível criar a recorrência.",
      };
    }

    recurringTransactionId = recurringTransaction.id;
  }

  const {error: transactionError} = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description,
      amount,
      type,
      occurred_on: occurredOn,
      account_id: accountId,
      category_id: categoryId,
      payment_method: paymentMethod,
      notes,
      recurring_transaction_id: recurringTransactionId,
    });

  if (transactionError) {
    console.error("Erro detalhado ao criar transação:", {
      code: transactionError.code,
      message: transactionError.message,
      details: transactionError.details,
      hint: transactionError.hint,
    });

    return {
      error:
        locale === "en"
          ? "Could not create the transaction."
          : "Não foi possível criar o lançamento.",
    };
  }

  revalidateTransactionPaths(locale);

  redirect(`/${locale}/transactions`);
}