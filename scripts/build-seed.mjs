// Gera supabase/seed.sql a partir de supabase/seed/content.json.
// Uso: npm run seed:build
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = JSON.parse(readFileSync(join(root, "supabase/seed/content.json"), "utf8"));

const q = (v) => {
  if (v === null || v === undefined || v === "") return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const qText = (v) => `'${String(v ?? "").replace(/'/g, "''")}'`;
const arr = (a) => `array[${(a ?? []).map(qText).join(", ")}]::text[]`;

const out = [];
out.push("-- Gerado por scripts/build-seed.mjs a partir de supabase/seed/content.json");
out.push("-- Não edite à mão. Rode `npm run seed:build` após alterar o JSON.\n");
out.push("begin;\n");

out.push(
  `insert into public.site_settings (id, data) values (1, ${qText(JSON.stringify(content.settings))}::jsonb)\n` +
    `on conflict (id) do update set data = excluded.data;\n`
);

content.team.forEach((m, i) => {
  out.push(
    `insert into public.team_members (name, role, bio, photo_url, skills, responsibilities, visible, sort_order) values (` +
      [qText(m.name), qText(m.role), qText(m.bio), q(m.photo_url), arr(m.skills), arr(m.responsibilities), q(m.visible ?? true), i].join(", ") +
      `);`
  );
});
out.push("");

content.services.forEach((s, i) => {
  out.push(
    `insert into public.services (category, title, description, deliverables, icon, price_label, notes, sort_order) values (` +
      [qText(s.category), qText(s.title), qText(s.description), arr(s.deliverables), q(s.icon), q(s.price_label), q(s.notes), i].join(", ") +
      `);`
  );
});
out.push("");

content.plans.forEach((p, i) => {
  out.push(
    `with p as (insert into public.marketing_plans (name, price, description, contents_count, videos_count, notes, highlighted, sort_order) values (` +
      [qText(p.name), q(p.price), qText(p.description), q(p.contents_count), q(p.videos_count), q(p.notes), q(p.highlighted), i].join(", ") +
      `) returning id)\n` +
      `insert into public.plan_items (plan_id, text, sort_order) select p.id, t.text, t.ord - 1 from p, unnest(${arr(p.items)}) with ordinality as t(text, ord);`
  );
});
out.push("");

content.web_pricing.forEach((w, i) => {
  out.push(
    `insert into public.web_pricing (name, description, price_type, price_min, price_max, price_suffix, sort_order) values (` +
      [qText(w.name), qText(w.description), qText(w.price_type), q(w.price_min), q(w.price_max), qText(w.price_suffix), i].join(", ") +
      `);`
  );
});
out.push("");

content.projects.forEach((p, i) => {
  out.push(
    `insert into public.portfolio_projects (slug, title, client, category, summary, challenge, solution, deliverables, results, external_url, status, sort_order) values (` +
      [qText(p.slug), qText(p.title), qText(p.client), qText(p.category), qText(p.summary), qText(p.challenge), qText(p.solution), arr(p.deliverables), q(p.results), q(p.external_url), qText(p.status), i].join(", ") +
      `) on conflict (slug) do nothing;`
  );
});
out.push("");

content.process_steps.forEach((s, i) => {
  out.push(`insert into public.process_steps (title, description, sort_order) values (${qText(s.title)}, ${qText(s.description)}, ${i});`);
});
out.push("");

content.faqs.forEach((f, i) => {
  out.push(`insert into public.faqs (question, answer, sort_order) values (${qText(f.question)}, ${qText(f.answer)}, ${i});`);
});

out.push("\ncommit;\n");
writeFileSync(join(root, "supabase/seed.sql"), out.join("\n"));
console.log("supabase/seed.sql gerado.");
