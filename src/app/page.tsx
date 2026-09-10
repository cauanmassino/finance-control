import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            Finance Control
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Controle seu dinheiro com mais clareza.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Organize suas receitas, despesas, contas e cartões em uma única
            plataforma financeira.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Começar agora
            </Button>

            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
            >
              Conhecer a plataforma
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">Visão mensal</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Acompanhe receitas, despesas e saldo do mês.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Entenda para onde seu dinheiro está indo.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80 text-white">
            <CardHeader>
              <CardTitle className="text-base">Cartões e parcelas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Controle compras parceladas e compromissos futuros.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}