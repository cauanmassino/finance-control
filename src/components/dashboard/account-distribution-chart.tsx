type AccountDistribution = {
  id: string;
  name: string;
  color: string | null;
  balance: number;
  share: number;
};

type AccountDistributionChartProps = {
  data: AccountDistribution[];
  totalBalance: number;
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function AccountDistributionChart({
  data,
  totalBalance,
  locale,
}: AccountDistributionChartProps) {
  const isEnglish = locale === "en";

  const positiveAccounts = data.filter((account) => account.balance > 0);

  const segments: string[] = [];
  let currentPosition = 0;

  positiveAccounts.forEach((account) => {
    const color = account.color ?? "#60a5fa";
    const start = currentPosition;
    const end = Math.min(currentPosition + account.share, 100);

    segments.push(`${color} ${start}% ${end}%`);

    currentPosition = end;
  });

  if (segments.length === 0) {
    segments.push("rgba(255,255,255,0.08) 0% 100%");
  }

  const gradient = `conic-gradient(${segments.join(", ")})`;

  return (
    <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
      <div>
        <p className="app-kicker">
          {isEnglish ? "Balance allocation" : "Distribuição de saldo"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Balance by account" : "Saldo por conta"}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {isEnglish
            ? "How your current balance is distributed."
            : "Como seu saldo atual está distribuído entre as contas."}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          role="img"
          aria-label={
            isEnglish
              ? "Account balance distribution chart"
              : "Gráfico de distribuição de saldo por conta"
          }
          className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full shadow-[0_0_48px_rgba(56,189,248,0.1)]"
          style={{background: gradient}}
        >
          <div className="flex h-[7.25rem] w-[7.25rem] flex-col items-center justify-center rounded-full border border-white/[0.08] bg-slate-950/95 px-2 text-center shadow-inner">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {isEnglish ? "Total" : "Total"}
            </span>

            <span
              className={`mt-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.05em] ${
                totalBalance >= 0 ? "text-white" : "text-rose-300"
              }`}
            >
              {formatCurrency(totalBalance, locale)}
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-3">
          {data.length === 0 ? (
            <p className="text-sm text-slate-400">
              {isEnglish ? "No accounts yet." : "Nenhuma conta ainda."}
            </p>
          ) : (
            data.map((account) => {
              const color = account.color ?? "#60a5fa";

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                      style={{
                        backgroundColor: color,
                        color,
                      }}
                    />

                    <span className="truncate text-sm font-medium text-slate-300">
                      {account.name}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-bold ${
                        account.balance >= 0
                          ? "text-slate-100"
                          : "text-rose-300"
                      }`}
                    >
                      {formatCurrency(account.balance, locale)}
                    </p>

                    <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-500">
                      {account.share.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">
          {isEnglish ? "View account data" : "Ver dados das contas"}
        </summary>

        {data.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "No account data available."
              : "Nenhum dado de conta disponível."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06] text-xs">
            {data.map((account) => (
              <li
                key={`data-${account.id}`}
                className="flex items-center justify-between gap-3 py-2 text-slate-300"
              >
                <span className="truncate">{account.name}</span>

                <span className="shrink-0">
                  {formatCurrency(account.balance, locale)} (
                  {account.share.toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </article>
  );
}