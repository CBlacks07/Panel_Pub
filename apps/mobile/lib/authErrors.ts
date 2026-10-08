/** Traduit une erreur Supabase Auth en message clair pour l'utilisateur. */
export function authErrorMessage(error: { message?: string; status?: number; code?: string }): string {
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";

  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect. Vérifie-les, ou crée un compte si tu n'en as pas encore.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Ton email n'est pas encore confirmé. Ouvre le lien reçu par email, puis reconnecte-toi.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429 || msg.includes("rate limit"))
    return "Trop de tentatives. Patiente quelques minutes avant de réessayer.";
  if (code === "user_banned" || msg.includes("banned"))
    return "Ce compte est suspendu. Contacte le support.";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Connexion impossible. Vérifie ta connexion internet et réessaie.";
  if (msg.includes("user already registered") || code === "user_already_exists")
    return "Un compte existe déjà avec cet email. Connecte-toi plutôt.";
  if (msg.includes("password should be at least") || code === "weak_password")
    return "Mot de passe trop court ou trop faible. Utilise au moins 6 caractères.";

  return "Une erreur est survenue. Réessaie dans un instant.";
}
