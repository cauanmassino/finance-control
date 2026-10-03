export default function TestEnvPage() {
  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl font-bold">Teste de variáveis</h1>

      <p className="mt-4">
        URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "não definida"}
      </p>

      <p className="mt-2">
        Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "definida" : "não definida"}
      </p>
    </main>
  );
}