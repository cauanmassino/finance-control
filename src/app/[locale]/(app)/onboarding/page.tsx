import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {OnboardingForm} from "./onboarding-form";

type OnboardingPageProps = {
  params: Promise<{locale: string}>;
};

type Profile = {
  full_name: string | null;
  currency_code: "BRL" | "USD" | "EUR" | null;
  onboarding_completed: boolean | null;
};

export default async function OnboardingPage({
  params,
}: OnboardingPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: profile, error} = await supabase
    .from("profiles")
    .select("full_name, currency_code, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      locale === "en"
        ? "Unable to load your initial setup."
        : "Não foi possível carregar sua configuração inicial.",
    );
  }

  const typedProfile = profile as Profile | null;

  if (typedProfile?.onboarding_completed) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <OnboardingForm
      locale={locale}
      fullName={typedProfile?.full_name ?? user.user_metadata.full_name ?? null}
      defaultCurrency={typedProfile?.currency_code ?? (locale === "en" ? "USD" : "BRL")}
    />
  );
}