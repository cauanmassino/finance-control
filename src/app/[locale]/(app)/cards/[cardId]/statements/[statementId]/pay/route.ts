import {NextRequest, NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

type Locale = "pt" | "en";

function getLocaleFromPathname(pathname: string): Locale {
  return pathname.startsWith("/en") ? "en" : "pt";
}

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getAccountBalance(
  initialBalance: number | string | null,
  transactions: Array<{
    amount: number | string;
    type: "income" | "expense" | "transfer";
    account_id: string | null;
    transfer_account_id: string | null;
  }>,
  accountId: string,
) {
  return transactions.reduce(
    (total, transaction) => {
      const amount = Number(transaction.amount);

      if (transaction.type === "income") {
        return transaction.account_id === accountId
          ? total + amount
          : total;
      }

      if (transaction.type === "expense") {
        return transaction.account_id === accountId
          ? total - amount
          : total;
      }

      if (transaction.type === "transfer") {
        if (transaction.account_id === accountId) {
          return total - amount;
        }

        if (transaction.transfer_account_id === accountId) {
          return total + amount;
        }
      }

      return total;
    },
    Number(initialBalance ?? 0),
  );
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromPathname(request.nextUrl.pathname);
  const supabase = await createClient();

  const {
    data: {user},
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login`, request.url),
      303,
    );
  }

  const formData = await request.formData();

  const accountId = getText(formData, "account_id");

  const pathSegments = request.nextUrl.pathname.split("/");
  const paySegmentIndex = pathSegments.lastIndexOf("pay");
  const statementId = pathSegments[paySegmentIndex - 1] ?? "";
  const cardIdFromPath = pathSegments[paySegmentIndex - 3] ?? "";

  const statementBasePath =
    `/${locale}/cards/${cardIdFromPath}/statements/${statementId}`;

  const redirectWithMessage = (
    key: "message" | "error",
    value: string,
  ) =>
    NextResponse.redirect(
      new URL(
        `${statementBasePath}?${key}=${encodeURIComponent(value)}`,
        request.url,
      ),
      303,
    );

  if (!accountId) {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Choose the account that will pay the statement."
        : "Selecione a conta que pagará a fatura.",
    );
  }

  const {data: statement, error: statementError} = await supabase
    .from("credit_card_statements")
    .select(`
      id,
      credit_card_id,
      total_amount,
      paid_amount,
      status
    `)
    .eq("id", statementId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (statementError || !statement) {
    console.error("Erro ao buscar fatura para pagamento:", statementError);

    return redirectWithMessage(
      "error",
      locale === "en" ? "Statement not found." : "Fatura não encontrada.",
    );
  }

  if (statement.credit_card_id !== cardIdFromPath) {
    return redirectWithMessage(
      "error",
      locale === "en" ? "Invalid statement." : "Fatura inválida.",
    );
  }

  const totalAmount = Number(statement.total_amount ?? 0);
  const paidAmount = Number(statement.paid_amount ?? 0);
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

  if (outstandingAmount <= 0 || statement.status === "paid") {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "This statement has already been paid."
        : "Esta fatura já foi paga.",
    );
  }

  const {data: account, error: accountError} = await supabase
    .from("accounts")
    .select("id, name, initial_balance")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountError || !account) {
    console.error("Erro ao buscar conta de pagamento:", accountError);

    return redirectWithMessage(
      "error",
      locale === "en"
        ? "The selected account is invalid."
        : "A conta selecionada não é válida.",
    );
  }

  /*
   * O pagamento da fatura precisa debitar dinheiro real da conta.
   * Portanto, respeita a regra de não permitir saldo negativo.
   */
  const {data: accountTransactions, error: accountTransactionsError} =
    await supabase
      .from("transactions")
      .select("amount, type, account_id, transfer_account_id")
      .eq("user_id", user.id)
      .or(
        `account_id.eq.${account.id},transfer_account_id.eq.${account.id}`,
      );

  if (accountTransactionsError) {
    console.error(
      "Erro ao calcular saldo da conta de pagamento:",
      accountTransactionsError,
    );

    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Could not check the account balance."
        : "Não foi possível verificar o saldo da conta.",
    );
  }

  const currentBalance = getAccountBalance(
    account.initial_balance,
    (accountTransactions ?? []) as Array<{
      amount: number | string;
      type: "income" | "expense" | "transfer";
      account_id: string | null;
      transfer_account_id: string | null;
    }>,
    account.id,
  );

  const projectedBalance = currentBalance - outstandingAmount;

  if (projectedBalance < 0) {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? `The "${account.name}" account does not have enough balance to pay this statement. Current balance: ${formatCurrency(currentBalance, locale)}. Payment amount: ${formatCurrency(outstandingAmount, locale)}.`
        : `A conta "${account.name}" não possui saldo suficiente para pagar esta fatura. Saldo atual: ${formatCurrency(currentBalance, locale)}. Valor do pagamento: ${formatCurrency(outstandingAmount, locale)}.`,
    );
  }

  const paymentDate = new Date().toISOString().slice(0, 10);

  /*
   * A compra no cartão já foi registrada como despesa.
   *
   * Por isso o pagamento NÃO deve ser uma nova despesa categorizada:
   * ele apenas registra a saída da conta como transferência técnica
   * vinculada à fatura, evitando que relatórios dupliquem a despesa.
   *
   * transfer_account_id recebe a própria conta para compatibilidade
   * com o CHECK existente de transferências; o cálculo de saldo abaixo
   * evita duplicidade porque operações de mesmo ID são tratadas
   * apenas como saída na conta de origem.
   */
  const {error: paymentTransactionError} = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description:
        locale === "en"
          ? "Credit card statement payment"
          : "Pagamento de fatura do cartão",
      amount: outstandingAmount,
      type: "transfer",
      occurred_on: paymentDate,
      account_id: account.id,
      transfer_account_id: account.id,
      category_id: null,
      payment_method: "transfer",
      notes:
        locale === "en"
          ? `Payment for statement ${statement.id}`
          : `Pagamento da fatura ${statement.id}`,
      credit_card_id: statement.credit_card_id,
      credit_card_statement_id: statement.id,
    });

  if (paymentTransactionError) {
    console.error(
      "Erro ao criar transação de pagamento da fatura:",
      {
        code: paymentTransactionError.code,
        message: paymentTransactionError.message,
        details: paymentTransactionError.details,
        hint: paymentTransactionError.hint,
      },
    );

    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Could not register the statement payment."
        : "Não foi possível registrar o pagamento da fatura.",
    );
  }

  const newPaidAmount = paidAmount + outstandingAmount;

  const {error: statementUpdateError} = await supabase
    .from("credit_card_statements")
    .update({
      paid_amount: newPaidAmount,
      status: "paid",
    })
    .eq("id", statement.id)
    .eq("user_id", user.id);

  if (statementUpdateError) {
    console.error(
      "Erro ao atualizar pagamento da fatura:",
      statementUpdateError,
    );

    /*
     * A transação já foi inserida. Em produção, o ideal seria uma RPC
     * transacional no banco. Aqui retornamos um erro explícito para que
     * você não tente pagar novamente sem checar os lançamentos.
     */
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "The account payment was registered, but the statement could not be updated. Check your transactions before trying again."
        : "O pagamento foi registrado na conta, mas a fatura não pôde ser atualizada. Verifique os lançamentos antes de tentar novamente.",
    );
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/financial-health`);
  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/cards`);
  revalidatePath(`/${locale}/cards/${statement.credit_card_id}`);
  revalidatePath(
    `/${locale}/cards/${statement.credit_card_id}/statements/${statement.id}`,
  );

  return redirectWithMessage(
    "message",
    locale === "en"
      ? "Statement paid successfully."
      : "Fatura paga com sucesso.",
  );
}