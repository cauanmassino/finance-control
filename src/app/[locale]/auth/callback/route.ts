import {type NextRequest, NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: {params: Promise<{locale: string}>}
) {
  const {locale} = await context.params;
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const safeLocale = locale === "en" ? "en" : "pt";

  return NextResponse.redirect(new URL(`/${safeLocale}/dashboard`, requestUrl.origin));
    new URL(`/${safeLocale}/dashboard`, requestUrl.origin)
}