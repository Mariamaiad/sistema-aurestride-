-- =============================================================
-- Segurança: função de administrador + Row Level Security
-- Visitantes: leem apenas o que está ativo/visível/publicado.
-- Administradores: leem e alteram tudo.
-- Leads: inseridos apenas pelo servidor (service role), lidos por admins.
-- =============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins             enable row level security;
alter table public.site_settings      enable row level security;
alter table public.team_members       enable row level security;
alter table public.services           enable row level security;
alter table public.marketing_plans    enable row level security;
alter table public.plan_items         enable row level security;
alter table public.web_pricing        enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.project_images     enable row level security;
alter table public.process_steps      enable row level security;
alter table public.faqs               enable row level security;
alter table public.media              enable row level security;
alter table public.leads              enable row level security;

-- Admins: cada um enxerga apenas o próprio registro. Inclusão de novos
-- administradores é feita pelo SQL Editor do Supabase (ver README).
create policy "admins_self_read" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Configurações: leitura pública, escrita só admin
create policy "settings_public_read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "settings_admin_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Equipe
create policy "team_public_read" on public.team_members
  for select to anon, authenticated using (visible or public.is_admin());
create policy "team_admin_write" on public.team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Serviços
create policy "services_public_read" on public.services
  for select to anon, authenticated using (active or public.is_admin());
create policy "services_admin_write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Planos
create policy "plans_public_read" on public.marketing_plans
  for select to anon, authenticated using (active or public.is_admin());
create policy "plans_admin_write" on public.marketing_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "plan_items_public_read" on public.plan_items
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.marketing_plans p where p.id = plan_id and p.active
    )
  );
create policy "plan_items_admin_write" on public.plan_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Preços web
create policy "web_pricing_public_read" on public.web_pricing
  for select to anon, authenticated using (active or public.is_admin());
create policy "web_pricing_admin_write" on public.web_pricing
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Portfólio: rascunhos visíveis apenas para admins
create policy "projects_public_read" on public.portfolio_projects
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "projects_admin_write" on public.portfolio_projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "project_images_public_read" on public.project_images
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'published'
    )
  );
create policy "project_images_admin_write" on public.project_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Etapas e FAQ
create policy "steps_public_read" on public.process_steps
  for select to anon, authenticated using (active or public.is_admin());
create policy "steps_admin_write" on public.process_steps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "faqs_public_read" on public.faqs
  for select to anon, authenticated using (active or public.is_admin());
create policy "faqs_admin_write" on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Mídia: somente admins (as imagens em si são públicas no bucket)
create policy "media_admin_all" on public.media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Leads: nenhuma política de insert para anon/authenticated.
-- O servidor grava usando a service role (que ignora RLS) após validar.
create policy "leads_admin_read" on public.leads
  for select to authenticated using (public.is_admin());
create policy "leads_admin_update" on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "leads_admin_delete" on public.leads
  for delete to authenticated using (public.is_admin());
