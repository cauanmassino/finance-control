import createIntlMiddleware from "next-intl/middleware";
import {NextResponse, type NextRequest} from "next/server";
import {routing} from "./i18n/routing";
import {updateSession} from "./lib/supabase/update-session";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Resolve locale e possíveis redirects do next-intl.
  const intlResponse = intlMiddleware(request);

  // 2. Atualiza/renova a sessão Supabase por meio de cookies.
  const authResponse = await updateSession(request);

  // Se a camada i18n tiver emitido redirect ou rewrite, ela precisa vencer.
  const isRedirect =
    intlResponse.headers.get("location") !== null ||
    intlResponse.status === 307 ||
    intlResponse.status === 308;

  if (isRedirect) {
    return intlResponse;
  }

  // Propaga cookies de auth à resposta associada ao fluxo de locale.
  authResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Exclui arquivos estáticos e os caminhos internos do Next,
     * mantendo o proxy ativo para rotas de app e autenticação.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};