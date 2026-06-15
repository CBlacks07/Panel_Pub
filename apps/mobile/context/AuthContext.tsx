import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getBusinessType, BusinessType } from "../lib/businessTypes";

type UserProfile = {
  shop_name: string;
  business_type: string;
  plan: string;
  plan_expires_at: string | null;
  phone_whatsapp: string | null;
  total_articles_created: number;
  shop_logo_url: string | null;
  shop_name_display?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  bizType: BusinessType;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEFAULT_BIZ = getBusinessType("mode");

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null,
  bizType: DEFAULT_BIZ, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Flag pour éviter la race condition getSession + onAuthStateChange
  const profileLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    // Utiliser uniquement onAuthStateChange comme source de vérité
    // getSession() déclenche AUSSI onAuthStateChange → on n'appelle loadProfile qu'une fois
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Éviter le double chargement si déjà chargé pour ce userId
        if (profileLoadedRef.current !== newSession.user.id) {
          profileLoadedRef.current = newSession.user.id;
          loadProfile(newSession.user.id);
        }
      } else {
        profileLoadedRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("shop_name, business_type, plan, plan_expires_at, phone_whatsapp, total_articles_created, shop_logo_url")
        .eq("id", userId)
        .single();
      if (error) throw error;
      if (data) {
        // Plan effectif : un forfait payant expiré est traité comme gratuit
        const expired = data.plan !== "free"
          && !!data.plan_expires_at
          && new Date(data.plan_expires_at).getTime() < Date.now();
        setProfile({ ...data, plan: expired ? "free" : data.plan });
      }
    } catch (e) {
      console.warn("[AuthContext] loadProfile error:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      profileLoadedRef.current = null; // forcer le rechargement
      await loadProfile(session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    profileLoadedRef.current = null;
    setProfile(null);
  };

  const bizType = getBusinessType(profile?.business_type || "mode");

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null,
      profile, bizType, loading,
      signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
