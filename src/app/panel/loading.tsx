// Se muestra automáticamente (streaming de Next.js) mientras el servidor
// resuelve los datos de cualquier página del panel que no tenga su propio
// loading.tsx — evita la pantalla en blanco/congelada durante la navegación.
export default function PanelLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded-md bg-surface-2" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border bg-surface-2"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-2" />
    </div>
  );
}
