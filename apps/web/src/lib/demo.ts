/** Les comptes de démo (supabase/seed/demo-shops.mjs) ont tous un email en @boutiki-demo.test. */
export const DEMO_EMAIL_DOMAIN = "boutiki-demo.test";

export const isDemoEmail = (email?: string | null): boolean =>
  !!email && email.toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
