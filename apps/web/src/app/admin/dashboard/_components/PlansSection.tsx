"use client";
import { useState } from "react";
import { Check, Pencil, Star } from "lucide-react";
import { getPlanFeatures } from "@/lib/planFeatures";
import { Badge, BORDER, Button, Card, Drawer, INK, MUTED, SectionHeader, TextField, Toggle, fmtNumber, fmtPrice } from "./ui";
import type { Plan } from "./types";

type Draft = Plan & { features_text: string };

export default function PlansSection({
  plans, primary, onToggleActive, onSave,
}: {
  plans: Plan[]; primary: string;
  onToggleActive: (plan: Plan) => void;
  onSave: (plan: Plan, data: Partial<Plan>) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const features = draft.features_text.split("\n").map((f) => f.trim()).filter(Boolean);
    const ok = await onSave(draft, {
      name: draft.name, price: Number(draft.price) || 0, currency: draft.currency, billing: draft.billing,
      article_limit: Number(draft.article_limit) || 0, features, is_popular: draft.is_popular,
    });
    setSaving(false);
    if (ok) setDraft(null);
  };

  return (
    <>
      <SectionHeader title="Forfaits" subtitle="Les offres proposées aux vendeurs. Les modifications s'appliquent immédiatement." />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative flex flex-col ${plan.active ? "" : "opacity-70"}`}>
            {plan.is_popular && (
              <span className="absolute -top-3 left-5 inline-flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1 rounded-full" style={{ background: primary }}>
                <Star size={10} fill="white" /> Recommandé
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: INK }}>{plan.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {plan.article_limit >= 999 ? "Articles illimités" : `${plan.article_limit} articles maximum`}
                </p>
              </div>
              {!plan.active && <Badge tone="red">Inactif</Badge>}
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: plan.price === 0 ? INK : primary }}>
                {plan.price === 0 ? "Gratuit" : fmtNumber(plan.price)}
              </span>
              {plan.price > 0 && <span className="text-sm" style={{ color: MUTED }}>{plan.currency} / {plan.billing.toLowerCase()}</span>}
            </div>

            <ul className="mt-5 space-y-2 flex-1">
              {getPlanFeatures(plan).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: i < 2 ? INK : MUTED, fontWeight: i < 2 ? 600 : 400 }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: primary }} />{f}
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: BORDER }}>
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: MUTED }}>
                <Toggle checked={plan.active} onChange={() => onToggleActive(plan)} color={primary} label={`Activer le forfait ${plan.name}`} />
                {plan.active ? "Actif" : "Inactif"}
              </label>
              <Button onClick={() => setDraft({ ...plan, features_text: (plan.features ?? []).join("\n") })}><Pencil size={14} /> Modifier</Button>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={!!draft} onClose={() => setDraft(null)} title={draft ? `Modifier le forfait ${draft.name}` : ""}>
        {draft && (
          <div className="flex flex-col gap-4">
            <TextField label="Nom" value={draft.name} onChange={(v) => set("name", v)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Prix" type="number" value={String(draft.price)} onChange={(v) => set("price", Number(v) as never)} />
              <TextField label="Devise" value={draft.currency} onChange={(v) => set("currency", v)} />
            </div>
            <TextField label="Facturation" hint="Texte affiché après le prix : mois, an, toujours…" value={draft.billing} onChange={(v) => set("billing", v)} />
            <TextField label="Limite d'articles" type="number" hint="999 ou plus = illimité" value={String(draft.article_limit)} onChange={(v) => set("article_limit", Number(v) as never)} />
            <TextField label="Fonctionnalités" multiline hint="Une par ligne. Les lignes sur les articles et les modifications sont générées automatiquement." value={draft.features_text} onChange={(v) => set("features_text", v)} />
            <label className="flex items-center gap-3 text-sm font-semibold" style={{ color: INK }}>
              <Toggle checked={draft.is_popular} onChange={(v) => set("is_popular", v)} color={primary} label="Afficher comme recommandé" />
              Afficher comme recommandé
            </label>
            <p className="text-xs" style={{ color: MUTED }}>Aperçu du prix : <b style={{ color: INK }}>{fmtPrice(Number(draft.price) || 0, draft.currency)}</b>{Number(draft.price) > 0 && ` / ${draft.billing.toLowerCase()}`}</p>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => setDraft(null)}>Annuler</Button>
              <Button variant="primary" color={primary} className="flex-1" disabled={saving || !draft.name.trim()} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
