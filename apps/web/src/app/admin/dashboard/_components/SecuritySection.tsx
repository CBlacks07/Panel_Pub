"use client";
import { useState } from "react";
import { Eye, EyeOff, LogOut, ShieldCheck } from "lucide-react";
import { Button, Card, INK, MUTED, SectionHeader } from "./ui";

const MIN = 10;

export default function SecuritySection({ primary, onLogout }: { primary: string; onLogout: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const strength = Math.min(4, [next.length >= MIN, /[A-Z]/.test(next) && /[a-z]/.test(next), /\d/.test(next), /[^A-Za-z0-9]/.test(next)].filter(Boolean).length);
  const strengthLabel = ["", "Faible", "Moyen", "Bon", "Excellent"][strength];
  const strengthColor = ["#E5E8EC", "#EF4444", "#F59E0B", "#10B981", "#059669"][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < MIN) { setMsg({ ok: false, text: `Le nouveau mot de passe doit faire au moins ${MIN} caractères.` }); return; }
    if (next !== confirmNext) { setMsg({ ok: false, text: "La confirmation ne correspond pas." }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: data.error || "Échec du changement." }); return; }
      setCurrent(""); setNext(""); setConfirmNext("");
      setMsg({ ok: true, text: "Mot de passe modifié. Utilise-le à ta prochaine connexion." });
    } catch {
      setMsg({ ok: false, text: "Erreur réseau, réessaie." });
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400";

  return (
    <>
      <SectionHeader title="Sécurité" subtitle="Accès au panneau d'administration." />
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
        <Card>
          <h2 className="font-extrabold flex items-center gap-2 mb-1" style={{ color: INK }}><ShieldCheck size={18} style={{ color: primary }} /> Mot de passe admin</h2>
          <p className="text-sm mb-5" style={{ color: MUTED }}>Au moins {MIN} caractères. Le mot de passe actuel est demandé pour valider le changement.</p>
          <form onSubmit={submit} className="space-y-4 max-w-md">
            <label className="block"><span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>Mot de passe actuel</span>
              <input type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} style={{ borderColor: "#E5E8EC" }} /></label>
            <label className="block"><span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>Nouveau mot de passe</span>
              <div className="relative">
                <input type={show ? "text" : "password"} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={`${input} pr-11`} style={{ borderColor: "#E5E8EC" }} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Masquer" : "Afficher"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
              {next && (
                <div className="mt-2">
                  <div className="flex gap-1">{[1, 2, 3, 4].map((i) => <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= strength ? strengthColor : "#E5E8EC" }} />)}</div>
                  <div className="text-xs mt-1" style={{ color: MUTED }}>Robustesse : {strengthLabel}</div>
                </div>
              )}</label>
            <label className="block"><span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>Confirmer</span>
              <input type={show ? "text" : "password"} autoComplete="new-password" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} className={input} style={{ borderColor: "#E5E8EC" }} /></label>
            <div className="flex items-center gap-4 flex-wrap">
              <Button type="submit" variant="primary" color={primary} disabled={busy || !current || !next}>{busy ? "Enregistrement..." : "Changer le mot de passe"}</Button>
              {msg && <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`} role="status">{msg.text}</span>}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="font-extrabold mb-1" style={{ color: INK }}>Session</h2>
          <p className="text-sm mb-4" style={{ color: MUTED }}>La session admin expire au bout de 8 heures.</p>
          <Button onClick={onLogout} className="w-full"><LogOut size={15} /> Se déconnecter</Button>
        </Card>
      </div>
    </>
  );
}
