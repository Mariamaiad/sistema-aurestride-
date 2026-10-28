"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { CLIENT_DEFAULTS, CLIENT_HEALTH, CLIENT_STATUS, clientSchema, type Client, type ClientInput } from "@/lib/admin/clients";
import { fieldErrors } from "@/lib/admin/resources";
import { deleteClient, saveClient } from "@/app/admin/client-actions";
import { useToast } from "../toast";
import { FieldShell, ListField, NumberField, SelectField, TextField, inputCls } from "../fields";

export function DateField({
  label,
  value,
  onChange,
  error,
  help,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  error?: string;
  help?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} help={help} error={error}>
      <input
        id={id}
        type="date"
        value={value ?? ""}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${inputCls} [color-scheme:dark]`}
      />
    </FieldShell>
  );
}

function pick(client: Client | null): ClientInput {
  if (!client) return structuredClone(CLIENT_DEFAULTS);
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(CLIENT_DEFAULTS)) out[k] = (client as unknown as Record<string, unknown>)[k] ?? (CLIENT_DEFAULTS as Record<string, unknown>)[k];
  return out as ClientInput;
}

export function ClientForm({
  client,
  readOnly,
  serviceSuggestions = [],
  planSuggestions = [],
}: {
  client: Client | null;
  readOnly?: boolean;
  serviceSuggestions?: string[];
  planSuggestions?: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [initial] = useState(() => pick(client));
  const [v, setV] = useState<ClientInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const set = <K extends keyof ClientInput>(k: K, value: ClientInput[K]) => setV((x) => ({ ...x, [k]: value }));
  const listId = useId();

  const submit = () => {
    const parsed = clientSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast("error", "Confira os campos destacados.");
      return;
    }
    setErrors({});
    if (readOnly) {
      toast("error", "Modo demonstração: os dados estão válidos, mas nada é salvo sem o banco de dados.");
      return;
    }
    start(async () => {
      const r = await saveClient(client?.id ?? null, v as Record<string, unknown>);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast("error", r.error);
        return;
      }
      toast("success", r.message ?? "Salvo.");
      if (!client && r.data) router.push(`/admin/clientes/${r.data.id}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!client || readOnly) return;
    if (!window.confirm(`Excluir ${client.name}? As tarefas e todo o histórico deste cliente também serão apagados.`)) return;
    start(async () => {
      const r = await deleteClient(client.id);
      if (r.ok) {
        toast("success", r.message ?? "Excluído.");
        router.push("/admin/clientes");
      } else toast("error", r.error);
    });
  };

  const datalist = (suffix: string, items: string[]) =>
    items.length > 0 && (
      <datalist id={`${listId}-${suffix}`}>
        {items.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Group title="Identificação">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <TextField label="Cliente ou empresa" required value={v.name} onChange={(x) => set("name", x)} max={160} error={errors.name} />
          <TextField label="Pessoa de contato" value={v.contact_name} onChange={(x) => set("contact_name", x)} max={120} error={errors.contact_name} />
          <TextField
            label="Segmento"
            value={v.segment}
            onChange={(x) => set("segment", x)}
            max={120}
            placeholder="Ex.: Oficina mecânica"
            error={errors.segment}
          />
          <TextField label="Responsável na Aurestride" value={v.owner} onChange={(x) => set("owner", x)} max={120} error={errors.owner} placeholder="Ex.: Maria" />
          <SelectField
            label="Situação"
            value={v.status}
            onChange={(x) => set("status", x as ClientInput["status"])}
            options={Object.entries(CLIENT_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
          <SelectField
            label="Como está o relacionamento"
            value={v.health}
            onChange={(x) => set("health", x as ClientInput["health"])}
            options={Object.entries(CLIENT_HEALTH).map(([value, s]) => ({ value, label: s.label }))}
            help="Marque “Em risco” quando houver insatisfação ou chance de cancelamento."
          />
        </div>
      </Group>

      <Group title="Contato">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <TextField label="WhatsApp / telefone" value={v.phone} onChange={(x) => set("phone", x)} max={40} placeholder="(49) 99999-9999" error={errors.phone} />
          <TextField label="E-mail" type="email" value={v.email} onChange={(x) => set("email", x)} max={200} error={errors.email} />
          <TextField label="Instagram" value={v.instagram} onChange={(x) => set("instagram", x)} max={200} placeholder="@cliente" error={errors.instagram} />
          <TextField label="Site" type="url" value={v.website} onChange={(x) => set("website", x)} max={300} placeholder="https://" error={errors.website} />
        </div>
      </Group>

      <Group title="Contrato">
        <div className="grid gap-5">
          <ListField
            label="Serviços contratados"
            value={v.services}
            onChange={(x) => set("services", x)}
            error={errors.services}
            placeholder={serviceSuggestions[0] ? `Ex.: ${serviceSuggestions[0]}` : "Ex.: Gestão de redes sociais"}
          />
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <PlanInput value={v.plan} onChange={(x) => set("plan", x)} error={errors.plan} list={planSuggestions.length ? `${listId}-plan` : undefined} />
              {datalist("plan", planSuggestions)}
            </div>
            <NumberField label="Valor mensal" money value={v.monthly_value ?? null} onChange={(x) => set("monthly_value", x)} error={errors.monthly_value} />
            <NumberField
              label="Dia do vencimento"
              value={v.billing_day ?? null}
              onChange={(x) => set("billing_day", x)}
              error={errors.billing_day}
              placeholder="1 a 31"
            />
            <div className="hidden sm:block" />
            <DateField label="Início do contrato" value={v.start_date ?? null} onChange={(x) => set("start_date", x)} error={errors.start_date} />
            <DateField
              label="Renovação ou fim do contrato"
              value={v.renewal_date ?? null}
              onChange={(x) => set("renewal_date", x)}
              error={errors.renewal_date}
            />
          </div>
        </div>
      </Group>

      <Group title="Observações e preferências">
        <TextField
          multiline
          rows={5}
          label="Anotações fixas"
          value={v.notes}
          onChange={(x) => set("notes", x)}
          max={5000}
          error={errors.notes}
          help="O que a equipe precisa lembrar sempre: tom de voz, horários, quem aprova, onde ficam os arquivos. Não guarde senhas aqui."
        />
      </Group>

      <div className="sticky bottom-0 z-20 -mx-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-[#080d18]/95 px-5 py-3 backdrop-blur">
        <p className="mr-auto text-xs text-mist">{readOnly ? "Modo demonstração: salvar está desativado." : dirty ? "Há alterações não salvas." : client ? "Tudo salvo." : ""}</p>
        {client && (
          <button type="button" onClick={remove} disabled={pending || readOnly} className="btn btn-ghost !min-h-10 !py-2 text-sm hover:!text-red-300">
            <Trash2 className="h-4 w-4" /> Excluir cliente
          </button>
        )}
        <button type="submit" className="btn btn-primary !min-h-10 !py-2 text-sm" disabled={pending || (!!client && !dirty)}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {client ? "Salvar ficha" : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}

function PlanInput({ value, onChange, error, list }: { value: string; onChange: (v: string) => void; error?: string; list?: string }) {
  const id = useId();
  return (
    <FieldShell label="Plano" htmlFor={id} error={error} help="Escolha um plano do site ou escreva um personalizado.">
      <input id={id} list={list} value={value} maxLength={120} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} className={inputCls} />
    </FieldShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
      <h2 className="mb-5 font-semibold text-paper">{title}</h2>
      {children}
    </section>
  );
}
