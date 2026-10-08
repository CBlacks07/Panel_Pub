"use client";
import { useMemo } from "react";
import { Package, Star, Store, TrendingUp, AlertCircle } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import { Badge, BORDER, Card, INK, MUTED, SectionHeader, Skeleton, fmtDate, fmtNumber } from "./ui";
import type { SectionId, Shop, Stats } from "./types";

const PLAN_META: Record<string, { label: string; color: string }> = {
  free: { label: "Gratuit", color: "#94A3B8" },
  pro: { label: "Pro", color: "#2563EB" },
  annual: { label: "Annuel", color: "#F59E0B" },
};
const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "").trim();
const bizLabel = (id: string) => {
  const t = BUSINESS_TYPES.find((b) => b.id === id);
  return t ? stripEmoji(t.label) : id;
};

function Kpi({ label, value, hint, icon, color }: { label: string; value: string; hint?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="card-lift">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: MUTED }}>{label}</span>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "18", color }}>{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight" style={{ color: INK }}>{value}</div>
      {hint && <div className="text-xs mt-1" style={{ color: MUTED }}>{hint}</div>}
    </Card>
  );
}

/** Inscriptions par jour sur les 30 derniers jours (barres SVG, sans dépendance). */
function SignupChart({ shops, color }: { shops: Shop[]; color: string }) {
  const days = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 29);
    const buckets = Array.from({ length: 30 }, (_, i) => ({ date: new Date(start.getTime() + i * 86400000), count: 0 }));
    shops.forEach((s) => {
      const idx = Math.floor((new Date(s.created_at).getTime() - start.getTime()) / 86400000);
      if (idx >= 0 && idx < 30) buckets[idx].count++;
    });
    return buckets;
  }, [shops]);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((n, d) => n + d.count, 0);

  if (total === 0) {
    return <div className="h-40 flex items-center justify-center text-sm rounded-xl" style={{ background: "#F7F8FA", color: MUTED }}>Aucune inscription sur les 30 derniers jours</div>;
  }
  return (
    <div>
      <svg viewBox="0 0 300 100" className="w-full h-40" preserveAspectRatio="none" role="img" aria-label={`${total} inscriptions sur 30 jours`}>
        {[25, 50, 75].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke={BORDER} strokeWidth="0.5" />)}
        {days.map((d, i) => {
          const h = (d.count / max) * 92;
          return (
            <rect key={i} x={i * 10 + 1.5} y={100 - h} width="7" height={Math.max(h, d.count ? 2 : 0)} rx="1.5" fill={color} opacity={d.count ? 1 : 0.15}>
              <title>{`${d.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} : ${d.count}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] mt-1" style={{ color: MUTED }}>
        <span>{days[0].date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

export default function Overview({
  stats, shops, loading, includeDemo, onToggleDemo, primary, onNavigate,
}: {
  stats: Stats; shops: Shop[]; loading: boolean; includeDemo: boolean;
  onToggleDemo: (v: boolean) => void; primary: string; onNavigate: (s: SectionId) => void;
}) {
  const visible = useMemo(() => (includeDemo ? shops : shops.filter((s) => !s.is_demo)), [shops, includeDemo]);
  const demoCount = shops.filter((s) => s.is_demo).length;
  const planTotal = Object.values(stats.planCount).reduce((a, b) => a + b, 0);
  const suspended = visible.filter((s) => s.suspended);
  const empty = visible.filter((s) => !s.suspended && (s.product_count ?? 0) === 0);
  const recent = visible.slice(0, 5);

  return (
    <>
      <SectionHeader
        title="Vue d'ensemble"
        subtitle="L'activité de la plateforme en un coup d'œil."
        action={demoCount > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: MUTED }}>
            <input type="checkbox" checked={includeDemo} onChange={(e) => onToggleDemo(e.target.checked)} />
            Inclure les {demoCount} comptes de démo
          </label>
        )}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[118px]" />) : (
          <>
            <Kpi label="Boutiques" value={fmtNumber(stats.shops)} hint={`${stats.newShops30d} sur 30 jours`} icon={<Store size={18} />} color={primary} />
            <Kpi label="Articles" value={fmtNumber(stats.products)} hint={stats.shops ? `${(stats.products / stats.shops).toFixed(1).replace(".", ",")} par boutique` : undefined} icon={<Package size={18} />} color="#0EA5E9" />
            <Kpi label="Avis clients" value={fmtNumber(stats.ratings)} icon={<Star size={18} />} color="#F59E0B" />
            <Kpi label="Nouvelles (7 j)" value={fmtNumber(stats.newShops7d)} hint="Cette semaine" icon={<TrendingUp size={18} />} color="#10B981" />
          </>
        )}
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-2">
          <h2 className="font-extrabold mb-4" style={{ color: INK }}>Inscriptions, 30 derniers jours</h2>
          <SignupChart shops={visible} color={primary} />
        </Card>

        <Card>
          <h2 className="font-extrabold mb-4" style={{ color: INK }}>Répartition par forfait</h2>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "#EEF1F5" }}>
            {Object.keys(PLAN_META).map((k) => {
              const c = stats.planCount[k] || 0;
              return c ? <div key={k} style={{ width: `${(c / planTotal) * 100}%`, background: PLAN_META[k].color }} title={`${PLAN_META[k].label} : ${c}`} /> : null;
            })}
          </div>
          <ul className="mt-4 space-y-2.5">
            {Object.entries(PLAN_META).map(([k, m]) => {
              const c = stats.planCount[k] || 0;
              const pct = planTotal ? Math.round((c / planTotal) * 100) : 0;
              return (
                <li key={k} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: INK }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />{m.label}</span>
                  <span style={{ color: MUTED }}><b style={{ color: INK }}>{c}</b> · {pct} %</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <Card>
          <h2 className="font-extrabold mb-4" style={{ color: INK }}>Types de boutiques</h2>
          {Object.keys(stats.bizCount).length === 0 ? <p className="text-sm" style={{ color: MUTED }}>Aucune donnée.</p> : (
            <ul className="space-y-3">
              {Object.entries(stats.bizCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = stats.shops ? Math.round((count / stats.shops) * 100) : 0;
                return (
                  <li key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold" style={{ color: INK }}>{bizLabel(type)}</span>
                      <span style={{ color: MUTED }}>{count} · {pct} %</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#EEF1F5" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold" style={{ color: INK }}>Dernières inscriptions</h2>
            <button onClick={() => onNavigate("shops")} className="text-xs font-bold hover:underline" style={{ color: primary }}>Tout voir</button>
          </div>
          {recent.length === 0 ? <p className="text-sm" style={{ color: MUTED }}>Aucune boutique.</p> : (
            <ul className="space-y-3">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0" style={{ background: primary }}>{s.shop_name[0]?.toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate" style={{ color: INK }}>{s.shop_name}</div>
                    <div className="text-xs" style={{ color: MUTED }}>{fmtDate(s.created_at)}</div>
                  </div>
                  {s.is_demo && <Badge tone="amber">Démo</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-extrabold mb-4" style={{ color: INK }}>À surveiller</h2>
          {suspended.length === 0 && empty.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>Rien à signaler.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {suspended.length > 0 && (
                <li className="flex items-start gap-2"><AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <span style={{ color: INK }}><b>{suspended.length}</b> boutique(s) suspendue(s) : {suspended.slice(0, 3).map((s) => s.shop_name).join(", ")}</span></li>
              )}
              {empty.length > 0 && (
                <li className="flex items-start gap-2"><AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span style={{ color: INK }}><b>{empty.length}</b> boutique(s) sans aucun article : {empty.slice(0, 3).map((s) => s.shop_name).join(", ")}</span></li>
              )}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
