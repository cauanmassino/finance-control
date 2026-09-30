"use client";

import Link from "next/link";
import {useState} from "react";
import {deleteTransaction} from "@/app/[locale]/(app)/transactions/manage-actions";

type TransactionActionsProps = {
  locale: string;
  transactionId: string;
};

export function TransactionActions({
  locale,
  transactionId,
}: TransactionActionsProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (showConfirmation) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <form
          action={async (formData) => {
            setIsDeleting(true);
            await deleteTransaction(formData);
          }}
        >
          <input type="hidden" name="locale" value={locale} />

          <input
            type="hidden"
            name="transaction_id"
            value={transactionId}
          />

          <button
            type="submit"
            disabled={isDeleting}
            className="inline-flex h-8 items-center justify-center rounded-md bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </form>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => setShowConfirmation(false)}
          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/${locale}/transactions/${transactionId}/edit`}
        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
      >
        Editar
      </Link>

      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="inline-flex h-8 items-center justify-center rounded-md border border-rose-900/50 bg-rose-950/20 px-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-950/30"
      >
        Excluir
      </button>
    </div>
  );
}