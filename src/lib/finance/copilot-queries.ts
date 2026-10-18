import "server-only";

import {createClient} from "@/lib/supabase/server";

type DatabaseClient =
  Awaited<ReturnType<typeof createClient>>;

export type FinanceQueryResult<T> =
  | {
      status: "ok";
      data: T;
    }
  | {
      status: "unauthenticated";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export type AccountBalance = {
  id: string;
  name: string;
  color: string | null;
  balance: number;
};

export type AccountBalancesResult = {
  accounts: AccountBalance[];
  totalBalance: number;
  currency: "BRL";
  source: "finco_records";
  rule: string;
};

export type PeriodName =
  | "current_month"
  | "previous_month"
  | "last_30_days"
  | "custom";

export type ExpenseQueryInput = {
  period: PeriodName;
  from?: string | null;
  to?: string | null;
  categoryName?: string | null;
};

export type FinancePeriod = {
  from: string;
  to: string;
  toExclusive: string;
  timezone: "America/Sao_Paulo";
  label: string;
};

export type CategoryExpense = {
  id: string | null;
  name: string;
  total: number;
  transactionCount: number;
  percentage: number;
};

export type ExpenseSummary = {
  total: number;
  transactionCount: number;
  period: FinancePeriod;
  categoryFilter: string | null;
  categories: CategoryExpense[];
  currency: "BRL";
  source: "finco_records";
  complete: true;
  rule: string;
};

export type NextStatement = {
  cardId: string;
  cardName: string;
  institution: string | null;
  brand: string | null;
  lastFour: string | null;
  statementId: string;
  closingDate: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  currency: "BRL";
};

type ExpenseRow = {
  id: string;
  amount: number | string;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  type: string;
};

type StatementRow = {
  id: string;
  credit_card_id: string;
  closing_date: string;
  due_date: string;
  status: string;
  total_amount: number | string;
  paid_amount: number | string;
};

type CardRow = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
};

type PageResult = {
  data: unknown[] | null;
  error: unknown;
  count: number | null;
};

const TIMEZONE = "America/Sao_Paulo" as const;

const PAGE_SIZE = 500;
const MAX_ROWS = 20_000;
const MAX_PAGE_REQUESTS = 100;

export function getFinanceToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
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

  if (!year || !month || !day) {
    throw new Error(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      "Informe as datas no formato AAAA-MM-DD.",
    );
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(date.getTime()) ||
    dateString(date) !== value
  ) {
    throw new Error(
      "Uma das datas informadas não existe.",
    );
  }

  const year = date.getUTCFullYear();

  if (year < 1900 || year > 2100) {
    throw new Error(
      "Informe um ano entre 1900 e 2100.",
    );
  }

  return date;
}

function addDays(value: string, days: number) {
  const date = parseDate(value);

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return dateString(date);
}

function monthStart(
  value: string,
  offset = 0,
) {
  const date = parseDate(value);

  return dateString(
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + offset,
        1,
      ),
    ),
  );
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function makePeriod(
  from: string,
  to: string,
): FinancePeriod {
  const start = parseDate(from);
  const end = parseDate(to);

  if (start > end) {
    throw new Error(
      "A data inicial deve ser anterior ou igual à data final.",
    );
  }

  const days =
    Math.round(
      (end.getTime() - start.getTime()) /
        86_400_000,
    ) + 1;

  if (days > 366) {
    throw new Error(
      "Consulte um intervalo de até 366 dias por vez.",
    );
  }

  return {
    from,
    to,
    toExclusive: addDays(to, 1),
    timezone: TIMEZONE,
    label: `${displayDate(from)} a ${displayDate(to)}`,
  };
}

function resolvePeriod(
  input: ExpenseQueryInput,
): FinancePeriod {
  const today = getFinanceToday();

  switch (input.period) {
    case "current_month":
      return makePeriod(
        monthStart(today),
        addDays(
          monthStart(today, 1),
          -1,
        ),
      );

    case "previous_month":
      return makePeriod(
        monthStart(today, -1),
        addDays(
          monthStart(today),
          -1,
        ),
      );

    case "last_30_days":
      return makePeriod(
        addDays(today, -29),
        today,
      );

    case "custom":
      if (!input.from || !input.to) {
        throw new Error(
          "Informe a data inicial e a data final.",
        );
      }

      return makePeriod(
        input.from,
        input.to,
      );

    default:
      throw new Error(
        "Período de consulta inválido.",
      );
  }
}

function cents(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);
  const result = Math.round(parsed * 100);

  if (
    !Number.isFinite(parsed) ||
    !Number.isSafeInteger(result)
  ) {
    throw new Error(
      "Foi encontrado um valor financeiro inválido.",
    );
  }

  return result;
}

function money(valueInCents: number) {
  if (!Number.isSafeInteger(valueInCents)) {
    throw new Error(
      "O total excedeu o limite seguro de cálculo.",
    );
  }

  return valueInCents / 100;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

async function readAll<T extends {id: string}>(
  load: (
    from: number,
    to: number,
  ) => PromiseLike<PageResult>,
): Promise<T[]> {
  const rows: T[] = [];
  const seenIds = new Set<string>();

  let expectedCount: number | null = null;

  for (
    let page = 0;
    page < MAX_PAGE_REQUESTS;
    page += 1
  ) {
    const offset = rows.length;

    const result = await load(
      offset,
      offset + PAGE_SIZE - 1,
    );

    if (
      result.error ||
      result.count === null
    ) {
      throw new Error(
        "Não foi possível carregar todos os registros da consulta.",
      );
    }

    if (expectedCount === null) {
      expectedCount = result.count;

      if (expectedCount > MAX_ROWS) {
        throw new Error(
          "A consulta excedeu 20 mil registros. Reduza o período.",
        );
      }
    } else if (
      result.count !== expectedCount
    ) {
      throw new Error(
        "Os registros mudaram durante a consulta. Tente novamente.",
      );
    }

    const batch = (
      result.data ?? []
    ) as T[];

    for (const row of batch) {
      if (
        !row.id ||
        seenIds.has(row.id)
      ) {
        throw new Error(
          "A paginação ficou inconsistente. Tente novamente.",
        );
      }

      seenIds.add(row.id);
      rows.push(row);
    }

    if (
      rows.length === expectedCount
    ) {
      return rows;
    }

    if (
      batch.length === 0 ||
      rows.length > expectedCount
    ) {
      throw new Error(
        "A consulta retornou registros incompletos.",
      );
    }
  }

  throw new Error(
    "A consulta excedeu o limite de páginas.",
  );
}

async function withUser<T>(
  execute: (
    supabase: DatabaseClient,
    userId: string,
  ) => Promise<T>,
): Promise<FinanceQueryResult<T>> {
  try {
    const supabase = await createClient();

    const {
      data: {user},
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        status: "unauthenticated",
        message:
          "Faça login para consultar seus dados financeiros.",
      };
    }

    const data = await execute(
      supabase,
      user.id,
    );

    return {
      status: "ok",
      data,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a consulta financeira.",
    };
  }
}

async function loadExpenseSummary(
  supabase: DatabaseClient,
  userId: string,
  period: FinancePeriod,
  categoryName?: string | null,
): Promise<ExpenseSummary> {
  const categories = await readAll<CategoryRow>(
    (from, to) =>
      supabase
        .from("categories")
        .select(
          "id, name, type",
          {
            count: "exact",
          },
        )
        .eq("user_id", userId)
        .order("id", {
          ascending: true,
        })
        .range(from, to),
  );

  let categoryFilter:
    | CategoryRow
    | null = null;

  let filterUncategorized = false;

  const requestedCategory =
    categoryName?.trim();

  if (requestedCategory) {
    const term = normalize(
      requestedCategory,
    );

    if (
      term.length < 2 ||
      term.length > 80
    ) {
      throw new Error(
        "Informe uma categoria entre 2 e 80 caracteres.",
      );
    }

    if (term === "sem categoria") {
      filterUncategorized = true;
    } else {
      const expenseCategories =
        categories.filter(
          (category) =>
            category.type === "expense",
        );

      const exactMatches =
        expenseCategories.filter(
          (category) =>
            normalize(category.name) === term,
        );

      const matches =
        exactMatches.length > 0
          ? exactMatches
          : expenseCategories.filter(
              (category) =>
                normalize(
                  category.name,
                ).includes(term),
            );

      if (matches.length === 0) {
        throw new Error(
          `Não encontrei uma categoria de despesa chamada "${requestedCategory}". Informe o nome usado no FINCO.`,
        );
      }

      if (matches.length > 1) {
        const names = matches
          .slice(0, 10)
          .map(
            (category) =>
              category.name,
          )
          .join(", ");

        throw new Error(
          `Encontrei mais de uma categoria: ${names}. Informe qual deseja consultar.`,
        );
      }

      categoryFilter = matches[0];
    }
  }

  const expenses = await readAll<ExpenseRow>(
    (from, to) => {
      let query = supabase
        .from("transactions")
        .select(
          "id, amount, category_id",
          {
            count: "exact",
          },
        )
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte(
          "occurred_on",
          period.from,
        )
        .lt(
          "occurred_on",
          period.toExclusive,
        );

      if (categoryFilter) {
        query = query.eq(
          "category_id",
          categoryFilter.id,
        );
      }

      if (filterUncategorized) {
        query = query.is(
          "category_id",
          null,
        );
      }

      return query
        .order("id", {
          ascending: true,
        })
        .range(from, to);
    },
  );

  const categoryNames = new Map(
    categories.map(
      (category) => [
        category.id,
        category.name,
      ],
    ),
  );

  const groups = new Map<
    string,
    {
      id: string | null;
      name: string;
      totalCents: number;
      transactionCount: number;
    }
  >();

  let totalCents = 0;

  for (const expense of expenses) {
    const amount = cents(
      expense.amount,
    );

    totalCents += amount;

    const key =
      expense.category_id ??
      "uncategorized";

    const existing =
      groups.get(key) ?? {
        id: expense.category_id,
        name: expense.category_id
          ? categoryNames.get(
              expense.category_id,
            ) ?? "Categoria indisponível"
          : "Sem categoria",
        totalCents: 0,
        transactionCount: 0,
      };

    existing.totalCents += amount;
    existing.transactionCount += 1;

    groups.set(key, existing);
  }

  const ranking: CategoryExpense[] = [
    ...groups.values(),
  ]
    .sort(
      (first, second) =>
        second.totalCents -
          first.totalCents ||
        first.name.localeCompare(
          second.name,
          "pt-BR",
        ),
    )
    .map((category) => ({
      id: category.id,
      name: category.name,
      total: money(
        category.totalCents,
      ),
      transactionCount:
        category.transactionCount,
      percentage:
        totalCents > 0
          ? Math.round(
              (
                category.totalCents /
                totalCents
              ) * 10_000,
            ) / 100
          : 0,
    }));

  return {
    total: money(totalCents),
    transactionCount:
      expenses.length,
    period,
    categoryFilter:
      filterUncategorized
        ? "Sem categoria"
        : categoryFilter?.name ??
          null,
    categories: ranking,
    currency: "BRL",
    source: "finco_records",
    complete: true,
    rule:
      "Despesas pela data de ocorrência, sem filtrar status. Compras no crédito contam como despesas. Transferências e pagamentos de fatura não contam novamente. Um mês completo pode incluir lançamentos futuros já registrados. Esta versão assume valores em BRL e não realiza conversão de moedas.",
  };
}

export async function getExpensesByPeriod(
  input: ExpenseQueryInput,
): Promise<FinanceQueryResult<ExpenseSummary>> {
  return withUser(
    async (supabase, userId) => {
      const period = resolvePeriod(
        input,
      );

      return loadExpenseSummary(
        supabase,
        userId,
        period,
        input.categoryName,
      );
    },
  );
}

export async function getCurrentMonthExpenses(): Promise<
  FinanceQueryResult<ExpenseSummary>
> {
  return getExpensesByPeriod({
    period: "current_month",
  });
}

export async function compareMonthExpenses(
  mode: "same_days" | "full_months",
) {
  return withUser(
    async (supabase, userId) => {
      if (
        mode !== "same_days" &&
        mode !== "full_months"
      ) {
        throw new Error(
          "Modo de comparação inválido.",
        );
      }

      const today = getFinanceToday();

      const currentStart =
        monthStart(today);

      const previousStart =
        monthStart(today, -1);

      const previousEnd = addDays(
        currentStart,
        -1,
      );

      const dayOfMonth = Number(
        today.slice(8, 10),
      );

      const previousMonthDays =
        Number(
          previousEnd.slice(8, 10),
        );

      const previousComparableEnd =
        addDays(
          previousStart,
          Math.min(
            dayOfMonth,
            previousMonthDays,
          ) - 1,
        );

      const currentPeriod =
        makePeriod(
          currentStart,
          mode === "same_days"
            ? today
            : addDays(
                monthStart(today, 1),
                -1,
              ),
        );

      const previousPeriod =
        makePeriod(
          previousStart,
          mode === "same_days"
            ? previousComparableEnd
            : previousEnd,
        );

      const [
        current,
        previous,
      ] = await Promise.all([
        loadExpenseSummary(
          supabase,
          userId,
          currentPeriod,
        ),
        loadExpenseSummary(
          supabase,
          userId,
          previousPeriod,
        ),
      ]);

      const currentCents =
        cents(current.total);

      const previousCents =
        cents(previous.total);

      const differenceCents =
        currentCents -
        previousCents;

      return {
        mode,
        currency: "BRL" as const,

        current: {
          period: current.period,
          total: current.total,
          transactionCount:
            current.transactionCount,
        },

        previous: {
          period: previous.period,
          total: previous.total,
          transactionCount:
            previous.transactionCount,
        },

        difference: money(
          differenceCents,
        ),

        percentageChange:
          previousCents > 0
            ? Math.round(
                (
                  differenceCents /
                  previousCents
                ) * 10_000,
              ) / 100
            : null,

        interpretation:
          differenceCents > 0
            ? "increase"
            : differenceCents < 0
              ? "decrease"
              : "equal",

        note:
          mode === "same_days"
            ? "Compara do dia 1 até hoje com os dias correspondentes do mês anterior, limitado ao último dia daquele mês. As durações podem diferir."
            : "Compara meses completos. O mês atual pode incluir despesas futuras cadastradas. Isso não representa previsão de gastos.",

        percentageNote:
          previousCents === 0
            ? "A variação percentual não é calculada quando o total anterior é zero."
            : null,
      };
    },
  );
}

export async function getNextStatement(): Promise<
  FinanceQueryResult<NextStatement | null>
> {
  return withUser(
    async (supabase, userId) => {
      const statements =
        await readAll<StatementRow>(
          (from, to) =>
            supabase
              .from(
                "credit_card_statements",
              )
              .select(
                "id, credit_card_id, closing_date, due_date, status, total_amount, paid_amount",
                {
                  count: "exact",
                },
              )
              .eq(
                "user_id",
                userId,
              )
              .in(
                "status",
                [
                  "open",
                  "closed",
                  "overdue",
                ],
              )
              .order("id", {
                ascending: true,
              })
              .range(from, to),
        );

      const pending = statements
        .filter(
          (statement) =>
            cents(
              statement.total_amount,
            ) -
              cents(
                statement.paid_amount,
              ) >
            0,
        )
        .sort(
          (first, second) =>
            first.due_date.localeCompare(
              second.due_date,
            ) ||
            first.closing_date.localeCompare(
              second.closing_date,
            ) ||
            first.id.localeCompare(
              second.id,
            ),
        )[0];

      if (!pending) {
        return null;
      }

      const {
        data: card,
        error,
      } = await supabase
        .from("credit_cards")
        .select(
          "id, name, institution, brand, last_four",
        )
        .eq(
          "user_id",
          userId,
        )
        .eq(
          "id",
          pending.credit_card_id,
        )
        .maybeSingle();

      if (error || !card) {
        throw new Error(
          "Não foi possível consultar o cartão da próxima fatura.",
        );
      }

      const typedCard =
        card as CardRow;

      const totalCents = cents(
        pending.total_amount,
      );

      const paidCents = cents(
        pending.paid_amount,
      );

      return {
        cardId:
          pending.credit_card_id,
        cardName:
          typedCard.name,
        institution:
          typedCard.institution,
        brand:
          typedCard.brand,
        lastFour:
          typedCard.last_four,
        statementId:
          pending.id,
        closingDate:
          pending.closing_date,
        dueDate:
          pending.due_date,
        status:
          pending.status,
        totalAmount:
          money(totalCents),
        paidAmount:
          money(paidCents),
        outstanding:
          money(
            totalCents - paidCents,
          ),
        currency: "BRL",
      };
    },
  );
}