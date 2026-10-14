import {NextRequest, NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

type Locale = "pt" | "en";

type RouteContext = {
  params: Promise<{
    locale: string;
    cardId: string;
    statementId: string;
  }>;
};

type PaymentResult = {
  status: "paid" | "already_paid";
  amount: number | string;
  transaction_id?: string;
};

function getLocale(value: string): Locale {
  return value === "en" ? "en" : "pt";
}

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const lastDay = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();

  return day <= lastDay;
}

function getTodayInBrazil() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(
    locale === "en" ? "en-US" : "pt-BR",
    {
      style: "currency",
      currency: locale === "en" ? "USD" : "BRL",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function getPaymentErrorMessage(
  message: string,
  locale: Locale,
) {
  const isEnglish = locale === "en";

  if (message.includes("PAYMENT_UNAUTHORIZED")) {
    return isEnglish
      ? "Your session has expired. Sign in again."
      : "Sua sessão expirou. Entre novamente.";
  }

  if (message.includes("PAYMENT_INVALID_DATE")) {
    return isEnglish
      ? "Enter a valid payment date."
      : "Informe uma data válida para o pagamento.";
  }

  if (message.includes("PAYMENT_STATEMENT_NOT_FOUND")) {
    return isEnglish
      ? "The statement was not found or does not belong to this card."
      : "A fatura não foi encontrada ou não pertence a este cartão.";
  }

  if (message.includes("PAYMENT_ACCOUNT_NOT_FOUND")) {
    return isEnglish
      ? "The selected account is invalid."
      : "A conta selecionada não é válida.";
  }

  if (
    message.includes("PAYMENT_INSUFFICIENT_BALANCE")
  ) {
    return isEnglish
      ? "The selected account does not have enough balance to pay the remaining statement amount."
      : "A conta selecionada não possui saldo suficiente para pagar o valor restante da fatura.";
  }

  return isEnglish
    ? "Could not confirm the statement payment. Refresh the statement and check your transactions before trying again."
    : "Não foi possível confirmar o pagamento da fatura. Atualize a fatura e confira os lançamentos antes de tentar novamente.";
}

function revalidatePaymentPaths(
  locale: Locale,
  cardId: string,
  statementId: string,
) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/financial-health`);
  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/reports`);
  revalidatePath(`/${locale}/cards`);
  revalidatePath(`/${locale}/cards/${cardId}`);

  revalidatePath(
    `/${locale}/cards/${cardId}/statements/${statementId}`,
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const params = await context.params;

  const locale = getLocale(params.locale);
  const cardId = params.cardId;
  const statementId = params.statementId;

  if (
    !isValidUuid(cardId) ||
    !isValidUuid(statementId)
  ) {
    const url = new URL(
      `/${locale}/cards`,
      request.url,
    );

    url.searchParams.set(
      "error",
      locale === "en"
        ? "Invalid card or statement."
        : "Cartão ou fatura inválidos.",
    );

    return NextResponse.redirect(url, 303);
  }

  const statementBasePath =
    `/${locale}/cards/${cardId}/statements/${statementId}`;

  const redirectWithMessage = (
    key: "message" | "error",
    value: string,
  ) => {
    const url = new URL(
      statementBasePath,
      request.url,
    );

    url.searchParams.set(key, value);

    return NextResponse.redirect(url, 303);
  };

  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Invalid request origin."
            : "Origem da requisição inválida.",
      },
      {status: 403},
    );
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/auth/login`,
        request.url,
      ),
      303,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Invalid payment form."
        : "Formulário de pagamento inválido.",
    );
  }

  const accountId = getText(
    formData,
    "account_id",
  );

  if (!accountId) {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Choose the account that will pay the statement."
        : "Selecione a conta que pagará a fatura.",
    );
  }

  if (!isValidUuid(accountId)) {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "The selected account is invalid."
        : "A conta selecionada não é válida.",
    );
  }

  const enteredPaymentDate = getText(
    formData,
    "payment_date",
  );

  const today = getTodayInBrazil();

  const paymentDate =
    enteredPaymentDate || today;

  if (
    !isValidDate(paymentDate) ||
    paymentDate > today
  ) {
    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Enter a valid payment date that is not in the future."
        : "Informe uma data de pagamento válida que não esteja no futuro.",
    );
  }

  const {data, error: paymentError} =
    await supabase.rpc(
      "pay_credit_card_statement_v1",
      {
        p_statement_id: statementId,
        p_card_id: cardId,
        p_account_id: accountId,
        p_payment_date: paymentDate,
      },
    );

  if (paymentError) {
    console.error(
      "Erro ao registrar pagamento da fatura:",
      {
        code: paymentError.code,
        message: paymentError.message,
        details: paymentError.details,
        hint: paymentError.hint,
        statementId,
        cardId,
        accountId,
      },
    );

    return redirectWithMessage(
      "error",
      getPaymentErrorMessage(
        paymentError.message,
        locale,
      ),
    );
  }

  const result =
    data as PaymentResult | null;

  if (
    !result ||
    (result.status !== "paid" &&
      result.status !== "already_paid")
  ) {
    console.error(
      "Resposta inesperada ao pagar fatura:",
      data,
    );

    revalidatePaymentPaths(
      locale,
      cardId,
      statementId,
    );

    return redirectWithMessage(
      "error",
      locale === "en"
        ? "Unexpected payment response. Refresh the statement and check your transactions before trying again."
        : "Resposta inesperada do pagamento. Atualize a fatura e confira os lançamentos antes de tentar novamente.",
    );
  }

  revalidatePaymentPaths(
    locale,
    cardId,
    statementId,
  );

  if (result.status === "already_paid") {
    return redirectWithMessage(
      "message",
      locale === "en"
        ? "This statement is already settled. No new account withdrawal was recorded."
        : "Esta fatura já está quitada. Nenhum novo débito foi registrado na conta.",
    );
  }

  const paidValue = Number(result.amount);

  return redirectWithMessage(
    "message",
    locale === "en"
      ? `Statement paid successfully. ${formatCurrency(paidValue, locale)} was debited from the selected account.`
      : `Fatura paga com sucesso. ${formatCurrency(paidValue, locale)} foram debitados da conta selecionada.`,
  );
}