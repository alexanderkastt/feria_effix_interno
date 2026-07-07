// Wordmark de Feria Effix. El cuadro azul eléctrico es el acento de marca.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold ${className}`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-[13px] font-bold text-white">
        FE
      </span>
      <span className="tracking-tight">
        Feria<span className="text-brand"> Effix</span>
      </span>
    </span>
  );
}
