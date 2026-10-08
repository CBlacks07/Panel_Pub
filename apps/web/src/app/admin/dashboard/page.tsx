"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ExternalLink, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Store, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BG, BORDER, ConfirmDialog, ConfirmState, INK, ToastHost, useToasts } from "./_components/ui";
import Overview from "./_components/Overview";
import ShopsSection from "./_components/ShopsSection";
import PlansSection from "./_components/PlansSection";
import ConfigSection from "./_components/ConfigSection";
import SecuritySection from "./_components/SecuritySection";
import { EMPTY_STATS, type Config, type Plan, type SectionId, type Shop, type Stats } from "./_components/types";

const NAV: { id: SectionId; label: string; icon: typeof Store }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "shops", label: "Boutiques", icon: Store },
  { id: "plans", label: "Forfaits", icon: Briefcase },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
];
const isSection = (v: string): v is SectionId => NAV.some((n) => n.id === v);

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error };
  } catch {
    return { ok: false, error: "Erreur réseau" };
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({});
  const [savedConfig, setSavedConfig] = useState<Config>({});
  const [saving, setSaving] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [includeDemo, setIncludeDemo] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const { toasts, push } = useToasts();

  const primary = savedConfig["primary_color"] || "#2563EB";
  const appName = savedConfig["app_name"] || "Boutiki";

  // Section mémorisée dans l'URL (#shops…) : le rechargement garde la page courante.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (isSection(h)) setSection(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = useCallback((id: SectionId) => {
    setSection(id); setNavOpen(false);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }, []);

  const loadStats = useCallback(async (withDemo: boolean) => {
    const res = await fetch(`/api/admin/stats${withDemo ? "?include_demo=1" : ""}`).catch(() => null);
    if (!res?.ok) return;
    const s = await res.json();
    setStats({
      shops: s.totalShops || 0, products: s.totalProducts || 0, ratings: s.totalRatings || 0,
      newShops7d: s.newShops7d || 0, newShops30d: s.newShops30d || 0,
      planCount: s.planCount || {}, bizCount: s.bizCount || {},
    });
  }, []);

  useEffect(() => {
    (async () => {
      // La protection est assurée par le middleware (cookie httpOnly) ; les données sensibles passent par l'API serveur.
      const [{ data: cfg }, shopsRes, { data: plansData }] = await Promise.all([
        supabase.from("app_config").select("key, value"),
        fetch("/api/admin/shops").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        supabase.from("plans").select("*").order("sort_order"),
      ]);
      if (cfg) {
        const map: Config = {};
        cfg.forEach((r) => { map[r.key] = r.value; });
        setConfig(map); setSavedConfig(map);
      }
      if (shopsRes?.shops) setShops(shopsRes.shops);
      else push("Impossible de charger les boutiques.", false);
      if (plansData) setPlans(plansData as Plan[]);
      await loadStats(false);
      setLoading(false);
    })();
  }, [loadStats, push]);

  const toggleDemo = (v: boolean) => { setIncludeDemo(v); loadStats(v); };

  // ── Actions boutiques ──
  const patchShop = (id: string, patch: Partial<Shop>) => setShops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const changePlan = async (shop: Shop, plan: string) => {
    const r = await postJson("/api/admin/update-plan", { userId: shop.id, plan });
    if (!r.ok) { push(r.error || "Changement de forfait impossible.", false); return; }
    patchShop(shop.id, { plan });
    push(`Forfait de « ${shop.shop_name} » mis à jour`);
    loadStats(includeDemo);
  };

  const toggleSuspend = async (shop: Shop) => {
    const suspended = !shop.suspended;
    const r = await postJson("/api/admin/update-shop", { userId: shop.id, data: { suspended } });
    if (!r.ok) { push(r.error || "Action impossible.", false); return; }
    patchShop(shop.id, { suspended });
    push(suspended ? `« ${shop.shop_name} » suspendue` : `« ${shop.shop_name} » réactivée`);
  };

  const deleteShop = (shop: Shop) => setConfirm({
    title: "Supprimer cette boutique ?",
    message: `Le compte « ${shop.shop_name} » et tous ses articles seront supprimés définitivement. Cette action est irréversible.`,
    confirmLabel: "Supprimer définitivement",
    requireText: shop.shop_name,
    onConfirm: async () => {
      const r = await postJson("/api/admin/delete-user", { userId: shop.id });
      if (!r.ok) { push(r.error || "Suppression impossible.", false); return; }
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
      push(`« ${shop.shop_name} » supprimée`);
      loadStats(includeDemo);
    },
  });

  const sendReset = async (shop: Shop) => {
    const { error } = await supabase.auth.resetPasswordForEmail(shop.email, { redirectTo: `${window.location.origin}/reset-password` });
    push(error ? `Envoi impossible : ${error.message}` : `Lien envoyé à ${shop.email}`, !error);
  };

  // ── Forfaits ──
  const togglePlan = async (plan: Plan) => {
    const r = await postJson("/api/admin/plans", { id: plan.id, data: { active: !plan.active } });
    if (!r.ok) { push(r.error || "Modification impossible.", false); return; }
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, active: !p.active } : p)));
  };
  const savePlan = async (plan: Plan, data: Partial<Plan>) => {
    const r = await postJson("/api/admin/plans", { id: plan.id, data });
    if (!r.ok) { push(r.error || "Enregistrement impossible.", false); return false; }
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, ...data } : p)));
    push(`Forfait « ${data.name ?? plan.name} » enregistré`);
    return true;
  };

  // ── Configuration ──
  const saveConfig = async () => {
    setSaving(true);
    const r = await postJson("/api/admin/config", { entries: config });
    setSaving(false);
    if (!r.ok) { push(r.error ? `Enregistrement impossible : ${r.error}` : "Enregistrement impossible.", false); return; }
    setSavedConfig(config);
    push("Configuration enregistrée");
  };

  const logout = () => setConfirm({
    title: "Se déconnecter ?", message: "Tu devras ressaisir le mot de passe admin pour revenir.", confirmLabel: "Se déconnecter",
    onConfirm: async () => { await fetch("/api/admin/logout", { method: "POST" }).catch(() => null); router.push("/admin"); },
  });

  const logo = useMemo(() => savedConfig["logo_url"], [savedConfig]);

  const Nav = ({ onDark = true }: { onDark?: boolean }) => (
    <nav className="flex flex-col gap-1" aria-label="Navigation admin">
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = section === id;
        return (
          <button key={id} onClick={() => go(id)} aria-current={active ? "page" : undefined}
            className={`press relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            style={active ? { background: "rgba(255,255,255,.10)" } : undefined}>
            {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: primary }} />}
            <Icon size={18} />{label}
          </button>
        );
      })}
    </nav>
  );

  const Brand = () => (
    <div className="flex items-center gap-3 min-w-0">
      {logo ? <img src={logo} alt="" className="w-9 h-9 rounded-xl object-cover bg-white flex-shrink-0" />
        : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white flex-shrink-0" style={{ background: primary }}>{appName[0]?.toUpperCase()}</div>}
      <div className="min-w-0">
        <div className="font-extrabold text-white truncate leading-tight">{appName}</div>
        <div className="text-[11px] text-white/50 uppercase tracking-wide">Administration</div>
      </div>
    </div>
  );

  const Footer = () => (
    <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
      <a href="/marketplace" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5">
        <ExternalLink size={18} /> Voir le site
      </a>
      <button onClick={logout} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:text-red-200 hover:bg-white/5 text-left">
        <LogOut size={18} /> Déconnexion
      </button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK }}>
      {/* Menu latéral (grands écrans) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col p-5 gap-6 z-20" style={{ background: INK }}>
        <Brand />
        <div className="flex-1"><Nav /></div>
        <Footer />
      </aside>

      {/* En-tête mobile */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: INK }}>
        <Brand />
        <button onClick={() => setNavOpen(true)} aria-label="Ouvrir le menu" className="p-2 rounded-lg text-white hover:bg-white/10"><Menu size={22} /></button>
      </header>
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={() => setNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] flex flex-col p-5 gap-6" style={{ background: INK, animation: "drawerInLeft .3s var(--ease-out) both" }}>
            <div className="flex items-center justify-between"><Brand />
              <button onClick={() => setNavOpen(false)} aria-label="Fermer le menu" className="p-2 rounded-lg text-white hover:bg-white/10"><X size={20} /></button></div>
            <div className="flex-1"><Nav /></div>
            <Footer />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div key={section} className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-8 animate-fade-up">
          {section === "overview" && <Overview stats={stats} shops={shops} loading={loading} includeDemo={includeDemo} onToggleDemo={toggleDemo} primary={primary} onNavigate={go} />}
          {section === "shops" && <ShopsSection shops={shops} plans={plans} loading={loading} primary={primary} onChangePlan={changePlan} onToggleSuspend={toggleSuspend} onDelete={deleteShop} onSendReset={sendReset} />}
          {section === "plans" && <PlansSection plans={plans} primary={primary} onToggleActive={togglePlan} onSave={savePlan} />}
          {section === "config" && (
            <ConfigSection config={config} savedConfig={savedConfig} primary={primary} saving={saving}
              onChange={(k, v) => setConfig((c) => ({ ...c, [k]: v }))} onSave={saveConfig} onReset={() => setConfig(savedConfig)} />
          )}
          {section === "security" && <SecuritySection primary={primary} onLogout={logout} />}
        </div>
      </main>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      <ToastHost toasts={toasts} />
    </div>
  );
}
