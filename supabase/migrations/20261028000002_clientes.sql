-- =============================================================
-- Gestão de clientes: ficha, tarefas e histórico de atendimento.
-- Dados internos: somente administradores leem e alteram (RLS).
-- =============================================================

create table public.clients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 1 and 160),
  contact_name      text not null default '' check (char_length(contact_name) <= 120),
  segment           text not null default '' check (char_length(segment) <= 120),
  phone             text not null default '' check (char_length(phone) <= 40),
  email             text not null default '' check (char_length(email) <= 200),
  instagram         text not null default '' check (char_length(instagram) <= 200),
  website           text not null default '' check (char_length(website) <= 300),
  status            text not null default 'prospect'
                      check (status in ('prospect', 'onboarding', 'active', 'paused', 'ended')),
  health            text not null default 'good' check (health in ('good', 'attention', 'risk')),
  services          text[] not null default '{}',
  plan              text not null default '' check (char_length(plan) <= 120),
  monthly_value     numeric(10, 2) check (monthly_value is null or monthly_value >= 0),
  billing_day       smallint check (billing_day is null or billing_day between 1 and 31),
  start_date        date,
  renewal_date      date,
  owner             text not null default '' check (char_length(owner) <= 120),
  next_contact      date,
  next_contact_note text not null default '' check (char_length(next_contact_note) <= 300),
  notes             text not null default '' check (char_length(notes) <= 5000),
  lead_id           uuid references public.leads (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index clients_status_idx on public.clients (status);
create index clients_next_contact_idx on public.clients (next_contact) where next_contact is not null;
create unique index clients_lead_unique on public.clients (lead_id) where lead_id is not null;

create table public.client_activities (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  kind         text not null default 'note'
                 check (kind in ('note', 'meeting', 'call', 'whatsapp', 'delivery', 'payment', 'feedback')),
  content      text not null check (char_length(content) between 1 and 3000),
  happened_on  date not null default current_date,
  author_email text,
  created_at   timestamptz not null default now()
);
create index client_activities_client_idx on public.client_activities (client_id, happened_on desc, created_at desc);

create table public.client_tasks (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  due_date   date,
  done       boolean not null default false,
  done_at    timestamptz,
  created_at timestamptz not null default now()
);
create index client_tasks_client_idx on public.client_tasks (client_id, done, due_date);

create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

-- Marca a data de conclusão da tarefa automaticamente.
create or replace function public.set_task_done_at()
returns trigger
language plpgsql
as $$
begin
  if new.done and (tg_op = 'INSERT' or not old.done) then
    new.done_at = now();
  elsif not new.done then
    new.done_at = null;
  end if;
  return new;
end;
$$;
create trigger trg_client_tasks_done before insert or update on public.client_tasks
  for each row execute function public.set_task_done_at();

alter table public.clients           enable row level security;
alter table public.client_activities enable row level security;
alter table public.client_tasks      enable row level security;

create policy "clients_admin_all" on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client_activities_admin_all" on public.client_activities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client_tasks_admin_all" on public.client_tasks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
