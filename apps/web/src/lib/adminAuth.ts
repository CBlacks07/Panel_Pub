import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Secret de session admin, lu dans ADMIN_SESSION_SECRET.
 * Aucune valeur par défaut : si la variable est absente ou trop courte,
 * l'accès admin est refusé (fail closed).
 */
export function adminSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

/** Comparaison en temps constant de deux chaînes. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Vrai si la requête porte le cookie de session admin valide. */
export function isAdminRequest(request: NextRequest): boolean {
  const secret = adminSessionSecret();
  if (!secret) return false;
  const token = request.cookies.get("admin_session")?.value;
  return !!token && safeEqual(token, secret);
}
