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
  YAxis,
} from "recharts";

type MonthlyData = {
  month: string;
  receitas: number;
  despesas: number;
};

type CategoryData = {
  name: string;
  value: number;
  color: string;
};

type FinancialChartsProps = {
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinancialCharts({
  monthlyData,
  categoryData,
}: FinancialChartsProps) {
  const hasMonthlyData = monthlyData.some(
    (item) => item.receitas > 0 || item.despesas > 0,
  );

  const hasCategoryData = categoryData.length > 0;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">Receitas e despesas</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Comparativo mensal do período selecionado.
          </p>
        </div>

        {hasMonthlyData ? (
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 8,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${value}`}
                />

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />

                <Legend />

                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="#dc2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Cadastre lançamentos para visualizar a evolução das suas receitas
              e despesas.
            </p>
          </div>
        )}
      </article>

      <article className="rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">Despesas por categoria</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Distribuição dos seus gastos no período selecionado.
          </p>
        </div>

        {hasCategoryData ? (
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={108}
                  paddingAngle={3}
                >
                  {categoryData.map((category) => (
                    <Cell
                      key={category.name}
                      fill={category.color || "#64748b"}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Cadastre despesas com categorias para visualizar a distribuição
              dos seus gastos.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}