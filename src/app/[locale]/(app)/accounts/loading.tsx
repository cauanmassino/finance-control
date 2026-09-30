export default function Loading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-28 rounded-md bg-muted" />
          <div className="mt-3 h-5 w-80 max-w-full rounded-md bg-muted" />
        </div>

        <div className="h-10 w-32 rounded-md bg-muted" />
      </div>

      <section className="rounded-xl border p-5">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="mt-3 h-9 w-48 rounded bg-muted" />
        <div className="mt-3 h-3 w-72 max-w-full rounded bg-muted" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({length: 6}).map((_, index) => (
          <article
            key={index}
            className="rounded-xl border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />

              <div>
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="mt-2 h-3 w-24 rounded bg-muted" />
              </div>
            </div>

            <div className="mt-6">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-2 h-8 w-36 rounded bg-muted" />
            </div>

            <div className="mt-5 h-9 w-44 rounded bg-muted" />
          </article>
        ))}
      </section>
    </main>
  );
}