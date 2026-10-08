"use client";
import { useMemo, useState } from "react";
import { Ban, CheckCircle2, ExternalLink, Key, Search, Star, Trash2 } from "lucide-react";
import { Badge, BORDER, Button, Card, Drawer, INK, MUTED, SectionHeader, Skeleton, fmtDate, fmtPrice } from "./ui";
import type { Plan, Shop } from "./types";

type Sort = "recent" | "name" | "products" | "rating";
const PAGE = 20;

const planName = (plans: Plan[], id: string) => plans.find((p) => p.id === id)?.name ?? id;
const planTone = (id: string) => (id === "annual" ? "amber" : id === "pro" ? "blue" : "gray") as "amber" | "blue" | "gray";

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <span className="rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0"
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>{name[0]?.toUpperCase()}</span>
  );
}

export default function ShopsSection({
  shops, plans, loading, primary, onChangePlan, onToggleSuspend, onDelete, onSendReset,
}: {
  shops: Shop[]; plans: Plan[]; loading: boolean; primary: string;
  onChangePlan: (shop: Shop, plan: string) => void;
  onToggleSuspend: (shop: Shop) => void;
  onDelete: (shop: Shop) => void;
  onSendReset: (shop: Shop) => void;
}) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [hideDemo, setHideDemo] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");
  const [limit, setLimit] = useState(PAGE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const demoCount = shops.filter((s) => s.is_demo).length;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = shops.filter((s) =>
      (!q || s.shop_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
      (planFilter === "all" || s.plan === planFilter) &&
      (status === "all" || (status === "suspended") === !!s.suspended) &&
      (!hideDemo || !s.is_demo)
    );
    const by: Record<Sort, (a: Shop, b: Shop) => number> = {
      recent: (a, b) => b.created_at.localeCompare(a.created_at),
      name: (a, b) => a.shop_name.localeCompare(b.shop_name, "fr"),
      products: (a, b) => (b.product_count ?? 0) - (a.product_count ?? 0),
      rating: (a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0),
    };
    return [...list].sort(by[sort]);
  }, [shops, search, planFilter, status, hideDemo, sort]);

  const selected = shops.find((s) => s.id === selectedId) ?? null;
  const select = "rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-0 flex-1 basis-[calc(50%-0.375rem)] sm:basis-auto sm:flex-none";
  const shown = filtered.slice(0, limit);

  return (
    <>
      <SectionHeader title="Boutiques" subtitle={`${filtered.length} sur ${shops.length} boutique(s)`} />

      <Card padded={false}>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b" style={{ borderColor: BORDER }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} placeholder="Rechercher un nom ou un email"
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30" style={{ borderColor: BORDER }} aria-label="Rechercher une boutique" />
          </div>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={select} style={{ borderColor: BORDER }} aria-label="Filtrer par forfait">
            <option value="all">Tous les forfaits</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={select} style={{ borderColor: BORDER }} aria-label="Filtrer par statut">
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="suspended">Suspendues</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select} style={{ borderColor: BORDER }} aria-label="Trier">
            <option value="recent">Plus récentes</option>
            <option value="name">Nom (A à Z)</option>
            <option value="products">Plus d&apos;articles</option>
            <option value="rating">Mieux notées</option>
          </select>
          {demoCount > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: MUTED }}>
              <input type="checkbox" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
              Masquer la démo
            </label>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-bold" style={{ color: INK }}>Aucune boutique ne correspond</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Modifie la recherche ou les filtres.</p>
          </div>
        ) : (
          <>
            {/* Tableau (écrans larges) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                    <th className="px-5 py-3 font-bold">Boutique</th>
                    <th className="px-3 py-3 font-bold">Forfait</th>
                    <th className="px-3 py-3 font-bold text-right">Articles</th>
                    <th className="px-3 py-3 font-bold text-right">Note</th>
                    <th className="px-3 py-3 font-bold">Inscrite le</th>
                    <th className="px-5 py-3 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} onClick={() => setSelectedId(s.id)} tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(s.id); }}
                      className={`cursor-pointer border-t transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 ${s.suspended ? "opacity-60" : ""}`} style={{ borderColor: BORDER }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={s.shop_name} color={primary} />
                          <div className="min-w-0">
                            <div className="font-bold truncate flex items-center gap-2" style={{ color: INK }}>{s.shop_name}{s.is_demo && <Badge tone="amber">Démo</Badge>}</div>
                            <div className="text-xs truncate" style={{ color: MUTED }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><Badge tone={planTone(s.plan)}>{planName(plans, s.plan)}</Badge></td>
                      <td className="px-3 py-3 text-right font-bold" style={{ color: INK }}>{s.product_count ?? 0}</td>
                      <td className="px-3 py-3 text-right">
                        {s.avg_rating ? <span className="inline-flex items-center gap-1 font-bold text-amber-500"><Star size={12} fill="currentColor" />{s.avg_rating.toFixed(1).replace(".", ",")}</span> : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap" style={{ color: MUTED }}>{fmtDate(s.created_at)}</td>
                      <td className="px-5 py-3">{s.suspended ? <Badge tone="red">Suspendue</Badge> : <Badge tone="green">Active</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartes (mobile) */}
            <ul className="md:hidden divide-y" style={{ borderColor: BORDER }}>
              {shown.map((s) => (
                <li key={s.id}>
                  <button onClick={() => setSelectedId(s.id)} className={`w-full text-left p-4 flex items-center gap-3 ${s.suspended ? "opacity-60" : ""}`}>
                    <Avatar name={s.shop_name} color={primary} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate" style={{ color: INK }}>{s.shop_name}</div>
                      <div className="text-xs truncate" style={{ color: MUTED }}>{s.product_count ?? 0} article(s) · {planName(plans, s.plan)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {s.suspended ? <Badge tone="red">Suspendue</Badge> : s.is_demo ? <Badge tone="amber">Démo</Badge> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {filtered.length > limit && (
              <div className="p-4 text-center border-t" style={{ borderColor: BORDER }}>
                <Button onClick={() => setLimit((l) => l + PAGE)}>Afficher plus ({filtered.length - limit} restantes)</Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title="Détail de la boutique">
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar name={selected.shop_name} color={primary} size={56} />
              <div className="min-w-0">
                <div className="font-extrabold text-lg truncate" style={{ color: INK }}>{selected.shop_name}</div>
                <div className="text-sm truncate" style={{ color: MUTED }}>{selected.email}</div>
                <div className="flex gap-1.5 mt-1.5">
                  {selected.suspended ? <Badge tone="red">Suspendue</Badge> : <Badge tone="green">Active</Badge>}
                  {selected.is_demo && <Badge tone="amber">Démo</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: "Articles", v: String(selected.product_count ?? 0) },
                { l: "Note", v: selected.avg_rating ? selected.avg_rating.toFixed(1).replace(".", ",") : "—" },
                { l: "Inscrite", v: fmtDate(selected.created_at) },
              ].map((k) => (
                <div key={k.l} className="rounded-xl p-3" style={{ background: "#F7F8FA" }}>
                  <div className="font-extrabold text-sm" style={{ color: INK }}>{k.v}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>{k.l}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Forfait</div>
              <div className="flex flex-col gap-2">
                {plans.map((p) => {
                  const current = selected.plan === p.id;
                  return (
                    <button key={p.id} onClick={() => !current && onChangePlan(selected, p.id)} aria-pressed={current}
                      className="press w-full text-left rounded-xl border-2 px-4 py-3 flex items-center justify-between transition"
                      style={current ? { borderColor: primary, background: primary + "0D" } : { borderColor: BORDER }}>
                      <span>
                        <span className="font-bold text-sm" style={{ color: INK }}>{p.name}</span>
                        <span className="block text-xs" style={{ color: MUTED }}>{p.article_limit >= 999 ? "Articles illimités" : `${p.article_limit} articles`}</span>
                      </span>
                      <span className="flex items-center gap-2 text-sm font-bold" style={{ color: current ? primary : MUTED }}>
                        {fmtPrice(p.price, p.currency)}{current && <CheckCircle2 size={16} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a href={`/shop/${selected.id}`} target="_blank" rel="noreferrer"
                className="press inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white hover:opacity-90" style={{ background: primary }}>
                <ExternalLink size={15} /> Voir la vitrine
              </a>
              <Button onClick={() => onSendReset(selected)}><Key size={15} /> Envoyer un lien de réinitialisation</Button>
              <Button onClick={() => onToggleSuspend(selected)}>
                {selected.suspended ? <><CheckCircle2 size={15} /> Réactiver la boutique</> : <><Ban size={15} /> Suspendre la boutique</>}
              </Button>
              <Button variant="danger" onClick={() => onDelete(selected)}><Trash2 size={15} /> Supprimer définitivement</Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
