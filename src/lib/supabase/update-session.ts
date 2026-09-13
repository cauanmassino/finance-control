import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({name, value, options}) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // Não substitua isto por getSession(): getUser() valida a sessão
  // contra o Supabase Auth antes de autorizar conteúdo protegido.
  await supabase.auth.getUser();

  return response;
}