import type { Metadata } from "next";

// O painel depende da sessão do usuário: nunca gerar como página estática.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Aurestride" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
