import {createClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";

type AccountRelation = {
  name: string;
  color: string;
};

type CategoryRelation = {
  name: string;
};

type TransactionQueryRow = {
  id: string;
  description: string;
  amount: number | string;
  type: string;
  occurred_on: string;
  account: AccountRelation[] | AccountRelation | null;
  category: CategoryRelation[] | CategoryRelation | null;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');

  return text.includes(",") ||
    text.includes("\n") ||
    text.includes('"')
    ? `"${text}"`
    : text;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {error: "Unauthorized"},
      {status: 401},
    );
  }

  const {data, error} = await supabase
    .from("transactions")
    .select(`
      id,
      description,
      amount,
      type,
      occurred_on,
      account:accounts(name, color),
      category:categories(name)
    `)
    .eq("user_id", user.id)
    .neq("type", "transfer")
    .order("occurred_on", {ascending: false});

  if (error) {
    console.error("Erro ao exportar CSV:", error);

    return NextResponse.json(
      {error: error.message},
      {status: 500},
    );
  }

  const transactions = (data ?? []) as unknown as TransactionQueryRow[];

  const header = [
    "ID",
    "Descrição",
    "Valor",
    "Tipo",
    "Data",
    "Conta",
    "Categoria",
  ];

  const rows = transactions.map((transaction) => {
    const account = getFirstRelation(transaction.account);
    const category = getFirstRelation(transaction.category);

    return [
      transaction.id,
      transaction.description,
      Number(transaction.amount).toFixed(2).replace(".", ","),
      transaction.type === "income" ? "Receita" : "Despesa",
      transaction.occurred_on,
      account?.name ?? "",
      category?.name ?? "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");

  const csvWithBom = `\uFEFF${csv}`;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transacoes.csv"',
      "Cache-Control": "no-store",
    },
  });
}