"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

type AccountOption = {
  id: string;
  name: string;
};

type CreditCard = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
  credit_limit: number | string | null;
  closing_day: number;
  due_day: number;
  color: string;
  payment_account_id: string | null;
  is_active: boolean;
};

type EditCreditCardFormProps = {
  locale: string;
  card: CreditCard;
  accounts: AccountOption[];
};

type FormError = {
  field?: string;
  message: string;
};

function normalizeLastFour(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function EditCreditCardForm({
  locale,
  card,
  accounts,
}: EditCreditCardFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<FormError | null>(null);
  const [lastFour, setLastFour] = useState(card.last_four ?? "");

  const isEnglish = locale === "en";

  function text(pt: string, en: string) {
    return isEnglish ? en : pt;
  }

  function validate(
    name: string,
    creditLimit: string,
    closingDay: number,
    dueDay: number,
    color: string,
  ) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return text("Informe o nome do cartão.", "Enter the card name.");
    }

    if (trimmedName.length > 80) {
      return text(
        "O nome do cartão deve ter no máximo 80 caracteres.",
        "Card name must have at most 80 characters.",
      );
    }

    if (
      creditLimit &&
      (!Number.isFinite(Number(creditLimit)) || Number(creditLimit) < 0)
    ) {
      return text(
        "Informe um limite de crédito válido.",
        "Enter a valid credit limit.",
      );
    }

    if (closingDay < 1 || closingDay > 31) {
      return text(
        "O dia de fechamento deve ser entre 1 e 31.",
        "Closing day must be between 1 and 31.",
      );
    }

    if (dueDay < 1 || dueDay > 31) {
      return text(
        "O dia de vencimento deve ser entre 1 e 31.",
        "Due day must be between 1 and 31.",
      );
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return text("Escolha uma cor válida.", "Choose a valid color.");
    }

    return null;
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    const name = String(formData.get("name") ?? "").trim();
    const institution = String(formData.get("institution") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const lastFourValue = normalizeLastFour(
      String(formData.get("last_four") ?? ""),
    );
    const creditLimitText = String(
      formData.get("credit_limit") ?? "",
    ).trim();
    const closingDay = Number(formData.get("closing_day"));
    const dueDay = Number(formData.get("due_day"));
    const color = String(formData.get("color") ?? "#10B981");
    const paymentAccountId =
      String(formData.get("payment_account_id") ?? "") || null;

    const validationMessage = validate(
      name,
      creditLimitText,
      closingDay,
      dueDay,
      color,
    );

    if (validationMessage) {
      setError({message: validationMessage});
      return;
    }

    if (lastFourValue && lastFourValue.length !== 4) {
      setError({
        field: "last_four",
        message: text(
          "Informe exatamente os quatro últimos dígitos.",
          "Enter exactly the last four digits.",
        ),
      });
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        const {
          data: {user},
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(
            text(
              "Sua sessão expirou. Entre novamente.",
              "Your session has expired. Please sign in again.",
            ),
          );
        }

        const payload = {
          name,
          institution: institution || null,
          brand: brand || null,
          last_four: lastFourValue || null,
          credit_limit: creditLimitText
            ? Math.round(Number(creditLimitText) * 100) / 100
            : null,
          closing_day: closingDay,
          due_day: dueDay,
          color,
          payment_account_id: paymentAccountId,
        };

        const {error: updateError} = await supabase
          .from("credit_cards")
          .update(payload)
          .eq("id", card.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Erro ao atualizar cartão:", updateError);

          if (updateError.code === "23505") {
            throw new Error(
              text(
                "Você já possui um cartão com este nome.",
                "You already have a card with this name.",
              ),
            );
          }

          if (updateError.code === "23514") {
            throw new Error(
              text(
                "Verifique os dados do cartão e tente novamente.",
                "Check the card details and try again.",
              ),
            );
          }

          throw new Error(
            text(
              "Não foi possível atualizar o cartão.",
              "Could not update the credit card.",
            ),
          );
        }

        router.push(`/${locale}/cards`);
        router.refresh();
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : text(
                "Não foi possível atualizar o cartão.",
                "Could not update the credit card.",
              );

        setError({message});
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-7">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm leading-6 text-rose-100"
        >
          {error.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {text("Dados do cartão", "Card details")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Nome do cartão", "Card name")}
            </span>

            <input
              name="name"
              type="text"
              required
              minLength={1}
              maxLength={80}
              defaultValue={card.name}
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Instituição", "Institution")}
            </span>

            <input
              name="institution"
              type="text"
              maxLength={100}
              defaultValue={card.institution ?? ""}
              placeholder={text("Ex.: Nubank", "e.g. Nubank")}
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Bandeira", "Brand")}
            </span>

            <select
              name="brand"
              defaultValue={card.brand ?? ""}
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 focus:bg-white/5"
            >
              <option value="">{text("Selecione", "Select")}</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="elo">Elo</option>
              <option value="hipercard">Hipercard</option>
              <option value="other">{text("Outra", "Other")}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Últimos 4 dígitos", "Last four digits")}
            </span>

            <input
              name="last_four"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={lastFour}
              onChange={(event) =>
                setLastFour(normalizeLastFour(event.target.value))
              }
              placeholder="1234"
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/5"
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              {text("Limite de crédito", "Credit limit")}
            </span>

            <input
              name="credit_limit"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={card.credit_limit ?? ""}
              placeholder={text("Ex.: 5000,00", "e.g. 5000.00")}
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/5"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {text("Fatura e pagamento", "Statement and payment")}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {text(
              "A conta escolhida será a conta padrão para pagar as faturas deste cartão.",
              "The selected account will be the default account used to pay this card's statements.",
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Dia de fechamento", "Closing day")}
            </span>

            <select
              name="closing_day"
              defaultValue={String(card.closing_day)}
              required
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 focus:bg-white/5"
            >
              {Array.from({length: 31}, (_, index) => index + 1).map(
                (day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {text("Dia de vencimento", "Due day")}
            </span>

            <select
              name="due_day"
              defaultValue={String(card.due_day)}
              required
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 focus:bg-white/5"
            >
              {Array.from({length: 31}, (_, index) => index + 1).map(
                (day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              {text(
                "Conta padrão para pagar a fatura",
                "Default account for statement payment",
              )}
            </span>

            <select
              name="payment_account_id"
              defaultValue={card.payment_account_id ?? ""}
              className="app-input h-11 rounded-xl bg-white/3 px-3.5 text-sm text-slate-100 focus:bg-white/5"
            >
              <option value="">
                {text(
                  "Definir no momento do pagamento",
                  "Choose when paying the statement",
                )}
              </option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-6">
        <h2 className="text-lg font-semibold text-white">
          {text("Aparência", "Appearance")}
        </h2>

        <label className="flex max-w-xs flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">
            {text("Cor do cartão", "Card color")}
          </span>

          <input
            name="color"
            type="color"
            defaultValue={card.color || "#10B981"}
            className="h-11 w-full cursor-pointer rounded-xl border border-white/8 bg-white/3 p-1"
          />
        </label>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/cards`)}
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text("Cancelar", "Cancel")}
        </button>

        <button
          type="submit"
          disabled={pending}
          className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? text("Salvando alterações...", "Saving changes...")
            : text("Salvar alterações", "Save changes")}
        </button>
      </div>
    </form>
  );
}