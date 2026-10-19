import {NextRequest} from "next/server";
import {revalidatePath} from "next/cache";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

import {
  friendlyProposalError,
  proposalFields,
  toReviewable,
} from "@/lib/copilot/proposals-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
};

const resolveInputSchema = z
  .object({
    proposalId: z.string().uuid(),
    action: z.enum(["confirm", "cancel"]),
    reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
    locale: z.enum(["pt", "en"]),
  })
  .strict();

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        {error: "Entre novamente na sua conta."},
        {status: 401, headers: noStoreHeaders},
      );
    }

    const {data, count, error} = await supabase
      .from("copilot_transaction_proposals")
      .select(proposalFields, {count: "exact"})
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", {ascending: false})
      .order("id", {ascending: true})
      .limit(20);

    if (error || count === null) {
      console.error(
        "[FINCO] Falha ao consultar propostas.",
      );

      return Response.json(
        {
          error:
            "Não foi possível consultar as propostas. Confira a instalação da migração e dos arquivos.",
        },
        {status: 503, headers: noStoreHeaders},
      );
    }

    return Response.json(
      {
        proposals: (data ?? []).map((item) =>
          toReviewable(item),
        ),
        totalPending: count,
      },
      {headers: noStoreHeaders},
    );
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível carregar ou validar a lista de propostas.",
      },
      {status: 500, headers: noStoreHeaders},
    );
  }
}

export async function POST(request: NextRequest) {
  const receivedOrigin = request.headers.get("origin");

  const configuredOrigin =
    process.env.FINCO_APP_ORIGIN?.trim();

  if (!configuredOrigin) {
    return Response.json(
      {
        error:
          "Configure FINCO_APP_ORIGIN no .env.local.",
      },
      {status: 503, headers: noStoreHeaders},
    );
  }

  let expectedOrigin: string;

  try {
    const configuredUrl = new URL(configuredOrigin);

    if (
      configuredUrl.protocol !== "http:" &&
      configuredUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid origin protocol.");
    }

    expectedOrigin = configuredUrl.origin;
  } catch {
    return Response.json(
      {error: "FINCO_APP_ORIGIN está inválido."},
      {status: 500, headers: noStoreHeaders},
    );
  }

  if (!receivedOrigin || receivedOrigin !== expectedOrigin) {
    console.warn("[FINCO] Origem das propostas recusada:", {
      receivedOrigin,
      expectedOrigin,
    });

    return Response.json(
      {
        error:
          "Origem das propostas recusada. Confira FINCO_APP_ORIGIN e reinicie o servidor.",
      },
      {status: 403, headers: noStoreHeaders},
    );
  }

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > 4096) {
      return Response.json(
        {error: "A requisição excedeu o tamanho permitido."},
        {status: 413, headers: noStoreHeaders},
      );
    }

    let decodedBody: unknown;

    try {
      decodedBody = JSON.parse(rawBody);
    } catch {
      return Response.json(
        {error: "O conteúdo enviado não é JSON válido."},
        {status: 400, headers: noStoreHeaders},
      );
    }

    const parsed = resolveInputSchema.safeParse(decodedBody);

    if (!parsed.success) {
      return Response.json(
        {error: "Confira os dados da confirmação."},
        {status: 400, headers: noStoreHeaders},
      );
    }

    const input = parsed.data;
    const supabase = await createClient();

    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        {error: "Entre novamente na sua conta."},
        {status: 401, headers: noStoreHeaders},
      );
    }

    const {data: current, error: lookupError} = await supabase
      .from("copilot_transaction_proposals")
      .select(proposalFields)
      .eq("id", input.proposalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return Response.json(
        {error: "Não foi possível conferir a proposta."},
        {status: 503, headers: noStoreHeaders},
      );
    }

    if (!current) {
      return Response.json(
        {
          error:
            "Proposta não encontrada ou sem permissão.",
        },
        {status: 404, headers: noStoreHeaders},
      );
    }

    const proposal = toReviewable(current);

    if (proposal.reviewHash !== input.reviewHash) {
      return Response.json(
        {
          error:
            "Os dados revisados não correspondem à proposta atual. Atualize a lista antes de continuar.",
        },
        {status: 409, headers: noStoreHeaders},
      );
    }

    const rpcName =
      proposal.payment_method === "credit_card"
        ? "resolve_copilot_card_purchase_v1"
        : "resolve_copilot_transaction_v1";

    const {data: resolvedData, error: resolveError} =
      await supabase.rpc(rpcName, {
        p_proposal_id: proposal.id,
        p_action: input.action,
      });

    if (resolveError) {
      return Response.json(
        {
          error: friendlyProposalError(resolveError.message),
        },
        {status: 409, headers: noStoreHeaders},
      );
    }

    const resolved = toReviewable(resolvedData);

    if (resolved.id !== proposal.id) {
      throw new Error("Unexpected proposal result.");
    }

    if (
      input.action === "confirm" &&
      (
        resolved.status !== "confirmed" ||
        !resolved.transaction_id
      )
    ) {
      throw new Error("Confirmation was not verified.");
    }

    if (
      input.action === "cancel" &&
      resolved.status !== "cancelled"
    ) {
      throw new Error("Cancellation was not verified.");
    }

    let refreshWarning = false;

    if (resolved.status === "confirmed") {
      try {
        const paths = [
          "dashboard",
          "accounts",
          "transactions",
          "reports",
          "budgets",
          "financial-health",
          "cards",
        ];

        for (const path of paths) {
          revalidatePath(`/${input.locale}/${path}`);
        }

        if (
          resolved.credit_card_id &&
          resolved.credit_card_statement_id
        ) {
          revalidatePath(
            `/${input.locale}/cards/${resolved.credit_card_id}/statements/${resolved.credit_card_statement_id}`,
          );
        }
      } catch {
        refreshWarning = true;

        console.error(
          "[FINCO] Operação confirmada, mas a revalidação falhou.",
        );
      }
    }

    return Response.json(
      {
        proposal: resolved,
        refreshWarning,
      },
      {headers: noStoreHeaders},
    );
  } catch {
    console.error(
      "[FINCO] Não foi possível validar o resultado da operação.",
    );

    return Response.json(
      {
        error:
          "Não foi possível confirmar o resultado. Confira os lançamentos e atualize as propostas antes de preparar outra.",
      },
      {status: 500, headers: noStoreHeaders},
    );
  }
}