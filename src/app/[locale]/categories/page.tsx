import Link from "next/link";
import {redirect} from "next/navigation";
import {FolderPlus, Trash2, WalletCards} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/server";

import {createCategory, deleteCategory} from "./actions";

type CategoriesPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  kind: "income" | "expense" | "transfer";
  color: string;
  parent_id: string | null;
};

function categoryKindLabel(kind: Category["kind"], isEnglish: boolean) {
  const labels = {
    income: isEnglish ? "Income" : "Receita",
    expense: isEnglish ? "Expense" : "Despesa",
    transfer: isEnglish ? "Transfer" : "Transferência"
  };

  return labels[kind];
}

function categoryKindClasses(kind: Category["kind"]) {
  const classes = {
    income: "border-emerald-900 bg-emerald-950/50 text-emerald-300",
    expense: "border-rose-900 bg-rose-950/50 text-rose-300",
    transfer: "border-sky-900 bg-sky-950/50 text-sky-300"
  };

  return classes[kind];
}

export default async function CategoriesPage({
  params,
  searchParams
}: CategoriesPageProps) {
  const {locale} = await params;
  const {error: errorMessage, message} = await searchParams;

  const safeLocale = locale === "en" ? "en" : "pt";
  const isEnglish = safeLocale === "en";

  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const {data, error} = await supabase
    .from("categories")
    .select("id, name, kind, color, parent_id")
    .eq("user_id", user.id)
    .order("kind", {ascending: true})
    .order("name", {ascending: true});

  if (error) {
    console.error("Could not load categories:", error.message);
  }

  const categories = (data ?? []) as Category[];

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/${safeLocale}/dashboard`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <WalletCards className="h-4 w-4" />
              {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
            </Link>

            <p className="mt-5 text-sm font-medium text-emerald-400">
              {isEnglish ? "Financial organization" : "Organização financeira"}
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {isEnglish ? "Categories" : "Categorias"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Create categories to classify your income, expenses, and transfers."
                : "Crie categorias para classificar suas receitas, despesas e transferências."}
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="h-fit border-slate-800 bg-slate-900/70 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderPlus className="h-4 w-4 text-emerald-400" />
                {isEnglish ? "New category" : "Nova categoria"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form action={createCategory} className="space-y-4">
                <input type="hidden" name="locale" value={safeLocale} />

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {isEnglish ? "Category name" : "Nome da categoria"}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    maxLength={60}
                    placeholder={isEnglish ? "e.g. Groceries" : "Ex.: Alimentação"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kind">
                    {isEnglish ? "Type" : "Tipo"}
                  </Label>
                  <select
                    id="kind"
                    name="kind"
                    defaultValue="expense"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="expense" className="bg-slate-900">
                      {isEnglish ? "Expense" : "Despesa"}
                    </option>
                    <option value="income" className="bg-slate-900">
                      {isEnglish ? "Income" : "Receita"}
                    </option>
                    <option value="transfer" className="bg-slate-900">
                      {isEnglish ? "Transfer" : "Transferência"}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">
                    {isEnglish ? "Color" : "Cor"}
                  </Label>

                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue="#10B981"
                      className="h-10 w-16 cursor-pointer p-1"
                    />
                    <p className="text-xs leading-5 text-slate-400">
                      {isEnglish
                        ? "This color will identify the category in charts."
                        : "Esta cor identificará a categoria nos gráficos."}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  {isEnglish ? "Create category" : "Criar categoria"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {isEnglish ? "Your categories" : "Suas categorias"}
              </CardTitle>

              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                {categories.length}
              </span>
            </CardHeader>

            <CardContent>
              {errorMessage ? (
                <p className="mb-4 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              {message ? (
                <p className="mb-4 rounded-md border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
                  {message}
                </p>
              ) : null}

              {categories.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 p-8 text-center">
                  <FolderPlus className="h-8 w-8 text-slate-600" />
                  <h2 className="mt-4 text-sm font-medium text-slate-200">
                    {isEnglish ? "No categories yet" : "Nenhuma categoria ainda"}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {isEnglish
                      ? "Create your first category using the form on the left."
                      : "Crie sua primeira categoria usando o formulário ao lado."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-4"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{backgroundColor: category.color}}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {category.name}
                        </p>
                        <span
                          className={[
                            "mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs",
                            categoryKindClasses(category.kind)
                          ].join(" ")}
                        >
                          {categoryKindLabel(category.kind, isEnglish)}
                        </span>
                      </div>

                      <form action={deleteCategory}>
                        <input
                          type="hidden"
                          name="locale"
                          value={safeLocale}
                        />
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="text-slate-400 hover:bg-rose-950/50 hover:text-rose-300"
                          aria-label={
                            isEnglish
                              ? `Delete ${category.name}`
                              : `Excluir ${category.name}`
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}