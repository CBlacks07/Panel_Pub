"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

/** Palette « Design Pro » : fond neutre, encre bleu nuit, bordures douces. */
export const INK = "#0E1526";
export const MUTED = "#5B6472";
export const BORDER = "#E5E8EC";
export const BG = "#F7F8FA";

export const fmtNumber = (n: number) => n.toLocaleString("fr-FR");
export const fmtPrice = (price: number, currency: string) =>
  price === 0 ? "Gratuit" : `${fmtNumber(price)} ${currency}`;
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export function Card({ children, className = "", padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border ${padded ? "p-5 sm:p-6" : ""} ${className}`} style={{ borderColor: BORDER }}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: INK }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: MUTED }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "gray" | "green" | "amber" | "red" | "blue";
const TONES: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-700",
};
export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
export function Button({
  variant = "secondary", color, className = "", children, ...rest
}: { variant?: BtnVariant; color?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "press inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:pointer-events-none";
  const styles: Record<BtnVariant, string> = {
    primary: "text-white hover:opacity-90",
    secondary: "bg-white border text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return (
    <button
      {...rest}
      className={`${base} ${styles[variant]} ${className}`}
      style={{ ...(variant === "primary" ? { backgroundColor: color || INK } : {}), ...(variant === "secondary" ? { borderColor: BORDER } : {}), ...rest.style }}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, color, label }: { checked: boolean; onChange: (v: boolean) => void; color: string; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? color : "#D5DAE1" }}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function TextField({
  label, hint, value, onChange, multiline, mono, placeholder, type = "text",
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; mono?: boolean; placeholder?: string; type?: string;
}) {
  const cls = `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition ${mono ? "font-mono" : ""}`;
  return (
    <label className="block">
      <span className="block text-[13px] font-bold mb-1" style={{ color: INK }}>{label}</span>
      {multiline
        ? <textarea rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} style={{ borderColor: BORDER }} />
        : <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} style={{ borderColor: BORDER }} />}
      {hint && <span className="block text-xs mt-1" style={{ color: MUTED }}>{hint}</span>}
    </label>
  );
}

/** Panneau latéral (tiroir) : fermeture par Échap ou clic sur le fond. */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={title}
        className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
        style={{ animation: "drawerIn .3s var(--ease-out) both" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-extrabold" style={{ color: INK }}>{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export type ConfirmState = {
  title: string; message: string; confirmLabel: string;
  /** Si défini, l'utilisateur doit saisir ce texte pour valider (actions irréversibles). */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
} | null;

export function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTyped(""); setBusy(false); }, [state]);
  if (!state) return null;
  const blocked = !!state.requireText && typed.trim() !== state.requireText;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={onClose}>
      <div role="alertdialog" aria-modal="true" className="sheet-up bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"><AlertTriangle size={20} /></span>
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: INK }}>{state.title}</h3>
            <p className="text-sm mt-1" style={{ color: MUTED }}>{state.message}</p>
          </div>
        </div>
        {state.requireText && (
          <label className="block mt-4">
            <span className="text-xs font-bold" style={{ color: MUTED }}>Pour confirmer, saisis : <span className="font-mono" style={{ color: INK }}>{state.requireText}</span></span>
            <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" style={{ borderColor: BORDER }} />
          </label>
        )}
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={onClose} autoFocus={!state.requireText}>Annuler</Button>
          <button
            disabled={blocked || busy}
            onClick={async () => { setBusy(true); try { await state.onConfirm(); } finally { onClose(); } }}
            className="press flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "..." : state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type Toast = { id: number; msg: string; ok: boolean };
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const push = useCallback((msg: string, ok = true) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="sheet-up flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
          style={{ background: t.ok ? INK : "#dc2626" }}>
          {t.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{t.msg}
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}
