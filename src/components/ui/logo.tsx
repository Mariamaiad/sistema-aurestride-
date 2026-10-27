/* eslint-disable @next/next/no-img-element */

/** Marca: logo enviado pelo painel ou, na falta dele, o símbolo + nome. */
export function Logo({ name, logoUrl, className = "" }: { name: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`h-9 w-auto ${className}`} />;
  }
  const [first, ...rest] = name.split(" ");
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 text-electric" />
      <span className="leading-none">
        <span className="block text-[1.05rem] font-semibold tracking-tight text-paper">{first}</span>
        {rest.length > 0 && (
          <span className="mt-0.5 block text-[0.62rem] font-medium uppercase tracking-[0.32em] text-mist">
            {rest.join(" ")}
          </span>
        )}
      </span>
    </span>
  );
}

/** Símbolo: um "A" formado por um passo ascendente — "stride". */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M8 23 L16 8 L24 23" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 18.5 H17.5 L20.5 15" fill="none" stroke="#F8FAFC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
