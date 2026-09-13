import {getTranslations} from "next-intl/server";
import Link from "next/link";

import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type HomeProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Home({params}: HomeProps) {
  const {locale} = await params;
  const t = await getTranslations("Home");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            {t("eyebrow")}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            {t("title")}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/register`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400"
            >
              {t("primaryAction")}
            </Link>

            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
            >
              {t("secondaryAction")}
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">
                {t("monthlyTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              {t("monthlyDescription")}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">
                {t("categoriesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              {t("categoriesDescription")}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">
                {t("cardsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              {t("cardsDescription")}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}