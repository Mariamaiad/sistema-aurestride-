"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, X } from "lucide-react";
import { SETTINGS_PAGES, getPath, validateSettingValue, type SettingField, type SettingsPage } from "@/lib/admin/settings-fields";
import { saveSettings } from "@/app/admin/actions";
import { useToast } from "./toast";
import { ColorField, HighlightsField, ImageField, ListField, TextField, ToggleField } from "./fields";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about-team";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ page, settings, readOnly }: { page: SettingsPage; settings: SiteSettings; readOnly?: boolean }) {
  const def = SETTINGS_PAGES[page];
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState(false);

  const initial = useMemo(() => {
    const v: Record<string, unknown> = {};
    def.groups.forEach((g) => g.fields.forEach((f) => (v[f.path] = getPath(settings, f.path))));
    return v;
  }, [def, settings]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const set = (path: string, v: unknown) => setValues((x) => ({ ...x, [path]: v }));

  const submit = () => {
    const errs: Record<string, string> = {};
    def.groups.forEach((g) =>
      g.fields.forEach((f) => {
        let v = values[f.path];
        if (typeof v === "string") v = v.trim();
        const e = validateSettingValue(f, v);
        if (e) errs[f.path] = e;
      })
    );
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast("error", "Confira os campos destacados.");
      return;
    }
    if (readOnly) {
      toast("error", "Modo demonstração: os dados estão válidos, mas nada é salvo sem o banco de dados.");
      return;
    }
    start(async () => {
      const r = await saveSettings(page, values);
      if (r.ok) {
        toast("success", r.message ?? "Salvo.");
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast("error", r.error);
      }
    });
  };

  // Configurações com os valores ainda não salvos, para a pré-visualização.
  const draft = useMemo(() => {
    const clone = structuredClone(settings) as unknown as Record<string, unknown>;
    for (const [path, v] of Object.entries(values)) {
      const keys = path.split(".");
      let cur = clone;
      keys.slice(0, -1).forEach((k) => (cur = cur[k] as Record<string, unknown>));
      cur[keys[keys.length - 1]] = v;
    }
    return clone as unknown as SiteSettings;
  }, [settings, values]);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-8 pb-24"
    >
      {def.groups.map((g) => (
        <section key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <h2 className="font-semibold text-paper">{g.title}</h2>
          {g.description && <p className="mt-1 text-sm text-mist">{g.description}</p>}
          <div className={`mt-5 grid gap-5 ${g.id === "colors" ? "sm:grid-cols-2" : ""}`}>
            {g.fields.map((f) => (
              <SettingInput key={f.path} f={f} value={values[f.path]} error={errors[f.path]} onChange={(v) => set(f.path, v)} />
            ))}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2 px-5 py-3">
          <p className="mr-auto text-xs text-mist">
            {readOnly ? "Modo demonstração: salvar está desativado." : dirty ? "Há alterações não salvas." : "Tudo salvo."}
          </p>
          {page === "conteudo" || page === "identidade" ? (
            <button type="button" className="btn btn-outline !min-h-10 !py-2 text-sm" onClick={() => setPreview(true)}>
              <Eye className="h-4 w-4" /> Pré-visualizar
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary !min-h-10 !py-2 text-sm" disabled={pending || !dirty}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:p-8" onClick={() => setPreview(false)}>
          <div className="mx-auto max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-paper">Pré-visualização (alterações ainda não salvas)</p>
              <button type="button" className="btn btn-outline !min-h-9 !py-1.5 text-sm" onClick={() => setPreview(false)}>
                <X className="h-4 w-4" /> Fechar
              </button>
            </div>
            <div
              className="preview overflow-hidden rounded-2xl border border-white/15 bg-ink"
              style={
                {
                  "--brand-bg": draft.colors.background,
                  "--brand-primary": draft.colors.primary,
                  "--brand-text": draft.colors.text,
                  "--brand-muted": draft.colors.muted,
                } as React.CSSProperties
              }
            >
              <Hero hero={draft.hero} quoteHref="#" />
              <About about={draft.about} />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function SettingInput({ f, value, onChange, error }: { f: SettingField; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  switch (f.type) {
    case "text":
    case "email":
    case "url":
      return (
        <TextField
          label={f.label}
          value={String(value ?? "")}
          onChange={onChange}
          max={f.max}
          help={f.help}
          error={error}
          type={f.type}
          placeholder={f.placeholder}
        />
      );
    case "textarea":
      return <TextField multiline label={f.label} value={String(value ?? "")} onChange={onChange} max={f.max} rows={f.rows} help={f.help} error={error} />;
    case "image":
      return <ImageField label={f.label} value={String(value ?? "")} onChange={onChange} folder={f.folder} help={f.help} error={error} />;
    case "color":
      return <ColorField label={f.label} value={String(value ?? "")} onChange={onChange} error={error} />;
    case "boolean":
      return <ToggleField label={f.label} checked={Boolean(value)} onChange={onChange} help={f.help} />;
    case "list":
      return <ListField label={f.label} value={(value as string[]) ?? []} onChange={onChange} error={error} help={f.help} />;
    case "highlights":
      return <HighlightsField label={f.label} value={(value as { title: string; text: string }[]) ?? []} onChange={onChange} error={error} />;
  }
}
