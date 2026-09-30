export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-32 rounded-md bg-muted" />
          <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-muted" />
        </div>

        <div className="h-10 w-36 rounded-md bg-muted" />
      </div>

      <section className="rounded-xl border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-2 h-10 w-full rounded-md bg-muted" />
          </div>

          <div className="h-10 w-32 rounded-md bg-muted" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {Array.from({length: 2}).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-5"
          >
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-3 h-9 w-40 rounded bg-muted" />
            <div className="mt-3 h-4 w-48 rounded bg-muted" />
          </div>
        ))}
      </section>

      <section className="rounded-xl border">
        <div className="border-b p-5">
          <div className="h-6 w-56 rounded bg-muted" />
          <div className="mt-2 h-4 w-80 max-w-full rounded bg-muted" />
        </div>

        <div className="divide-y">
          {Array.from({length: 5}).map((_, index) => (
            <div key={index} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />

                  <div>
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="mt-2 h-3 w-12 rounded bg-muted" />
                  </div>
                </div>

                <div className="h-5 w-20 rounded bg-muted" />
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}