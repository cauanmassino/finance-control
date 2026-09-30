export default function Loading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-48 rounded-md bg-muted" />
          <div className="mt-3 h-5 w-80 max-w-full rounded-md bg-muted" />
        </div>

        <div className="h-10 w-40 rounded-md bg-muted" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 4}).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-5"
          >
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="mt-3 h-8 w-36 rounded bg-muted" />
            <div className="mt-3 h-3 w-44 rounded bg-muted" />
          </div>
        ))}
      </section>

      <section className="rounded-xl border">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="mt-2 h-4 w-64 rounded bg-muted" />
          </div>

          <div className="h-5 w-20 rounded bg-muted" />
        </div>

        <div className="divide-y">
          {Array.from({length: 5}).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />

                <div>
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="mt-2 h-3 w-56 rounded bg-muted" />
                </div>
              </div>

              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}