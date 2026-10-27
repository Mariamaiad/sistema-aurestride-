"use client";

/* eslint-disable @next/next/no-img-element */
import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_BUCKET } from "@/lib/env";
import { recordMedia } from "@/app/admin/actions";
import { SERVICE_ICON_OPTIONS, ServiceIcon } from "@/components/ui/icons";

export const inputCls =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-paper placeholder:text-slate focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/30 aria-[invalid=true]:border-red-400";

export function FieldShell({
  label,
  htmlFor,
  help,
  error,
  children,
  counter,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-paper">
          {label}
        </label>
        {counter && <span className="text-[0.7rem] tabular-nums text-slate">{counter}</span>}
      </div>
      {children}
      {help && !error && <p className="text-xs text-mist">{help}</p>}
      {error && (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  help,
  max,
  type = "text",
  required,
  placeholder,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: string;
  max?: number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const id = useId();
  const common = {
    id,
    value,
    maxLength: max,
    required,
    placeholder,
    "aria-invalid": Boolean(error),
    className: inputCls,
  };
  return (
    <FieldShell label={label + (required ? " *" : "")} htmlFor={id} help={help} error={error} counter={max ? `${value.length}/${max}` : undefined}>
      {multiline ? (
        <textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
    </FieldShell>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  error,
  help,
  money,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  error?: string;
  help?: string;
  money?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} help={help} error={error}>
      <div className="relative">
        {money && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate">R$</span>}
        <input
          id={id}
          type="number"
          inputMode={money ? "decimal" : "numeric"}
          min={0}
          step={money ? "0.01" : "1"}
          value={value ?? ""}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`${inputCls} ${money ? "pl-9" : ""}`}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
    </FieldShell>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-electric" : "bg-white/15"}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-paper">{label}</span>
        {help && <span className="block text-xs text-mist">{help}</span>}
      </label>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  help?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} help={help} error={error}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink">
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Lista de textos com adicionar, remover e reordenar. */
export function ListField({
  label,
  value,
  onChange,
  error,
  help,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  help?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft("");
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <FieldShell label={label} htmlFor={id} help={help} error={error}>
      {value.length > 0 && (
        <ul className="grid gap-1.5">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <input
                aria-label={`${label} ${i + 1}`}
                value={item}
                onChange={(e) => onChange(value.map((x, k) => (k === i ? e.target.value : x)))}
                className={inputCls}
              />
              <IconBtn label="Mover para cima" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Mover para baixo" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remover item" onClick={() => onChange(value.filter((_, k) => k !== i))} danger>
                <X className="h-3.5 w-3.5" />
              </IconBtn>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1.5">
        <input
          id={id}
          value={draft}
          placeholder={placeholder ?? "Novo item"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={inputCls}
        />
        <button type="button" onClick={add} className="btn btn-outline !min-h-0 shrink-0 !px-3 !py-2 text-sm">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </FieldShell>
  );
}

export function IconBtn({
  label,
  onClick,
  children,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-mist transition-colors hover:text-paper disabled:opacity-30 ${
        danger ? "hover:border-red-400/60 hover:text-red-300" : "hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

export function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-paper">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {SERVICE_ICON_OPTIONS.map((name) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              value === name ? "border-electric bg-electric/20 text-paper" : "border-white/10 text-mist hover:border-white/30"
            }`}
          >
            <ServiceIcon name={name} className="h-4 w-4" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ColorField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} error={error}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} (seletor)`} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border border-white/12 bg-transparent" />
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} className={`${inputCls} font-mono uppercase`} aria-invalid={Boolean(error)} />
      </div>
    </FieldShell>
  );
}

/* ---------------- upload de imagens ---------------- */

async function uploadImage(file: File, folder: string): Promise<{ url?: string; error?: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: "Formato não aceito. Use JPG, PNG, WebP ou AVIF." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Arquivo maior que 5 MB. Reduza a imagem e tente de novo." };
  const supabase = getBrowserClient();
  if (!supabase) return { error: "O Supabase não está configurado." };
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type]!;
  const safeFolder = folder.replace(/[^a-z0-9-]/g, "") || "geral";
  const path = `${safeFolder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return { error: "Falha no envio da imagem. Verifique se você está logado como administrador." };
  const res = await recordMedia({ path, mime: file.type, size: file.size });
  if (!res.ok) return { error: res.error };
  return { url: res.data!.url };
}

export function ImageField({
  label,
  value,
  onChange,
  folder,
  error,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
  error?: string;
  help?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setLocalError(undefined);
    const res = await uploadImage(file, folder);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (res.error) setLocalError(res.error);
    else if (res.url) onChange(res.url);
  };

  return (
    <FieldShell label={label} htmlFor={id} help={help ?? "JPG, PNG, WebP ou AVIF, até 5 MB."} error={localError ?? error}>
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-white/15 p-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-slate" aria-hidden="true" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn btn-outline !min-h-0 !px-3 !py-2 text-sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {value && !busy && (
            <button type="button" onClick={() => onChange("")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-sm">
              <Trash2 className="h-4 w-4" /> Remover
            </button>
          )}
        </div>
      </div>
    </FieldShell>
  );
}

export function GalleryField({
  label,
  value,
  onChange,
  folder,
  error,
}: {
  label: string;
  value: { url: string; alt: string }[];
  onChange: (v: { url: string; alt: string }[]) => void;
  folder: string;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setLocalError(undefined);
    const added: { url: string; alt: string }[] = [];
    for (const f of Array.from(files)) {
      const res = await uploadImage(f, folder);
      if (res.error) {
        setLocalError(`${f.name}: ${res.error}`);
        break;
      }
      added.push({ url: res.url!, alt: "" });
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (added.length) onChange([...value, ...added]);
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <FieldShell label={label} error={localError ?? error} help="Você pode selecionar várias imagens de uma vez.">
      {value.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((im, i) => (
            <li key={im.url + i} className="flex gap-2 rounded-lg border border-white/10 p-2">
              <img src={im.url} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
              <div className="grid min-w-0 flex-1 gap-1.5">
                <input aria-label={`Descrição da imagem ${i + 1}`} placeholder="Descrição da imagem" value={im.alt} maxLength={200} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} className={`${inputCls} !py-1.5 text-xs`} />
                <div className="flex gap-1">
                  <IconBtn label="Mover para trás" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn label="Mover para frente" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn label="Remover imagem" onClick={() => onChange(value.filter((_, k) => k !== i))} danger>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input ref={inputRef} type="file" multiple accept={ALLOWED_IMAGE_TYPES.join(",")} className="sr-only" aria-label="Adicionar imagens à galeria" onChange={(e) => onFiles(e.target.files)} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn btn-outline !min-h-0 justify-self-start !px-3 !py-2 text-sm">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? "Enviando..." : "Adicionar imagens"}
      </button>
    </FieldShell>
  );
}

export function HighlightsField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: { title: string; text: string }[];
  onChange: (v: { title: string; text: string }[]) => void;
  error?: string;
}) {
  return (
    <FieldShell label={label} error={error} help="Até 4 destaques.">
      <ul className="grid gap-2">
        {value.map((h, i) => (
          <li key={i} className="grid gap-1.5 sm:grid-cols-[1fr_1.6fr_auto]">
            <input aria-label={`Destaque ${i + 1} — título`} placeholder="Título" maxLength={40} value={h.title} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className={inputCls} />
            <input aria-label={`Destaque ${i + 1} — texto`} placeholder="Texto curto" maxLength={80} value={h.text} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} className={inputCls} />
            <IconBtn label="Remover destaque" onClick={() => onChange(value.filter((_, k) => k !== i))} danger>
              <X className="h-3.5 w-3.5" />
            </IconBtn>
          </li>
        ))}
      </ul>
      {value.length < 4 && (
        <button type="button" onClick={() => onChange([...value, { title: "", text: "" }])} className="btn btn-outline !min-h-0 justify-self-start !px-3 !py-2 text-sm">
          <Plus className="h-4 w-4" /> Adicionar destaque
        </button>
      )}
    </FieldShell>
  );
}
