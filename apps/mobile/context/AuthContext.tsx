import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getBusinessType, BusinessType } from "../lib/businessTypes";

type UserProfile = {
  shop_name: string;
  business_type: string;
  plan: string;
  phone_whatsapp: string | null;
  total_articles_created: number;
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
  session: null,
  user: null,
  profile: null,
  bizType: DEFAULT_BIZ,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("shop_name, business_type, plan, phone_whatsapp, total_articles_created")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
