"use client";
import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button, BORDER, Card, INK, MUTED, SectionHeader, TextField, Toggle } from "./ui";
import type { Config } from "./types";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dmiuhdvmf";
const UPLOAD_PRESET = "panel_pub_unsigned";

/** Aperçu en direct de la bannière de la marketplace avec les textes saisis. */
function BannerPreview({ config, primary }: { config: Config; primary: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, #142B6B 0%, ${primary} 100%)` }}>
      <div className="p-6">
        <div className="text-xl font-extrabold text-white leading-tight">{config.marketplace_banner_title || "Titre de la bannière"}</div>
        <div className="text-sm text-white/85 mt-2">{config.marketplace_banner_subtitle || "Sous-titre de la bannière"}</div>
        <div className="mt-4 inline-block text-sm font-bold px-4 py-2 rounded-xl" style={{ background: "#fff", color: primary }}>
          {config.vendor_cta || "Devenir vendeur"}
        </div>
      </div>
    </div>
  );
}

export default function ConfigSection({
  config, savedConfig, primary, onChange, onSave, onReset, saving,
}: {
  config: Config; savedConfig: Config; primary: string; saving: boolean;
  onChange: (key: string, value: string) => void; onSave: () => void; onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const keys = Object.keys({ ...savedConfig, ...config }).filter((k) => k !== "admin_password_hash");
  const dirty = keys.some((k) => (config[k] ?? "") !== (savedConfig[k] ?? ""));
  const v = (k: string) => config[k] ?? "";

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file); form.append("upload_preset", UPLOAD_PRESET); form.append("folder", "boutiki/logo");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!data.secure_url) throw new Error("upload");
      onChange("logo_url", data.secure_url);
    } catch {
      setUploadError("L'envoi de l'image a échoué. Réessaie ou colle une URL.");
    } finally {
      setUploading(false); e.target.value = "";
    }
  };

  const Row = ({ k, label, hint }: { k: string; label: string; hint: string }) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><div className="text-[13px] font-bold" style={{ color: INK }}>{label}</div><div className="text-xs" style={{ color: MUTED }}>{hint}</div></div>
      <Toggle checked={v(k) === "true"} onChange={(on) => onChange(k, on ? "true" : "false")} color={primary} label={label} />
    </div>
  );

  return (
    <>
      <SectionHeader title="Configuration" subtitle="Textes, couleurs et réglages affichés dans l'application et sur le site." />

      <div className="grid xl:grid-cols-[1fr_380px] gap-4 items-start pb-24">
        <div className="space-y-4">
          <Card>
            <h2 className="font-extrabold mb-4" style={{ color: INK }}>Identité</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Nom de l'application" hint="Affiché sur l'écran de démarrage" value={v("app_name")} onChange={(x) => onChange("app_name", x)} />
              <div>
                <span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>Couleur principale</span>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Choisir la couleur" value={/^#[0-9a-f]{6}$/i.test(v("primary_color")) ? v("primary_color") : "#2563EB"}
                    onChange={(e) => onChange("primary_color", e.target.value)} className="w-11 h-11 rounded-xl border cursor-pointer p-1 bg-white" style={{ borderColor: BORDER }} />
                  <input value={v("primary_color")} onChange={(e) => onChange("primary_color", e.target.value)}
                    className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30" style={{ borderColor: BORDER }} aria-label="Code couleur" />
                </div>
                <span className="block text-xs mt-1" style={{ color: MUTED }}>Boutons et accents</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>Logo</span>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0" style={{ borderColor: BORDER }}>
                  {v("logo_url") ? <img src={v("logo_url")} alt="Logo actuel" className="w-full h-full object-cover" /> : <ImageUp size={22} className="text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <input value={v("logo_url")} onChange={(e) => onChange("logo_url", e.target.value)} placeholder="https://res.cloudinary.com/..."
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" style={{ borderColor: BORDER }} aria-label="URL du logo" />
                  <div className="mt-2 flex items-center gap-3">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
                    <Button onClick={() => fileRef.current?.click()} disabled={uploading}><ImageUp size={15} />{uploading ? "Envoi..." : "Envoyer une image"}</Button>
                    {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-extrabold mb-4" style={{ color: INK }}>Écran de démarrage</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Titre" hint="Grand titre au démarrage" value={v("splash_title")} onChange={(x) => onChange("splash_title", x)} />
              <TextField label="Slogan principal" hint="Sous le logo" value={v("app_tagline")} onChange={(x) => onChange("app_tagline", x)} />
            </div>
            <div className="mt-4">
              <TextField label="Sous-titre" multiline hint="Texte descriptif au démarrage" value={v("splash_subtitle")} onChange={(x) => onChange("splash_subtitle", x)} />
            </div>
          </Card>

          <Card>
            <h2 className="font-extrabold mb-4" style={{ color: INK }}>Marketplace</h2>
            <div className="grid gap-4">
              <TextField label="Titre de la bannière" value={v("marketplace_banner_title")} onChange={(x) => onChange("marketplace_banner_title", x)} />
              <TextField label="Sous-titre de la bannière" multiline value={v("marketplace_banner_subtitle")} onChange={(x) => onChange("marketplace_banner_subtitle", x)} />
              <TextField label="Texte du bouton vendeur" hint="Bouton d'inscription vendeur" value={v("vendor_cta")} onChange={(x) => onChange("vendor_cta", x)} />
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: BORDER }}>
              <Row k="marketplace_enabled" label="Marketplace activée" hint="Affiche ou masque la marketplace pour les visiteurs" />
              <Row k="ratings_enabled" label="Notation activée" hint="Permet aux clients de noter les boutiques" />
            </div>
          </Card>

          <Card>
            <h2 className="font-extrabold mb-4" style={{ color: INK }}>Contact</h2>
            <TextField label="WhatsApp du support" hint="Numéro pour les abonnements, au format international (ex. +22893914694)" value={v("support_whatsapp")} onChange={(x) => onChange("support_whatsapp", x)} />
          </Card>
        </div>

        <div className="xl:sticky xl:top-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>Aperçu de la bannière</div>
          <BannerPreview config={config} primary={/^#[0-9a-f]{6}$/i.test(v("primary_color")) ? v("primary_color") : primary} />
          <p className="text-xs" style={{ color: MUTED }}>L&apos;aperçu se met à jour pendant la saisie. Rien n&apos;est publié avant « Enregistrer ».</p>
        </div>
      </div>

      {/* Barre d'enregistrement fixe, visible seulement quand il y a des changements */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 sheet-up flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl text-white" style={{ background: INK }} role="region" aria-label="Modifications non enregistrées">
          <span className="text-sm font-semibold">Modifications non enregistrées</span>
          <button onClick={onReset} className="text-sm font-bold text-white/70 hover:text-white">Annuler</button>
          <button onClick={onSave} disabled={saving} className="press text-sm font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: primary }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      )}
    </>
  );
}
