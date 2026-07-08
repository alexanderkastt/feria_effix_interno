// Avatar del logo de un stand/marca. Mismo componente en el link público del
// cliente y en el panel interno para que se vea igual en los dos lados — y
// para reusarlo tal cual cuando se construya el directorio de marcas.
export function StandAvatar({
  logoUrl,
  nombre,
  size = 40,
}: {
  logoUrl: string | null;
  nombre: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={nombre ? `Logo de ${nombre}` : "Logo"}
        className="shrink-0 rounded-full border border-border bg-white object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const inicial = (nombre ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full border border-border bg-surface-2 font-semibold text-muted"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {inicial}
    </div>
  );
}
