import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getPlanFeatures } from "../lib/planFeatures";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { ScreenHeader } from "../components/ScreenHeader";
import { Button } from "../components/ui/Button";
import { useConfig } from "../context/ConfigContext";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  article_limit: number;
  edit_cooldown_hours?: number;
  features: string[];
  is_popular: boolean;
};

/**
 * Page forfaits PUBLIQUE (visiteurs non connectés).
 * Accessible hors auth — voir le groupe public dans app/_layout.tsx.
 * Chaque carte mène à l'inscription.
 */
export default function ForfaitsScreen() {
  const router = useRouter();
  const { primary, config } = useConfig();
  const appName = config.app_name || "Boutiki";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setPlans(data.map((p) => ({ ...p, features: p.features as string[] })));
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Nos forfaits"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/marketplace"))}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Ouvre ta boutique sur {appName}</Text>
            <Text style={styles.introSub}>
              Commence gratuitement, passe à un forfait supérieur quand tu veux.
            </Text>
          </View>

          {plans.map((plan) => {
            const isPopular = plan.is_popular;
            return (
              <View
                key={plan.id}
                style={[styles.card, isPopular && { borderColor: primary, borderWidth: 2 }]}
              >
                {isPopular && (
                  <View style={[styles.popularBadge, { backgroundColor: primary }]}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.popularBadgeText}>Recommandé</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceWrap}>
                    {plan.price === 0 ? (
                      <>
                        <Text style={[styles.planPrice, { color: primary }]}>Gratuit</Text>
                        <Text style={styles.planCurrency}>pour toujours</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.planPrice, { color: primary }]}>
                          {plan.price.toLocaleString("fr-FR")}
                        </Text>
                        <Text style={styles.planCurrency}>{plan.currency}/{plan.billing}</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.features}>
                  {getPlanFeatures(plan).map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark" size={14} color={primary} />
                      <Text style={[styles.featureText, i < 2 && { fontWeight: "600", color: "#333" }]}>{f}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  label={plan.price === 0 ? "Commencer gratuitement" : `Choisir ${plan.name}`}
                  variant={isPopular ? "primary" : "soft"}
                  onPress={() => router.push("/(auth)/register")}
                />
              </View>
            );
          })}

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Déjà un compte ? <Text style={[styles.loginLinkBold, { color: primary }]}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F4" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  intro: { gap: 4, marginBottom: 4 },
  introTitle: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  introSub: { fontSize: 13, color: "#888", lineHeight: 20 },

  card: {
    backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1, borderColor: "#f0f0f0",
    padding: 20, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute", top: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 12,
  },
  popularBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planName: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  priceWrap: { alignItems: "flex-end", gap: 2 },
  planPrice: { fontSize: 22, fontWeight: "800" },
  planCurrency: { fontSize: 11, color: "#aaa" },
  features: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, color: "#555", flex: 1 },
  cta: { borderRadius: 14, padding: 14, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { color: "#888", fontSize: 14 },
  loginLinkBold: { fontWeight: "700" },
});
