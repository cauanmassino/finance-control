"use client";

import Link from "next/link";
import {useState} from "react";
import {deleteTransaction} from "./manage-actions";

type TransactionActionsProps = {
  locale: string;
  transactionId: string;
};

export function TransactionActions({
  locale,
  transactionId,
}: TransactionActionsProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEnglish = locale === "en";

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    try {
      const formData = new FormData();

      formData.set("locale", locale);
      formData.set("transaction_id", transactionId);

      await deleteTransaction(formData);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : isEnglish
            ? "Unable to delete this transaction. Please try again."
            : "Não foi possível excluir este lançamento. Tente novamente.";

      setError(message);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/${locale}/transactions/${transactionId}/edit`}
        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
      >
        {isEnglish ? "Edit" : "Editar"}
      </Link>

      {!showDeleteConfirmation ? (
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setError(null);
            setShowDeleteConfirmation(true);
          }}
          className="inline-flex h-8 items-center justify-center rounded-md border border-rose-900/50 bg-rose-950/20 px-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEnglish ? "Delete" : "Excluir"}
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex h-8 items-center justify-center rounded-md bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting
              ? isEnglish
                ? "Deleting..."
                : "Excluindo..."
              : isEnglish
                ? "Confirm deletion"
                : "Confirmar exclusão"}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setError(null);
              setShowDeleteConfirmation(false);
            }}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEnglish ? "Cancel" : "Cancelar"}
          </button>
        </>
      )}

      {error ? (
        <p className="w-full text-right text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}