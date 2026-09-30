export default function Loading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-48 rounded-md bg-muted" />
          <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-muted" />
        </div>

        <div className="h-10 w-40 rounded-md bg-muted" />
      </div>

      <section className="rounded-xl border p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({length: 5}).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="mt-2 h-10 w-full rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({length: 3}).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-5"
          >
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-3 h-8 w-36 rounded bg-muted" />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border">
        <div className="divide-y">
          {Array.from({length: 6}).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />

                <div>
                  <div className="h-4 w-44 rounded bg-muted" />
                  <div className="mt-2 h-3 w-64 rounded bg-muted" />
                </div>
              </div>

              <div className="h-5 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}