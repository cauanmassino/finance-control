import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

type TransactionType = "income" | "expense";

type CsvTransaction = {
  description: string;
  amount: number | string;
  type: TransactionType | "transfer";
  occurred_on: string;
  payment_method: string | null;
  status: "paid" | "pending" | null;
  notes: string | null;
  category:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
  account:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

function isValidMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function getDefaultMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthRange(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const now = new Date();

  const year = Number(yearText ?? now.getFullYear());
  const month = Number(monthText ?? now.getMonth() + 1);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  function toDateString(date: Date) {
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, "0");
    const dateDay = String(date.getDate()).padStart(2, "0");

    return `${dateYear}-${dateMonth}-${dateDay}`;
  }

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function formatPaymentMethod(
  paymentMethod: string | null,
  isEnglish: boolean,
) {
  if (!paymentMethod) {
    return "";
  }

  const labels: Record<string, {pt: string; en: string}> = {
    pix: {
      pt: "Pix",
      en: "Pix",
    },
    debit_card: {
      pt: "Cartão de débito",
      en: "Debit card",
    },
    credit_card: {
      pt: "Cartão de crédito",
      en: "Credit card",
    },
    cash: {
      pt: "Dinheiro",
      en: "Cash",
    },
    bank_transfer: {
      pt: "Transferência bancária",
      en: "Bank transfer",
    },
    boleto: {
      pt: "Boleto",
      en: "Bank slip",
    },
    other: {
      pt: "Outro",
      en: "Other",
    },
  };

  const label = labels[paymentMethod];

  if (!label) {
    return paymentMethod;
  }

  return isEnglish ? label.en : label.pt;
}

function formatDateForCsv(dateValue: string, isEnglish: boolean) {
  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return isEnglish
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;
}

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);

  const requestedLocale = searchParams.get("locale");
  const locale = requestedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const requestedMonth = searchParams.get("month");
  const requestedType = searchParams.get("type");
  const requestedAccount = searchParams.get("account");
  const requestedCategory = searchParams.get("category");

  const selectedMonth = isValidMonth(requestedMonth)
    ? requestedMonth
    : getDefaultMonth();

  const selectedType: TransactionType | "all" =
    requestedType === "income" || requestedType === "expense"
      ? requestedType
      : "all";

  const {start: monthStart, end: nextMonthStart} = getMonthRange(
    selectedMonth,
  );

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: isEnglish ? "Unauthorized." : "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  let query = supabase
    .from("transactions")
    .select(`
      description,
      amount,
      type,
      occurred_on,
      payment_method,
      status,
      notes,
      category:categories!transactions_category_id_fkey (
        name
      ),
      account:accounts!transactions_account_id_fkey (
        name
      )
    `)
    .eq("user_id", user.id)
    .neq("type", "transfer")
    .gte("occurred_on", monthStart)
    .lt("occurred_on", nextMonthStart)
    .order("occurred_on", {ascending: false})
    .order("created_at", {ascending: false});

  if (selectedType !== "all") {
    query = query.eq("type", selectedType);
  }

  if (requestedAccount) {
    query = query.eq("account_id", requestedAccount);
  }

  if (requestedCategory) {
    query = query.eq("category_id", requestedCategory);
  }

  const {data: transactions, error} = await query;

  if (error) {
    console.error("Erro ao exportar lançamentos:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return NextResponse.json(
      {
        error: isEnglish
          ? "Could not export transactions."
          : "Não foi possível exportar os lançamentos.",
      },
      {
        status: 500,
      },
    );
  }

  const typedTransactions = (transactions ?? []) as CsvTransaction[];

  const header = isEnglish
    ? [
        "Date",
        "Description",
        "Type",
        "Amount",
        "Account",
        "Category",
        "Payment method",
        "Status",
        "Notes",
      ]
    : [
        "Data",
        "Descrição",
        "Tipo",
        "Valor",
        "Conta",
        "Categoria",
        "Método de pagamento",
        "Status",
        "Observação",
      ];

  const rows = typedTransactions.map((transaction) => {
    const category = getFirstRelation(transaction.category);
    const account = getFirstRelation(transaction.account);

    return [
      formatDateForCsv(transaction.occurred_on, isEnglish),
      transaction.description,
      transaction.type === "income"
        ? isEnglish
          ? "Income"
          : "Receita"
        : isEnglish
          ? "Expense"
          : "Despesa",
      Number(transaction.amount).toFixed(2).replace(".", ","),
      account?.name ?? (isEnglish ? "No account" : "Sem conta"),
      category?.name ?? (isEnglish ? "No category" : "Sem categoria"),
      formatPaymentMethod(transaction.payment_method, isEnglish),
      transaction.status === "pending"
        ? isEnglish
          ? "Pending"
          : "Pendente"
        : isEnglish
          ? "Paid"
          : "Pago",
      transaction.notes ?? "",
    ];
  });

  const csvContent = [
    header.map(escapeCsvValue).join(";"),
    ...rows.map((row) => row.map(escapeCsvValue).join(";")),
  ].join("\n");

  const fileName = isEnglish
    ? `transactions-${selectedMonth}.csv`
    : `lancamentos-${selectedMonth}.csv`;

  return new NextResponse(`\uFEFF${csvContent}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}