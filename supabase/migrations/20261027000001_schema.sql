-- =============================================================
-- Aurestride Digital — esquema do conteúdo do site
-- =============================================================


-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- Administradores (quem pode editar o site)
-- -------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Configurações e textos gerais (linha única, conteúdo em JSON)
-- identidade, contatos, SEO, hero, sobre, títulos das seções, rodapé
-- -------------------------------------------------------------
create table public.site_settings (
  id         smallint primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Equipe (Maria, Lukas e futuros membros)
-- -------------------------------------------------------------
create table public.team_members (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  role             text not null default '',
  bio              text not null default '',
  photo_url        text,
  skills           text[] not null default '{}',
  responsibilities text[] not null default '{}',
  visible          boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Serviços (marketing, criação de sites, sistemas web)
-- -------------------------------------------------------------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('marketing', 'web', 'sistemas')),
  title        text not null check (char_length(title) between 1 and 160),
  description  text not null default '',
  deliverables text[] not null default '{}',
  icon         text,
  image_url    text,
  price_label  text,
  notes        text,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index services_category_idx on public.services (category, sort_order);

-- -------------------------------------------------------------
-- Planos de marketing + itens (entregáveis)
-- -------------------------------------------------------------
create table public.marketing_plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  price          numeric(10, 2) check (price is null or price >= 0),
  price_suffix   text not null default '/mês',
  description    text not null default '',
  contents_count integer check (contents_count is null or contents_count >= 0),
  videos_count   integer check (videos_count is null or videos_count >= 0),
  notes          text,
  highlighted    boolean not null default false,
  show_price     boolean not null default true,
  active         boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint videos_within_contents check (
    videos_count is null or contents_count is null or videos_count <= contents_count
  )
);

create table public.plan_items (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references public.marketing_plans (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 300),
  sort_order integer not null default 0
);
create index plan_items_plan_idx on public.plan_items (plan_id, sort_order);

-- -------------------------------------------------------------
-- Tabela de preços de desenvolvimento web
-- -------------------------------------------------------------
create table public.web_pricing (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '',
  price_type   text not null default 'range'
               check (price_type in ('fixed', 'range', 'from', 'on_request')),
  price_min    numeric(10, 2) check (price_min is null or price_min >= 0),
  price_max    numeric(10, 2) check (price_max is null or price_max >= 0),
  price_suffix text not null default '',
  notes        text,
  show_price   boolean not null default true,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint price_range_valid check (
    price_min is null or price_max is null or price_max >= price_min
  )
);

-- -------------------------------------------------------------
-- Portfólio / estudos de caso
-- -------------------------------------------------------------
create table public.portfolio_projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(title) between 1 and 160),
  client       text not null default '',
  category     text not null check (category in ('marketing', 'site', 'sistema')),
  cover_url    text,
  summary      text not null default '',
  challenge    text not null default '',
  solution     text not null default '',
  deliverables text[] not null default '{}',
  results      text,
  external_url text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  sort_order   integer not null default 0,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.project_images (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects (id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  sort_order integer not null default 0
);
create index project_images_project_idx on public.project_images (project_id, sort_order);

-- -------------------------------------------------------------
-- Como funciona (etapas) e FAQ
-- -------------------------------------------------------------
create table public.process_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  active      boolean not null default true,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(question) between 1 and 300),
  answer     text not null default '',
  active     boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Biblioteca de imagens enviadas pelo painel
-- -------------------------------------------------------------
create table public.media (
  id         uuid primary key default gen_random_uuid(),
  path       text not null unique,
  url        text not null,
  alt        text not null default '',
  mime_type  text,
  size_bytes integer,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Leads do formulário de contato
-- -------------------------------------------------------------
create table public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  email      text check (email is null or char_length(email) <= 200),
  phone      text check (phone is null or char_length(phone) <= 40),
  company    text check (company is null or char_length(company) <= 160),
  interest   text check (interest is null or char_length(interest) <= 120),
  message    text not null check (char_length(message) between 5 and 3000),
  ip_hash    text,
  status     text not null default 'new' check (status in ('new', 'contacted', 'archived')),
  created_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_ip_idx on public.leads (ip_hash, created_at desc);

-- Triggers de updated_at
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger trg_team_updated before update on public.team_members
  for each row execute function public.set_updated_at();
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();
create trigger trg_plans_updated before update on public.marketing_plans
  for each row execute function public.set_updated_at();
create trigger trg_web_pricing_updated before update on public.web_pricing
  for each row execute function public.set_updated_at();
create trigger trg_projects_updated before update on public.portfolio_projects
  for each row execute function public.set_updated_at();
create trigger trg_steps_updated before update on public.process_steps
  for each row execute function public.set_updated_at();
create trigger trg_faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- Data de publicação do projeto
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (old is null or old.status is distinct from 'published') then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;
create trigger trg_projects_published before insert or update on public.portfolio_projects
  for each row execute function public.set_published_at();
