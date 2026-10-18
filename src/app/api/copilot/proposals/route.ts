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
        {
          error: "Entre novamente na sua conta.",
        },
        {
          status: 401,
          headers: noStoreHeaders,
        },
      );
    }

    const {
      data,
      count,
      error,
    } = await supabase
      .from("copilot_transaction_proposals")
      .select(proposalFields, {
        count: "exact",
      })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", {
        ascending: false,
      })
      .order("id", {
        ascending: true,
      })
      .limit(20);

    if (error || count === null) {
      console.error(
        "[FINCO Copiloto] Falha ao consultar propostas.",
      );

      return Response.json(
        {
          error:
            "Não foi possível consultar as propostas. Confira a estrutura de propostas no Supabase.",
        },
        {
          status: 503,
          headers: noStoreHeaders,
        },
      );
    }

    const proposals = (data ?? []).map((item) =>
      toReviewable(item),
    );

    return Response.json(
      {
        proposals,
        totalPending: count,
      },
      {
        headers: noStoreHeaders,
      },
    );
  } catch {
    console.error(
      "[FINCO Copiloto] Falha ao carregar propostas.",
    );

    return Response.json(
      {
        error:
          "Não foi possível carregar a lista de propostas.",
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const receivedOrigin =
    request.headers.get("origin");

  const configuredOrigin =
    process.env.FINCO_APP_ORIGIN?.trim();

  if (!configuredOrigin) {
    return Response.json(
      {
        error:
          "Configure FINCO_APP_ORIGIN no .env.local com o endereço usado para abrir o aplicativo.",
      },
      {
        status: 503,
        headers: noStoreHeaders,
      },
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
      {
        error:
          "FINCO_APP_ORIGIN está inválido. Confira o endereço configurado no servidor.",
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }

  if (
    !receivedOrigin ||
    receivedOrigin !== expectedOrigin
  ) {
    console.warn(
      "[FINCO] Origem das propostas recusada:",
      {
        receivedOrigin,
        expectedOrigin,
      },
    );

    return Response.json(
      {
        error:
          "Origem das propostas recusada. Confira FINCO_APP_ORIGIN e reinicie o servidor.",
      },
      {
        status: 403,
        headers: noStoreHeaders,
      },
    );
  }

  try {
    const rawBody = await request.text();

    if (
      new TextEncoder().encode(rawBody).length >
      4096
    ) {
      return Response.json(
        {
          error:
            "A requisição excedeu o tamanho permitido.",
        },
        {
          status: 413,
          headers: noStoreHeaders,
        },
      );
    }

    let decodedBody: unknown;

    try {
      decodedBody = JSON.parse(rawBody);
    } catch {
      return Response.json(
        {
          error:
            "O conteúdo enviado não é um JSON válido.",
        },
        {
          status: 400,
          headers: noStoreHeaders,
        },
      );
    }

    const parsed =
      resolveInputSchema.safeParse(decodedBody);

    if (!parsed.success) {
      return Response.json(
        {
          error:
            "Confira os dados da confirmação.",
        },
        {
          status: 400,
          headers: noStoreHeaders,
        },
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
        {
          error:
            "Entre novamente na sua conta.",
        },
        {
          status: 401,
          headers: noStoreHeaders,
        },
      );
    }

    const {
      data: currentProposal,
      error: lookupError,
    } = await supabase
      .from("copilot_transaction_proposals")
      .select(proposalFields)
      .eq("id", input.proposalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "[FINCO Copiloto] Falha ao conferir proposta.",
      );

      return Response.json(
        {
          error:
            "Não foi possível conferir a proposta. Atualize a lista e tente novamente.",
        },
        {
          status: 503,
          headers: noStoreHeaders,
        },
      );
    }

    if (!currentProposal) {
      return Response.json(
        {
          error:
            "Proposta não encontrada ou sem permissão de acesso.",
        },
        {
          status: 404,
          headers: noStoreHeaders,
        },
      );
    }

    const proposal =
      toReviewable(currentProposal);

    if (
      proposal.reviewHash !== input.reviewHash
    ) {
      return Response.json(
        {
          error:
            "A proposta não corresponde aos dados revisados. Atualize a lista antes de continuar.",
        },
        {
          status: 409,
          headers: noStoreHeaders,
        },
      );
    }

    const {
      data: resolvedData,
      error: resolveError,
    } = await supabase.rpc(
      "resolve_copilot_transaction_v1",
      {
        p_proposal_id: proposal.id,
        p_action: input.action,
      },
    );

    if (resolveError) {
      return Response.json(
        {
          error: friendlyProposalError(
            resolveError.message,
          ),
        },
        {
          status: 409,
          headers: noStoreHeaders,
        },
      );
    }

    const resolved =
      toReviewable(resolvedData);

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
        ];

        for (const path of paths) {
          revalidatePath(
            `/${input.locale}/${path}`,
          );
        }
      } catch {
        refreshWarning = true;

        console.error(
          "[FINCO Copiloto] Operação confirmada, mas a atualização das páginas falhou.",
        );
      }
    }

    return Response.json(
      {
        proposal: resolved,
        refreshWarning,
      },
      {
        headers: noStoreHeaders,
      },
    );
  } catch {
    console.error(
      "[FINCO Copiloto] Não foi possível validar o resultado da operação.",
    );

    return Response.json(
      {
        error:
          "Não foi possível confirmar o resultado. Atualize as propostas e confira os lançamentos antes de preparar outro.",
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }
}