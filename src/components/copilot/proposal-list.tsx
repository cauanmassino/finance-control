"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {useRouter} from "next/navigation";
import {z} from "zod";

import {
  proposalSchema,
  type ReviewableProposal,
} from "@/lib/copilot/proposal-types";

type ProposalListProps = {
  locale: string;
  isBusy: boolean;
  refreshKey: number;
};

const reviewableProposalSchema = proposalSchema.extend({
  reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
});

const proposalListResponseSchema = z.object({
  proposals: z.array(reviewableProposalSchema),
  totalPending: z.number().int().nonnegative(),
});

const resolveResponseSchema = z.object({
  proposal: reviewableProposalSchema,
  refreshWarning: z.boolean().optional(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;
}

function responseError(value: unknown, fallback: string) {
  const parsed = errorResponseSchema.safeParse(value);

  return parsed.success
    ? parsed.data.error
    : fallback;
}

export function ProposalList({
  locale,
  isBusy,
  refreshKey,
}: ProposalListProps) {
  const router = useRouter();

  const [proposals, setProposals] = useState<ReviewableProposal[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());

  const requestNumber = useRef(0);
  const workingRef = useRef(false);
  const refreshController = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (workingRef.current) return;

    refreshController.current?.abort();

    const controller = new AbortController();
    refreshController.current = controller;

    const number = ++requestNumber.current;

    setLoading(true);

    try {
      const response = await fetch("/api/copilot/proposals", {
        cache: "no-store",
        signal: controller.signal,
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          responseError(
            result,
            "Não foi possível consultar as propostas.",
          ),
        );
      }

      const parsed = proposalListResponseSchema.safeParse(result);

      if (!parsed.success) {
        throw new Error(
          "O servidor retornou uma lista de propostas inválida.",
        );
      }

      if (number !== requestNumber.current) return;

      setProposals(parsed.data.proposals);
      setTotalPending(parsed.data.totalPending);
      setError(null);
      setClock(Date.now());
    } catch (caughtError) {
      if (
        controller.signal.aborted ||
        number !== requestNumber.current
      ) {
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível consultar as propostas.",
      );
    } finally {
      if (number === requestNumber.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isBusy) {
      void refresh();
    }
  }, [isBusy, refreshKey, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 15_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      requestNumber.current += 1;
      refreshController.current?.abort();
    };
  }, []);

  const resolve = async (
    proposal: ReviewableProposal,
    action: "confirm" | "cancel",
  ) => {
    if (
      workingRef.current ||
      isBusy ||
      loading
    ) {
      return;
    }

    workingRef.current = true;
    requestNumber.current += 1;

    refreshController.current?.abort();

    setWorkingId(proposal.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/copilot/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          action,
          reviewHash: proposal.reviewHash,
          locale: locale === "en" ? "en" : "pt",
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          responseError(
            result,
            "Não foi possível processar a proposta.",
          ),
        );
      }

      const parsed = resolveResponseSchema.safeParse(result);

      if (!parsed.success) {
        throw new Error(
          "Não foi possível validar o resultado. Confira os lançamentos antes de repetir a operação.",
        );
      }

      const resolved = parsed.data.proposal;

      if (
        action === "confirm" &&
        (
          resolved.status !== "confirmed" ||
          !resolved.transaction_id
        )
      ) {
        throw new Error(
          "O servidor não confirmou a gravação. Confira os lançamentos antes de repetir.",
        );
      }

      if (
        action === "cancel" &&
        resolved.status !== "cancelled"
      ) {
        throw new Error(
          "O servidor não confirmou o cancelamento.",
        );
      }

      setProposals((current) =>
        current.map((item) =>
          item.id === resolved.id
            ? resolved
            : item,
        ),
      );

      setTotalPending((current) =>
        Math.max(0, current - 1),
      );

      if (resolved.status === "confirmed") {
        const warning = parsed.data.refreshWarning
          ? " Atualize a página para conferir os totais."
          : "";

        setNotice(
          `Lançamento confirmado. ID: ${resolved.transaction_id}.${warning}`,
        );

        router.refresh();
      } else {
        setNotice(
          "Proposta cancelada. Nenhum lançamento foi criado por ela.",
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível confirmar o resultado. Confira os lançamentos antes de tentar novamente.",
      );
    } finally {
      workingRef.current = false;
      setWorkingId(null);
    }
  };

  return (
    <section
      aria-label="Propostas para revisar"
      className="min-w-0 space-y-3 border-t border-white/10 pt-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Propostas para revisar
        </h3>

        <button
          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            isBusy ||
            loading ||
            workingId !== null
          }
          onClick={() => {
            void refresh();
          }}
          type="button"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-400">
        Esta lista vem do banco, não do texto da IA.
        Somente o botão de confirmação registra o lançamento.
      </p>

      {error ? (
        <p
          className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs leading-5 text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p
          className="wrap-break-word rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-xs leading-5 text-emerald-100"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {proposals.length === 0 && !loading && !error ? (
        <p className="text-xs text-slate-500">
          Nenhuma proposta pendente.
        </p>
      ) : null}

      {totalPending > 20 ? (
        <p className="text-xs leading-5 text-amber-200">
          Exibindo as 20 propostas pendentes mais recentes.
          Resolva algumas e atualize para ver as demais.
        </p>
      ) : null}

      {proposals.map((proposal) => {
        const expired =
          Date.parse(proposal.expires_at) <= clock;

        const pending =
          proposal.status === "pending";

        const disabled =
          isBusy ||
          loading ||
          workingId !== null;

        const isProcessing =
          workingId === proposal.id;

        return (
          <article
            className="min-w-0 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4"
            key={proposal.id}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-white">
                {proposal.type === "income"
                  ? "Receita"
                  : "Despesa"}
              </h4>

              <span className="text-sm font-semibold tabular-nums text-emerald-200">
                {currency.format(proposal.amount)}
              </span>
            </div>

            <dl className="mt-3 space-y-2 wrap-break-word text-xs leading-5 text-slate-300">
              <div>
                <dt className="inline text-slate-500">
                  Descrição:{" "}
                </dt>
                <dd className="inline">
                  {proposal.description}
                </dd>
              </div>

              <div>
                <dt className="inline text-slate-500">
                  Conta:{" "}
                </dt>
                <dd className="inline">
                  {proposal.account_name}
                </dd>
              </div>

              <div>
                <dt className="inline text-slate-500">
                  Categoria:{" "}
                </dt>
                <dd className="inline">
                  {proposal.category_name ?? "Sem categoria"}
                </dd>
              </div>

              <div>
                <dt className="inline text-slate-500">
                  Data:{" "}
                </dt>
                <dd className="inline">
                  {dateLabel(proposal.occurred_on)}
                </dd>
              </div>

              <div>
                <dt className="inline text-slate-500">
                  Pagamento:{" "}
                </dt>
                <dd className="inline">
                  Movimentação em conta, marcada como paga
                </dd>
              </div>

              {proposal.notes ? (
                <div>
                  <dt className="inline text-slate-500">
                    Observações:{" "}
                  </dt>
                  <dd className="inline">
                    {proposal.notes}
                  </dd>
                </div>
              ) : null}
            </dl>

            {pending ? (
              <>
                <p className="mt-3 text-xs leading-5 text-amber-200">
                  {expired
                    ? "Proposta expirada. Cancele e prepare uma nova."
                    : "Revise todos os dados. Confirmar cria um lançamento real no FINCO, mas não movimenta dinheiro no banco."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={disabled || expired}
                    onClick={() => {
                      void resolve(proposal, "confirm");
                    }}
                    type="button"
                  >
                    {isProcessing
                      ? "Processando..."
                      : "Confirmar lançamento"}
                  </button>

                  <button
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={disabled}
                    onClick={() => {
                      void resolve(proposal, "cancel");
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs text-emerald-200">
                {proposal.status === "confirmed"
                  ? "Lançamento confirmado."
                  : "Proposta cancelada."}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}