import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminPreviewMode } from "@/lib/admin/data";
import { createSessionClient, getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { signOut } from "@/app/admin/actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (adminPreviewMode) {
    return (
      <AdminShell email="pré-visualização" preview>
        {children}
      </AdminShell>
    );
  }

  if (!isSupabaseConfigured) redirect("/admin/login");

  const admin = await getAdmin();
  if (!admin) {
    const supabase = await createSessionClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!data.user) redirect("/admin/login");
    // Logado, mas sem permissão de administrador.
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080d18] px-5">
        <div className="max-w-md rounded-2xl border border-white/10 bg-ink p-6 text-sm leading-relaxed text-mist">
          <h1 className="text-lg font-semibold text-paper">Acesso não autorizado</h1>
          <p className="mt-2">
            A conta <strong className="text-paper">{data.user.email}</strong> não está cadastrada como administradora. Peça a quem configurou o
            site para incluí-la (veja o README).
          </p>
          <form action={signOut} className="mt-5">
            <button type="submit" className="btn btn-outline">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <AdminShell email={admin.user.email ?? ""}>{children}</AdminShell>;
}
