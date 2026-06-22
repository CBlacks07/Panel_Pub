import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { getPlanFeatures } from "../../lib/planFeatures";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";

const SUPPORT_WHATSAPP_DEFAULT = "+22893914694";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  article_limit: number;
  features: string[];
  is_popular: boolean;
};

export default function PlansScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { primary, config } = useConfig();
  const supportWhatsApp = config.support_whatsapp || SUPPORT_WHATSAPP_DEFAULT;
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

  const currentPlan = profile?.plan || "free";

  const handleUpgrade = (plan: Plan) => {
    if (plan.id === "free") return;
    const msg = `Bonjour ! Je souhaite souscrire au plan *${plan.name}* (${plan.price.toLocaleString("fr-FR")} ${plan.currency}/${plan.billing}).\n\nMa Boutiki : ${profile?.shop_name || ""}`;
    const url = `https://wa.me/${supportWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    Alert.alert(
      `Passer au plan ${plan.name}`,
      `${plan.price.toLocaleString("fr-FR")} ${plan.currency}/${plan.billing}\n\nTu vas être redirigé vers WhatsApp pour finaliser ton abonnement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Contacter le support",
          onPress: () => Linking.openURL(url),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Nos forfaits"
        subtitle={
          profile?.plan && profile.plan !== "free" && profile.plan_expires_at
            ? `Plan ${currentPlan} · jusqu'au ${new Date(profile.plan_expires_at).toLocaleDateString("fr-FR")}`
            : `Plan actuel : ${currentPlan}`
        }
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPopular = plan.is_popular;

          return (
            <View
              key={plan.id}
              style={[
                styles.card,
                isPopular && { borderColor: primary, borderWidth: 2 },
                isCurrent && { borderColor: primary, borderWidth: 2 },
              ]}
            >
              {isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: primary }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.popularBadgeText}>Recommandé</Text>
                  </View>
                </View>
              )}

              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planLimit}>
                    {getPlanFeatures(plan).slice(0, 2).join(" · ")}
                  </Text>
                </View>
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

              {isCurrent ? (
                <View style={[styles.currentBadge, { borderColor: primary }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={16} color={primary} />
                    <Text style={[styles.currentBadgeText, { color: primary }]}>Plan actuel</Text>
                  </View>
                </View>
              ) : (
                <Button
                  label={plan.price === 0 ? "Plan de base" : `Passer au ${plan.name}`}
                  variant={isPopular ? "primary" : "soft"}
                  onPress={() => handleUpgrade(plan)}
                />
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>
          Pour toute question sur les forfaits, contactez notre support.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  backBtnText: { fontSize: 22, color: "#1a1a1a" },
  title: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  subtitle: { fontSize: 12, color: "#aaa", marginTop: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
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
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  popularBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planName: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  planLimit: { fontSize: 12, color: "#888", marginTop: 2 },
  priceWrap: { alignItems: "flex-end", flexDirection: "column", gap: 2 },
  planPrice: { fontSize: 22, fontWeight: "800" },
  planCurrency: { fontSize: 11, color: "#aaa" },
  features: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureCheck: { fontSize: 14, fontWeight: "700", width: 16 },
  featureText: { fontSize: 13, color: "#555", flex: 1 },
  currentBadge: { borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: "center" },
  currentBadgeText: { fontWeight: "700", fontSize: 14 },
  upgradeBtn: { borderRadius: 14, padding: 14, alignItems: "center" },
  upgradeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footer: { textAlign: "center", fontSize: 12, color: "#bbb", paddingVertical: 8 },
});
