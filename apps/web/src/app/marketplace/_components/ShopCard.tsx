"use client";
import Link from "next/link";
import { Star } from "lucide-react";
import { optimizeImage } from "@/lib/image";
import { BUSINESS_TYPES } from "@/lib/businessTypes";

export const INK = "#0E1526";
export const MUTED = "#5B6472";
export const BORDER = "#DCE1E7";
export const BG = "#EDF0F4";

export type Shop = {
  id: string; shop_name: string; slogan: string | null;
  description: string | null; shop_logo_url: string | null;
  shop_cover_url: string | null; city: string | null;
  business_type: string | null; created_at: string; product_count: number;
  avg_rating: number; rating_count: number;
};

const BIZ_COLORS: Record<string, string> = {
  mode: "#6366f1", chaussures: "#f59e0b", beaute: "#ec4899",
  sacs: "#8b5cf6", bijoux: "#d97706", electronique: "#3b82f6",
  alimentation: "#22c55e", autre: "#64748b",
};

/** Retire les codes de localisation bruts (ex. « 652Q+X54 ») et ne garde qu'un lieu lisible. */
export const cleanPlace = (raw: string | null) => {
  if (!raw) return "";
  const parts = raw.split(",").map((p) => p.trim()).filter((p) => p && !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,}/i.test(p));
  return parts.slice(0, 2).join(", ");
};

export const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();

const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 30 * 86400000;

export default function ShopCard({ shop, primary, index = 0 }: { shop: Shop; primary: string; index?: number }) {
  const biz = BUSINESS_TYPES.find((b) => b.id === shop.business_type) || BUSINESS_TYPES[0];
  const accent = BIZ_COLORS[shop.business_type || "autre"] || primary;
  const place = cleanPlace(shop.city);
  const count = shop.product_count;

  return (
    <Link
      href={`/shop/${shop.id}`}
      className="stagger-in card-lift press group bg-white rounded-[20px] overflow-hidden flex flex-col h-full focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{ border: `1px solid ${BORDER}`, ["--i" as string]: Math.min(index, 12) }}
    >
      <div className="relative h-[132px] sm:h-[140px] flex items-center justify-center"
        style={shop.shop_cover_url ? undefined : { background: `linear-gradient(135deg, ${accent}, ${accent}b3)` }}>
        {shop.shop_cover_url
          ? <img src={optimizeImage(shop.shop_cover_url, 700)} alt="" loading="lazy" className="zoom-img absolute inset-0 w-full h-full object-cover" />
          : <span className="text-[44px] opacity-90">{biz.emoji}</span>}
        {shop.shop_cover_url && <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(15,23,42,.55), transparent)" }} />}
        <span className="absolute top-3 right-3 max-w-[70%] truncate text-[11px] font-bold text-white px-2.5 py-1 rounded-[10px] backdrop-blur-sm" style={{ background: "rgba(15,23,42,.72)" }}>
          {stripEmoji(biz.label)}
        </span>
        <div className="absolute left-4 -bottom-6 w-[52px] h-[52px] rounded-2xl border-[3px] border-white bg-white overflow-hidden flex items-center justify-center font-extrabold text-[22px]"
          style={{ color: accent, boxShadow: "0 6px 14px rgba(15,23,42,.14)" }}>
          {shop.shop_logo_url
            ? <img src={optimizeImage(shop.shop_logo_url, 150)} alt={shop.shop_name} className="w-full h-full object-cover" />
            : shop.shop_name[0].toUpperCase()}
        </div>
      </div>

      <div className="pt-9 px-4 pb-4 flex-1 flex flex-col">
        <p className="text-base font-extrabold truncate" style={{ color: INK }}>{shop.shop_name}</p>
        <p className="text-[13px] truncate min-h-[19px]" style={{ color: MUTED }}>{shop.slogan || " "}</p>
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {shop.avg_rating > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-500">
              <Star size={12} fill="currentColor" />{shop.avg_rating.toFixed(1).replace(".", ",")}
              <span className="font-medium" style={{ color: MUTED }}>({shop.rating_count})</span>
            </span>
          ) : isNew(shop.created_at) ? (
            <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Nouveau</span>
          ) : (
            <span style={{ color: MUTED }}>Pas encore d&apos;avis</span>
          )}
        </div>
        <p className="mt-1.5 text-xs truncate" style={{ color: MUTED }}>
          {count > 0 ? `${count} ${biz.ui.itemLabel}${count > 1 ? "s" : ""}` : "Bientôt disponible"}
          {place ? ` · ${place}` : ""}
        </p>
      </div>
    </Link>
  );
}
