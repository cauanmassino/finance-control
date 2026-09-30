export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl animate-pulse">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-32 rounded-md bg-muted" />
          <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-muted" />
        </div>

        <div className="h-10 w-36 rounded-md bg-muted" />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {Array.from({length: 2}).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className="rounded-xl border p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-24 rounded bg-muted" />
              <div className="h-6 w-8 rounded-full bg-muted" />
            </div>

            <div className="space-y-3">
              {Array.from({length: 4}).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted" />

                    <div>
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="mt-2 h-3 w-16 rounded bg-muted" />
                    </div>
                  </div>

                  <div className="h-8 w-32 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}