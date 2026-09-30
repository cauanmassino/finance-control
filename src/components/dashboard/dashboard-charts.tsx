"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type CashFlowPoint = {
  label: string;
  income: number;
  expense: number;
};

type CategoryPoint = {
  name: string;
  value: number;
  color: string;
};

type DashboardChartsProps = {
  cashFlowData: CashFlowPoint[];
  categoryData: CategoryPoint[];
  locale: "pt" | "en";
};

function formatCurrency(value: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

type TooltipPayload = {
  name?: string;
  value?: number;
  color?: string;
  payload?: {
    name?: string;
    value?: number;
  };
};

function CashFlowTooltip({
  active,
  payload,
  label,
  locale
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  locale: "pt" | "en";
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-medium text-slate-200">{label}</p>

      {payload.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-6 py-0.5"
        >
          <span style={{color: item.color}}>{item.name}</span>
          <span className="font-medium text-white">
            {formatCurrency(Number(item.value ?? 0), locale)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
  locale
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  locale: "pt" | "en";
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{data?.name}</p>
      <p className="mt-1 font-medium text-white">
        {formatCurrency(Number(data?.value ?? 0), locale)}
      </p>
    </div>
  );
}

export function DashboardCharts({
  cashFlowData,
  categoryData,
  locale
}: DashboardChartsProps) {
  const isEnglish = locale === "en";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-h-[340px] rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <p className="text-base font-semibold text-white">
            {isEnglish ? "Cash flow evolution" : "Evolução do fluxo de caixa"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {isEnglish
              ? "Income and expenses over the last six months."
              : "Receitas e despesas nos últimos seis meses."}
          </p>
        </div>

        {cashFlowData.some(
          (item) => item.income > 0 || item.expense > 0
        ) ? (
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashFlowData}
                margin={{top: 8, right: 8, left: -18, bottom: 0}}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: "#94a3b8", fontSize: 12}}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: "#94a3b8", fontSize: 12}}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(
                      locale === "en" ? "en-US" : "pt-BR",
                      {
                        notation: "compact",
                        maximumFractionDigits: 1
                      }
                    ).format(value)
                  }
                />

                <Tooltip
                  content={
                    <CashFlowTooltip locale={locale} />
                  }
                  cursor={{fill: "rgba(148, 163, 184, 0.06)"}}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    paddingTop: "10px"
                  }}
                />

                <Bar
                  dataKey="income"
                  name={isEnglish ? "Income" : "Receitas"}
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="expense"
                  name={isEnglish ? "Expenses" : "Despesas"}
                  fill="#fb7185"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-800 p-6 text-center">
            <p className="max-w-xs text-sm leading-6 text-slate-500">
              {isEnglish
                ? "Your chart will appear after income or expenses are recorded."
                : "Seu gráfico aparecerá após registrar receitas ou despesas."}
            </p>
          </div>
        )}
      </div>

      <div className="min-h-[340px] rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <p className="text-base font-semibold text-white">
            {isEnglish ? "Expenses by category" : "Despesas por categoria"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {isEnglish
              ? "Distribution of expenses in the selected month."
              : "Distribuição das despesas no mês selecionado."}
          </p>
        </div>

        {categoryData.length > 0 ? (
          <div className="mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip content={<CategoryTooltip locale={locale} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-800 p-6 text-center">
            <p className="max-w-xs text-sm leading-6 text-slate-500">
              {isEnglish
                ? "Expense categories will appear after you record expenses."
                : "As categorias aparecerão após você registrar despesas."}
            </p>
          </div>
        )}

        {categoryData.length > 0 ? (
          <div className="mt-1 space-y-2">
            {categoryData.slice(0, 4).map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{backgroundColor: category.color}}
                  />
                  <span className="truncate text-slate-300">
                    {category.name}
                  </span>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {formatCurrency(category.value, locale)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}