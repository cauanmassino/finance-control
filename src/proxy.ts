import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

function getLocale(pathname: string) {
  return pathname.split("/")[1] === "en" ? "en" : "pt";
}

function isPublicPath(pathname: string) {
  return (
    /^\/(pt|en)\/?$/.test(pathname) ||
    /^\/(pt|en)\/auth\/login\/?$/.test(pathname) ||
    /^\/(pt|en)\/register\/?$/.test(pathname) ||
    /^\/(pt|en)\/auth\/callback\/?$/.test(pathname)
  );
}

function isProtectedPath(pathname: string) {
  return /^\/(pt|en)\/(accounts|alerts|budgets|cards|categories|dashboard|financial-health|goals|onboarding|recurring|reports|transactions|transfers)(\/|$)/.test(
    pathname,
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({request});

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({request});

          cookiesToSet.forEach(({name, value, options}) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: {user},
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const locale = getLocale(pathname);
  const loginUrl = new URL(`/${locale}/auth/login`, request.url);
  const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);

  if (!user && isProtectedPath(pathname)) {
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  const isLocaleHome = /^\/(pt|en)\/?$/.test(pathname);

  if (user && isPublicPath(pathname) && !isLocaleHome) {
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};