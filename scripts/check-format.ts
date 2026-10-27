// Verificações rápidas dos utilitários de formatação. Uso: npx tsx scripts/check-format.ts
import { fillTemplate, formatWebPrice, normalizeWhatsapp, whatsappLink } from "../src/lib/format";
import type { WebPrice } from "../src/lib/types";

let fail = 0;
const eq = (a: unknown, b: unknown, msg: string) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${ok ? "✓" : "✗"} ${msg}${ok ? "" : ` — obtido ${JSON.stringify(a)}`}`);
  if (!ok) fail++;
};
const w = (p: Partial<WebPrice>): WebPrice => ({ id: "x", name: "", description: "", price_type: "range", price_min: null, price_max: null, price_suffix: "", notes: null, show_price: true, active: true, sort_order: 0, ...p });

eq(normalizeWhatsapp("(49) 99999-1234"), "5549999991234", "WhatsApp com DDD recebe 55");
eq(normalizeWhatsapp("+55 49 99999-1234"), "5549999991234", "WhatsApp com +55 é mantido");
eq(whatsappLink("", "oi"), null, "sem número, sem link");
const msg = fillTemplate("Tenho interesse no {plano}.", { plano: "Plano Crescimento" });
eq(whatsappLink("49999991234", msg), "https://wa.me/5549999991234?text=Tenho%20interesse%20no%20Plano%20Crescimento.", "link do plano com mensagem preenchida");
eq(formatWebPrice(w({ price_min: 900, price_max: 1800 })), "R$ 900 a R$ 1.800", "faixa de preço");
eq(formatWebPrice(w({ price_type: "from", price_min: 3000 })), "A partir de R$ 3.000", "a partir de");
eq(formatWebPrice(w({ price_min: 150, price_max: 500, price_suffix: "/mês" })), "R$ 150 a R$ 500/mês", "faixa mensal");
eq(formatWebPrice(w({ price_type: "fixed", price_min: 1200 })), "R$ 1.200", "preço fixo");
eq(formatWebPrice(w({ price_type: "on_request" })), "Sob consulta", "sob consulta");
process.exit(fail ? 1 : 0);
