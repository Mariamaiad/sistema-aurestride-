import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-site flex min-h-dvh flex-col items-start justify-center py-24">
      <p className="eyebrow">Erro 404</p>
      <h1 className="display mt-3 text-5xl text-paper">Página não encontrada</h1>
      <p className="mt-4 text-mist">O endereço pode ter mudado ou o conteúdo não está mais disponível.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Voltar ao início
      </Link>
    </main>
  );
}
