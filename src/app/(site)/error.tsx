"use client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-site flex min-h-[70dvh] flex-col items-start justify-center py-24">
      <p className="eyebrow">Algo deu errado</p>
      <h1 className="display mt-3 text-4xl text-paper">Não foi possível carregar esta página</h1>
      <p className="mt-4 text-mist">Tente novamente em alguns instantes.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Tentar novamente
      </button>
    </div>
  );
}
