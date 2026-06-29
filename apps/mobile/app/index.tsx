import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

/**
 * Route d'entrée : pas de splash JS. Le splash natif (expo-splash-screen)
 * reste affiché pendant le chargement, puis on redirige directement vers
 * l'app — aucun second écran logo.
 */
export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/(app)/dashboard" : "/marketplace");
  }, [loading, session]);

  return null;
}
