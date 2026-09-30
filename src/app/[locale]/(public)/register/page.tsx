import {redirect} from "next/navigation";
import {RegisterForm} from "./register-form";

type RegisterPageProps = {
  params: Promise<{locale: string}>;
};

export default async function RegisterPage({
  params,
}: RegisterPageProps) {
  const {locale} = await params;

  if (locale !== "pt" && locale !== "en") {
    redirect("/pt");
  }

  return <RegisterForm locale={locale} />;
}