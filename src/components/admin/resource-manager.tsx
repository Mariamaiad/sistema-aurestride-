"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { RESOURCES, fieldErrors, slugify, type FieldDef, type ResourceKey } from "@/lib/admin/resources";
import { deleteRecord, duplicatePlan, reorderRecords, saveRecord, setRecordFlag } from "@/app/admin/actions";
import { useToast } from "./toast";
import {
  GalleryField,
  IconBtn,
  IconPicker,
  ImageField,
  ListField,
  NumberField,
  SelectField,
  TextField,
  ToggleField,
} from "./fields";

type Row = Record<string, unknown> & { id: string };

export function ResourceManager({ resource, rows: initialRows, readOnly }: { resource: ResourceKey; rows: Row[]; readOnly?: boolean }) {
  const res = RESOURCES[resource];
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [synced, setSynced] = useState(initialRows);
  // Atualiza a lista quando o servidor envia dados novos (após router.refresh()).
  if (synced !== initialRows) {
    setSynced(initialRows);
    setRows(initialRows);
  }
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, unknown> } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEditing(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [editing]);

  const run = (id: string | null, fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) => {
    setBusyId(id);
    start(async () => {
      const r = await fn();
      setBusyId(null);
      if (r.ok) {
        toast("success", r.message ?? "Salvo.");
        after?.();
        router.refresh();
      } else toast("error", r.error ?? "Erro ao salvar.");
    });
  };

  const openNew = () => {
    setErrors({});
    setEditing({ id: null, values: structuredClone(res.defaults) });
  };
  const openEdit = (row: Row) => {
    setErrors({});
    const values: Record<string, unknown> = {};
    for (const f of res.fields) {
      const v = row[f.name];
      values[f.name] = v === null || v === undefined ? (res.defaults[f.name] ?? "") : v;
    }
    setEditing({ id: row.id, values });
  };

  const save = () => {
    if (!editing) return;
    const parsed = res.schema.safeParse(editing.values);
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
      const r = await saveRecord(resource, editing.id, editing.values);
      if (r.ok) {
        toast("success", r.message ?? "Salvo.");
        setEditing(null);
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast("error", r.error);
      }
    });
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    run(next[j].id, () => reorderRecords(resource, next.map((r) => r.id)));
  };

  const set = (name: string, v: unknown) =>
    setEditing((e) => {
      if (!e) return e;
      const values = { ...e.values, [name]: v };
      // Sugere o endereço do projeto a partir do nome, enquanto ainda não foi editado.
      if (resource === "projects" && name === "title" && (!e.values.slug || e.values.slug === slugify(String(e.values.title ?? ""))))
        values.slug = slugify(String(v));
      return { ...e, values };
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {rows.length} {rows.length === 1 ? "item" : "itens"} · use as setas para definir a ordem no site.
        </p>
        <button type="button" onClick={openNew} disabled={readOnly} className="btn btn-primary !min-h-10 !py-2 text-sm">
          <Plus className="h-4 w-4" /> Novo {res.singular}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-mist">Nenhum item ainda.</p>
      ) : (
        <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {rows.map((row, i) => {
            const isOn = res.toggleField ? Boolean(row[res.toggleField]) : row.status === "published";
            const busy = pending && busyId === row.id;
            return (
              <li key={row.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${isOn ? "" : "opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-paper">{res.title(row) || "(sem título)"}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${
                        isOn ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-mist"
                      }`}
                    >
                      {isOn ? res.toggleLabels[0] : res.toggleLabels[1]}
                    </span>
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-mist" aria-label="Salvando" />}
                  </div>
                  {res.subtitle && <p className="mt-0.5 line-clamp-1 text-sm text-mist">{res.subtitle(row)}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <IconBtn label="Mover para cima" onClick={() => move(i, -1)} disabled={readOnly || i === 0 || pending}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Mover para baixo" onClick={() => move(i, 1)} disabled={readOnly || i === rows.length - 1 || pending}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  {res.toggleField ? (
                    <IconBtn
                      label={isOn ? `Desativar (${res.toggleLabels[1].toLowerCase()})` : "Ativar"}
                      disabled={readOnly || pending}
                      onClick={() => run(row.id, () => setRecordFlag(resource, row.id, res.toggleField!, !isOn))}
                    >
                      {isOn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </IconBtn>
                  ) : (
                    <button
                      type="button"
                      disabled={readOnly || pending}
                      onClick={() => {
                        if (
                          !isOn &&
                          !window.confirm("Publicar este projeto? Confirme que o cliente autorizou a divulgação das informações e imagens.")
                        )
                          return;
                        run(row.id, () => setRecordFlag(resource, row.id, "status", isOn ? "draft" : "published"));
                      }}
                      className="btn btn-outline !min-h-9 !px-3 !py-1.5 text-xs"
                    >
                      {isOn ? "Despublicar" : "Publicar"}
                    </button>
                  )}
                  {resource === "projects" && (
                    <a
                      href={`/portfolio/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Pré-visualizar projeto"
                      title="Pré-visualizar"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-mist hover:border-white/30 hover:text-paper"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {res.canDuplicate && (
                    <IconBtn label="Duplicar" disabled={readOnly || pending} onClick={() => run(row.id, () => duplicatePlan(row.id))}>
                      <Copy className="h-4 w-4" />
                    </IconBtn>
                  )}
                  <IconBtn label="Editar" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Excluir"
                    danger
                    disabled={readOnly || pending}
                    onClick={() => {
                      const hint = res.toggleField ? ` Se quiser apenas esconder do site, use o botão de ocultar.` : "";
                      if (window.confirm(`Excluir "${res.title(row)}" definitivamente?${hint}`)) run(row.id, () => deleteRecord(resource, row.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => !pending && setEditing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className="flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 id="editor-title" className="font-semibold text-paper">
                {editing.id ? `Editar ${res.singular}` : `Novo ${res.singular}`}
              </h2>
              <IconBtn label="Fechar" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </IconBtn>
            </div>
            <form
              className="flex-1 space-y-5 overflow-y-auto px-5 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              id="resource-form"
              noValidate
            >
              {res.fields.map((f) => (
                <Field key={f.name} f={f} value={editing.values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
              ))}
              {errors._form && <p className="text-sm text-red-300">{errors._form}</p>}
            </form>
            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
              {readOnly && <p className="mr-auto hidden text-xs text-amber-300 sm:block">Modo demonstração: salvar está desativado.</p>}
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={pending}>
                Cancelar
              </button>
              <button type="submit" form="resource-form" className="btn btn-primary" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ f, value, onChange, error }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  switch (f.type) {
    case "text":
    case "url":
    case "slug":
      return (
        <TextField
          label={f.label}
          value={String(value ?? "")}
          onChange={onChange}
          error={error}
          help={f.help}
          max={f.max}
          required={f.required}
          placeholder={f.placeholder ?? (f.type === "url" ? "https://" : undefined)}
          type={f.type === "url" ? "url" : "text"}
        />
      );
    case "textarea":
      return <TextField multiline label={f.label} value={String(value ?? "")} onChange={onChange} error={error} help={f.help} max={f.max} rows={f.rows} required={f.required} />;
    case "number":
    case "money":
      return <NumberField label={f.label} value={(value as number | null) ?? null} onChange={onChange} error={error} help={f.help} money={f.type === "money"} placeholder={f.placeholder} />;
    case "boolean":
      return <ToggleField label={f.label} checked={Boolean(value)} onChange={onChange} help={f.help} />;
    case "list":
      return <ListField label={f.label} value={(value as string[]) ?? []} onChange={onChange} error={error} help={f.help} placeholder={f.placeholder} />;
    case "image":
      return <ImageField label={f.label} value={String(value ?? "")} onChange={onChange} folder={f.folder} error={error} help={f.help} />;
    case "gallery":
      return <GalleryField label={f.label} value={(value as { url: string; alt: string }[]) ?? []} onChange={onChange} folder={f.folder} error={error} />;
    case "select":
      return <SelectField label={f.label} value={String(value ?? f.options[0].value)} onChange={onChange} options={f.options} error={error} help={f.help} />;
    case "icon":
      return <IconPicker label={f.label} value={String(value ?? "")} onChange={onChange} />;
  }
}
