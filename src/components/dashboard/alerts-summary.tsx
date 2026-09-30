import Link from "next/link";
import {CategoryIcon} from "@/components/categories/category-icon";

type AlertLevel = "danger" | "warning" | "info";

type DashboardAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  href: string;
  iconName?: string | null;
  color?: string;
};

type AlertsSummaryProps = {
  locale: string;
  alerts: DashboardAlert[];
};

function getLevelStyles(level: AlertLevel) {
  if (level === "danger") {
    return {
      dot: "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.9)]",
      badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
      label: "text-rose-200",
    };
  }

  if (level === "warning") {
    return {
      dot: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]",
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
      label: "text-amber-200",
    };
  }

  return {
    dot: "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]",
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    label: "text-cyan-200",
  };
}

export function AlertsSummary({
  locale,
  alerts,
}: AlertsSummaryProps) {
  const isEnglish = locale === "en";

  const dangerCount = alerts.filter(
    (alert) => alert.level === "danger",
  ).length;

  const warningCount = alerts.filter(
    (alert) => alert.level === "warning",
  ).length;

  const visibleAlerts = alerts.slice(0, 3);

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Financial monitoring" : "Monitoramento financeiro"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Alerts" : "Alertas"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {alerts.length === 0
              ? isEnglish
                ? "Everything appears to be under control."
                : "Tudo parece estar sob controle."
              : isEnglish
                ? `${alerts.length} item(s) need your attention.`
                : `${alerts.length} item(ns) precisam da sua atenção.`}
          </p>
        </div>

        <Link
          href={`/${locale}/alerts`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          {isEnglish ? "View all" : "Ver todos"} →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 p-5 sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.1] text-emerald-200">
            ✓
          </span>

          <div>
            <p className="text-sm font-semibold text-slate-100">
              {isEnglish
                ? "No alerts at this moment"
                : "Nenhum alerta neste momento"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {isEnglish
                ? "Budgets, accounts, recurring items, and goals are looking good."
                : "Orçamentos, contas, recorrências e metas estão em ordem."}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {dangerCount > 0 ? (
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs font-bold text-rose-100">
                {dangerCount}{" "}
                {isEnglish
                  ? dangerCount === 1
                    ? "requires attention"
                    : "require attention"
                  : dangerCount === 1
                    ? "requer atenção"
                    : "requerem atenção"}
              </span>
            ) : null}

            {warningCount > 0 ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100">
                {warningCount}{" "}
                {isEnglish
                  ? warningCount === 1
                    ? "near limit"
                    : "near limits"
                  : warningCount === 1
                    ? "próximo do limite"
                    : "próximos do limite"}
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            {visibleAlerts.map((alert) => {
              const styles = getLevelStyles(alert.level);

              return (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 transition hover:border-white/[0.15] hover:bg-white/[0.06]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={
                      alert.color
                        ? {
                            backgroundColor: `${alert.color}20`,
                            color: alert.color,
                          }
                        : undefined
                    }
                  >
                    {alert.iconName ? (
                      <CategoryIcon
                        name={alert.iconName}
                        size={19}
                        strokeWidth={1.9}
                      />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {alert.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {alert.description}
                    </p>
                  </div>

                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}