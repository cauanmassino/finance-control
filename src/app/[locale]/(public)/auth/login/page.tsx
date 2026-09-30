import {redirect} from "next/navigation";
import {LoginForm} from "./login-form";

type LoginPageProps = {
  params: Promise<{locale: string}>;
};

export default async function LoginPage({
  params,
}: LoginPageProps) {
  const {locale} = await params;

  if (locale !== "pt" && locale !== "en") {
    redirect("/pt");
  }

  return <LoginForm locale={locale} />;
}