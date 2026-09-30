"use client";

import Link from "next/link";
import {useActionState, useState} from "react";
import {deleteAccount} from "@/app/[locale]/(app)/accounts/actions";

type AccountActionsProps = {
  locale: string;
  accountId: string;
};

export function AccountActions({
  locale,
  accountId,
}: AccountActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const [state, formAction, isPending] = useActionState(deleteAccount, {
    error: undefined,
  });

  return (
    <div className="mt-5 border-t pt-4">
      {state.error ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}

      {isConfirming ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <input type="hidden" name="account_id" value={accountId} />

          <p className="text-sm text-muted-foreground">
            Excluir esta conta? Os lançamentos existentes serão mantidos, mas
            ficarão sem conta vinculada.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Excluindo..." : "Confirmar exclusão"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/accounts/${accountId}/edit`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Editar
          </Link>

          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-background px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}