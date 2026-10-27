"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/content";

export type LeadState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    email: z.union([z.literal(""), z.string().trim().email("E-mail inválido.").max(200)]),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, "Telefone inválido (inclua o DDD)."),
    company: z.string().trim().max(160),
    interest: z.string().trim().max(120),
    message: z.string().trim().min(5, "Escreva uma mensagem um pouco maior.").max(3000, "Mensagem muito longa."),
    consent: z.literal("on", { message: "É preciso concordar com o uso dos dados para contato." }),
  })
  .refine((d) => d.email !== "" || d.phone !== "", {
    message: "Informe um e-mail ou telefone para retorno.",
    path: ["email"],
  });

const MIN_FILL_MS = 3000;
const RATE_WINDOW_MIN = 15;
const RATE_MAX = 3;

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Anti-spam 1: campo invisível que pessoas não preenchem.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Mensagem recebida." };
  }
  // Anti-spam 2: envio rápido demais para uma pessoa.
  const startedAt = Number(formData.get("started_at"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", message: "Envio muito rápido. Aguarde alguns segundos e tente novamente." };
  }

  const { settings } = await getSiteContent();
  if (!settings.contact.form_enabled) {
    return { status: "error", message: "O formulário está desativado no momento. Use o WhatsApp ou o e-mail." };
  }

  const parsed = leadSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    company: formData.get("company") ?? "",
    interest: formData.get("interest") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Confira os campos destacados.", fieldErrors };
  }

  const db = createServiceClient();
  if (!db) {
    // Sem banco configurado: nunca simular envio.
    return {
      status: "error",
      message: "O formulário ainda não está disponível. Fale conosco pelo WhatsApp ou e-mail.",
    };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const salt = process.env.LEAD_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ipHash = ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null;

  if (ipHash) {
    const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const { count, error } = await db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (!error && (count ?? 0) >= RATE_MAX) {
      return { status: "error", message: "Recebemos várias mensagens suas há pouco. Tente novamente mais tarde." };
    }
  }

  const d = parsed.data;
  const { error } = await db.from("leads").insert({
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company || null,
    interest: d.interest || null,
    message: d.message,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("[leads] falha ao gravar:", error.message);
    return { status: "error", message: "Não foi possível registrar sua mensagem agora. Tente pelo WhatsApp." };
  }

  return {
    status: "success",
    message: "Mensagem registrada com sucesso! Vamos responder pelo contato que você informou.",
  };
}
