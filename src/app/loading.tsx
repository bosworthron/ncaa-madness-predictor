// src/app/loading.tsx
export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-16 bg-slate-800 rounded animate-pulse mb-1" />
            {[...Array(8)].map((_, j) => (
              <div key={j} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
