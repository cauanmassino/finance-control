"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type TransactionType = "income" | "expense";

export type EditTransactionState = {
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
      // Formato brasileiro: 1.234,56
      normalizedValue = normalizedValue
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      // Formato americano: 1,234.56
      normalizedValue = normalizedValue.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Formato brasileiro simples: 5,60
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

function revalidateTransactionPaths(locale: string, transactionId: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transactions/${transactionId}/edit`);
  revalidatePath(`/${locale}/reports`);
  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/budgets`);
  revalidatePath(`/${locale}/recurring`);
}

async function getAccountBalanceWithoutTransaction({
  supabase,
  userId,
  accountId,
  initialBalance,
  transactionId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  accountId: string;
  initialBalance: number | string | null;
  transactionId: string;
}) {
  const {data: transactions, error} = await supabase
    .from("transactions")
    .select("id, amount, type, account_id, transfer_account_id")
    .eq("user_id", userId)
    .neq("id", transactionId)
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

export async function updateTransaction(
  _previousState: EditTransactionState,
  formData: FormData,
): Promise<EditTransactionState> {
  const receivedLocale = getText(formData, "locale");
  const locale = getLocale(receivedLocale);

  const transactionId = getText(formData, "transaction_id");
  const description = getText(formData, "description");
  const amount = getValidAmount(getText(formData, "amount"));
  const type = getText(formData, "type");
  const occurredOn = getText(formData, "occurred_on");
  const accountId = getText(formData, "account_id") || null;
  const categoryId = getText(formData, "category_id") || null;
  const paymentMethod = getText(formData, "payment_method") || null;
  const notes = getText(formData, "notes") || null;

  const confirmedNegativeBalance =
    formData.get("confirm_negative_balance") === "true";

  if (!transactionId) {
    return {
      error:
        locale === "en"
          ? "Invalid transaction data."
          : "Dados do lançamento inválidos.",
    };
  }

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
          : "Tipo de lançamento inválido.",
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

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: transaction, error: transactionError} = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (transactionError || !transaction) {
    return {
      error:
        locale === "en"
          ? "Transaction not found."
          : "Lançamento não encontrado.",
    };
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
            : "Escolha uma categoria do mesmo tipo do lançamento.",
      };
    }
  }

  if (type === "expense" && selectedAccount) {
    try {
      const balanceWithoutCurrentTransaction =
        await getAccountBalanceWithoutTransaction({
          supabase,
          userId: user.id,
          accountId: selectedAccount.id,
          initialBalance: selectedAccount.initial_balance,
          transactionId,
        });

      const projectedBalance = balanceWithoutCurrentTransaction - amount;

      if (projectedBalance < 0 && !confirmedNegativeBalance) {
        const currentBalanceText = formatCurrency(
          balanceWithoutCurrentTransaction,
          locale,
        );

        const projectedBalanceText = formatCurrency(
          projectedBalance,
          locale,
        );

        return {
          warning:
            locale === "en"
              ? `This update will make the "${selectedAccount.name}" account negative. Balance without this transaction: ${currentBalanceText}. Projected balance: ${projectedBalanceText}.`
              : `Esta alteração deixará a conta "${selectedAccount.name}" negativa. Saldo sem este lançamento: ${currentBalanceText}. Saldo após a alteração: ${projectedBalanceText}.`,
          requiresNegativeBalanceConfirmation: true,
        };
      }
    } catch (balanceError) {
      console.error(
        "Erro ao calcular saldo da conta durante edição:",
        balanceError,
      );

      return {
        error:
          locale === "en"
            ? "Could not validate the account balance."
            : "Não foi possível validar o saldo da conta.",
      };
    }
  }

  const {error: updateError} = await supabase
    .from("transactions")
    .update({
      description,
      amount,
      type,
      occurred_on: occurredOn,
      account_id: accountId,
      category_id: categoryId,
      payment_method: paymentMethod,
      notes,
    })
    .eq("id", transaction.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Erro detalhado ao atualizar lançamento:", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });

    return {
      error:
        locale === "en"
          ? "Could not update the transaction."
          : "Não foi possível atualizar o lançamento.",
    };
  }

  revalidateTransactionPaths(locale, transactionId);

  redirect(`/${locale}/transactions`);
}