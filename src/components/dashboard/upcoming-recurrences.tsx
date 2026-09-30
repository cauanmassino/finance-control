import Link from "next/link";

type UpcomingRecurrence = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  next_occurrence: string;
  frequency: "weekly" | "monthly" | "yearly";
  category: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
};

type UpcomingRecurrencesProps = {
  locale: string;
  recurrences: UpcomingRecurrence[];
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
  }).format(value);
}

function formatShortDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function UpcomingRecurrences({
  locale,
  recurrences,
}: UpcomingRecurrencesProps) {
  const isEnglish = locale === "en";

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="text-lg font-semibold">
            {isEnglish ? "Upcoming recurrences" : "Próximas recorrências"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {isEnglish
              ? "Your next scheduled income and expenses."
              : "Suas próximas receitas e despesas programadas."}
          </p>
        </div>

        <Link
          href={`/${locale}/recurring`}
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          {isEnglish ? "View all" : "Ver todas"}
        </Link>
      </div>

      {recurrences.length === 0 ? (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">
            {isEnglish
              ? "You do not have active recurring transactions."
              : "Você não possui recorrências ativas."}
          </p>

          <Link
            href={`/${locale}/transactions/new`}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {isEnglish
              ? "Create a recurring transaction"
              : "Criar lançamento recorrente"}
          </Link>
        </div>
      ) : (
        <div className="divide-y">
          {recurrences.map((recurrence) => {
            const categoryColor = recurrence.category?.color ?? "#64748b";

            const categoryIcon =
              recurrence.category?.icon ??
              (recurrence.type === "income" ? "↗" : "↘");

            return (
              <Link
                key={recurrence.id}
                href={`/${locale}/recurring/${recurrence.id}/edit`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {categoryIcon}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {recurrence.description}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isEnglish ? "Due" : "Próxima"}:{" "}
                    {formatShortDate(recurrence.next_occurrence, locale)}
                  </p>
                </div>

                <p
                  className={
                    recurrence.type === "income"
                      ? "shrink-0 text-sm font-semibold text-emerald-600"
                      : "shrink-0 text-sm font-semibold text-red-600"
                  }
                >
                  {recurrence.type === "income" ? "+" : "-"}{" "}
                  {formatCurrency(recurrence.amount, locale)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}