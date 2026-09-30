"use client";

import {useState} from "react";
import {deleteTransfer} from "@/app/[locale]/(app)/transactions/manage-actions";

type TransferActionsProps = {
  locale: string;
  transferId: string;
};

export function TransferActions({
  locale,
  transferId,
}: TransferActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isEnglish = locale === "en";

  async function handleDelete() {
    const confirmed = window.confirm(
      isEnglish
        ? "Do you really want to delete this transfer?"
        : "Tem certeza de que deseja excluir esta transferência?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();

      formData.set("locale", locale);
      formData.set("transfer_id", transferId);

      await deleteTransfer(formData);

      window.location.reload();
    } catch {
      window.alert(
        isEnglish
          ? "Unable to delete this transfer. Please try again."
          : "Não foi possível excluir esta transferência. Tente novamente.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting
        ? isEnglish
          ? "Deleting..."
          : "Excluindo..."
        : isEnglish
          ? "Delete"
          : "Excluir"}
    </button>
  );
}