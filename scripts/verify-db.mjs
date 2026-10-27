// Verifica as migrações, o seed e as políticas de RLS num Postgres embutido (PGlite),
// simulando os esquemas `auth` e `storage` do Supabase. Uso: npm run db:verify
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
};

// --- Simulação mínima do ambiente Supabase ---
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
    bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
`);

const migDir = join(root, "supabase/migrations");
for (const f of readdirSync(migDir).sort()) {
  await db.exec(readFileSync(join(migDir, f), "utf8"));
  ok(true, `migração aplicada: ${f}`);
}
await db.exec(`
  grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`);
await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
ok(true, "seed aplicado");

const count = async (sql) => Number((await db.query(sql)).rows[0].c);

// --- Conteúdo inicial ---
ok((await count("select count(*) c from services where category='marketing'")) === 9, "9 serviços de marketing");
ok((await count("select count(*) c from marketing_plans")) === 3, "3 planos de marketing");
const prices = (await db.query("select price from marketing_plans order by sort_order")).rows.map((r) => Number(r.price));
ok(JSON.stringify(prices) === "[697,1097,1697]", `preços dos planos ${prices.join(", ")}`);
ok((await count("select count(*) c from web_pricing")) === 5, "5 itens de preço web");
ok((await count("select count(*) c from portfolio_projects where slug='ambrozio-car' and status='draft'")) === 1, "Ambrozio Car começa como rascunho");

// --- Usuários de teste ---
const ADMIN = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${ADMIN}', 'maria@teste'), ('${USER}', 'outro@teste');
  insert into admins (user_id, email) values ('${ADMIN}', 'maria@teste');`);

const as = async (role, sub, fn) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.sub', '${sub ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
};
const tryExec = async (sql) => {
  try {
    const r = await db.query(sql);
    return { ok: true, affected: r.affectedRows ?? 0 };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// Visitante anônimo
await as("anon", null, async () => {
  ok((await count("select count(*) c from portfolio_projects")) === 0, "visitante não vê rascunhos do portfólio");
  ok((await count("select count(*) c from marketing_plans")) === 3, "visitante vê planos ativos");
  ok((await count("select count(*) c from leads")) === 0, "visitante não lê leads");
  const ins = await tryExec("insert into leads (name, message) values ('Spam', 'mensagem qualquer')");
  ok(!ins.ok, "visitante não insere leads diretamente");
  const upd = await tryExec("update marketing_plans set price = 1");
  ok(!upd.ok || upd.affected === 0, "visitante não altera preços");
  const st = await tryExec("insert into storage.objects (bucket_id, name) values ('site-media', 'x.jpg')");
  ok(!st.ok, "visitante não envia arquivos");
});

// Usuário autenticado que NÃO é admin
await as("authenticated", USER, async () => {
  const upd = await tryExec("update marketing_plans set price = 1");
  ok(!upd.ok || upd.affected === 0, "usuário comum não altera preços");
  const ins = await tryExec("insert into services (category, title) values ('web', 'Invasor')");
  ok(!ins.ok, "usuário comum não cria serviços");
  const st = await tryExec("insert into storage.objects (bucket_id, name) values ('site-media', 'x.jpg')");
  ok(!st.ok, "usuário comum não envia arquivos");
});

// Admin
await as("authenticated", ADMIN, async () => {
  ok((await count("select count(*) c from portfolio_projects")) === 1, "admin vê rascunhos");
  const upd = await tryExec("update marketing_plans set price = 749 where name = 'Plano Essencial'");
  ok(upd.ok && upd.affected === 1, "admin altera preço");
  const st = await tryExec("insert into storage.objects (bucket_id, name) values ('site-media', 'admin.jpg')");
  ok(st.ok, "admin envia arquivos");
  const pub = await tryExec("update portfolio_projects set status = 'published' where slug = 'ambrozio-car'");
  ok(pub.ok && pub.affected === 1, "admin publica projeto");
});
ok((await count("select count(*) c from portfolio_projects where published_at is not null")) === 1, "data de publicação preenchida");

// Restrições de integridade
const bad = await tryExec("insert into marketing_plans (name, contents_count, videos_count) values ('X', 4, 8)");
ok(!bad.ok, "vídeos não podem exceder o total de conteúdos");
const badRange = await tryExec("insert into web_pricing (name, price_min, price_max) values ('X', 500, 100)");
ok(!badRange.ok, "faixa de preço inválida é rejeitada");

console.log(failures ? `\n${failures} verificação(ões) falharam.` : "\nTodas as verificações passaram.");
process.exit(failures ? 1 : 0);
