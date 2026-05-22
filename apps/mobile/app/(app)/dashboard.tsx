import { useCallback, useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, TextInput, Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingModal from "../../components/OnboardingModal";
import { fonts } from "../../lib/fonts";
import FadeSlide from "../../components/Animated/FadeSlide";
import ScalePress from "../../components/Animated/ScalePress";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";

type Product = {
  id: string;
  title: string;
  price: number;
  last_edited_at?: string | null;
  views?: number;
  category: string;
  description: string | null;
  image_url: string | null;
};

export default function DashboardScreen() {
  const { user, bizType, profile } = useAuth();
  const { primary, getPlanById } = useConfig();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((done) => {
      if (!done) setShowOnboarding(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, category, description, image_url, last_edited_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Récupérer les vues par produit
      const { data: viewsData } = await supabase
        .from("product_views")
        .select("product_id");
      const viewMap: Record<string, number> = {};
      viewsData?.forEach((v) => { viewMap[v.product_id] = (viewMap[v.product_id] || 0) + 1; });
      const withViews = data.map((p) => ({ ...p, views: viewMap[p.id] || 0 }));
      setProducts(withViews);
      setFiltered(withViews);
    }
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setFiltered(!text.trim() ? products : products.filter((p) =>
      p.title.toLowerCase().includes(text.toLowerCase()) ||
      p.category.toLowerCase().includes(text.toLowerCase())
    ));
  };

  const shareProduct = async (item: Product) => {
    const url = `https://panel-pub-web.vercel.app/shop/${user?.id}?product=${item.id}`;
    await Share.share({
      message: `Découvre "${item.title}" — ${item.price.toLocaleString("fr-FR")} FCFA 🛍️\n${url}`,
      url,
    });
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      "Supprimer l'article",
      `Tu veux vraiment supprimer "${title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await supabase.from("products").delete().eq("id", id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  // Valeurs calculées (pas des hooks — ok ici)
  const currentPlan = getPlanById(profile?.plan || "free");
  const isFreePlan = currentPlan.id === "free";
  const articleCount = products.length; // articles actifs
  // total_articles_created vient du profil (compteur cumulé)
  const totalCreated = (profile as any)?.total_articles_created ?? articleCount;
  const PLAN_LIMIT = currentPlan.article_limit;
  const usagePct = Math.min(Math.round((totalCreated / PLAN_LIMIT) * 100), 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Banner upsell plan gratuit */}
      {isFreePlan && totalCreated >= Math.max(PLAN_LIMIT - 3, 0) && (
        <TouchableOpacity
          style={[styles.upsellBanner, { backgroundColor: articleCount >= PLAN_LIMIT ? "#dc2626" : primary }]}
          onPress={() => router.push("/(app)/plans")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.upsellTitle}>
              {totalCreated >= PLAN_LIMIT ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="lock-closed" size={13} color="#fff" />
                  <Text style={styles.upsellTitle}>Limite atteinte — Passe au Pro !</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="warning-outline" size={13} color="#fff" />
                  <Text style={styles.upsellTitle}>{totalCreated}/{PLAN_LIMIT} articles créés</Text>
                </View>
              )}
            </Text>
            <Text style={styles.upsellSub}>
              {articleCount >= PLAN_LIMIT
                ? "Tu ne peux plus ajouter d'articles en plan gratuit."
                : `Il te reste ${PLAN_LIMIT - totalCreated} création${PLAN_LIMIT - totalCreated > 1 ? "s" : ""} disponible${PLAN_LIMIT - totalCreated > 1 ? "s" : ""}. Les articles supprimés comptent.`}
            </Text>
            {articleCount < PLAN_LIMIT && (
              <View style={styles.upsellBar}>
                <View style={[styles.upsellBarFill, { width: `${usagePct}%` as any }]} />
              </View>
            )}
          </View>
          <Text style={styles.upsellArrow}>Voir les forfaits &gt;</Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ma boutique</Text>
          <Text style={styles.subtitle}>{products.length} {bizType.ui.itemLabel}{products.length > 1 ? "s" : ""} en ligne</Text>
          {isFreePlan && currentPlan.edit_cooldown_hours > 0 && (
            <Text style={[styles.editsCounter, { color: "#f59e0b" }]}>
              <Ionicons name="time-outline" size={11} color="#f59e0b" /> Plan gratuit — délai {currentPlan.edit_cooldown_hours}h entre chaque modif
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.previewBtn, { borderColor: primary }]}
            onPress={() => router.push("/marketplace")}
          >
            <Ionicons name="storefront-outline" size={14} color={primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche */}
      {products.length > 0 && (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un article..."
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{bizType.emoji}</Text>
          <Text style={styles.emptyTitle}>{bizType.ui.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{bizType.ui.emptySubtitle}</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: primary }]}
            onPress={() => router.push("/(app)/add-product")}
          >
            <Text style={styles.addBtnText}>{bizType.ui.addBtn}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeSlide delay={index * 60} direction="up" distance={20}>
            <View style={styles.card}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={{ fontSize: 28 }}>{bizType.emoji}</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardCategory, { color: primary }]}>{item.category}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.cardPriceRow}>
                  <Text style={[styles.cardPrice, { color: primary }]}>{item.price.toLocaleString("fr-FR")} FCFA</Text>
                  {item.views !== undefined && item.views > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Ionicons name="eye-outline" size={11} color="#aaa" />
                      <Text style={styles.cardViews}>{item.views}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => shareProduct(item)} style={styles.shareBtn}>
                  <Ionicons name="share-social-outline" size={18} color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/edit-product?id=${item.id}`)}
                  style={styles.editBtn}
                >
                  {(() => {
                    if (!item.last_edited_at || currentPlan.edit_cooldown_hours === 0)
                      return <Ionicons name="create-outline" size={18} color="#a855f7" />;
                    const elapsed = Date.now() - new Date(item.last_edited_at).getTime();
                    const cooldownMs = currentPlan.edit_cooldown_hours * 3600000;
                    if (elapsed < cooldownMs)
                      return <Ionicons name="time-outline" size={18} color="#f59e0b" />;
                    return <Ionicons name="create-outline" size={18} color="#a855f7" />;
                  })()}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            </FadeSlide>
          )}
        />
      )}

      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f9fb" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  title: { ...fonts.h1, color: "#1a1a1a" },
  subtitle: { fontSize: 13, color: "#999", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  previewBtn: {
    borderWidth: 1.5, borderColor: "#9333ea", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  previewBtnText: { color: "#9333ea", fontWeight: "700", fontSize: 13 },
  addHeaderBtn: {
    borderRadius: 20, flexDirection: "row",
    alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addHeaderBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  list: { padding: 16, gap: 12, paddingBottom: 100 },

  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16,
    padding: 12, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardImage: { width: 72, height: 72, borderRadius: 12 },
  cardImagePlaceholder: { backgroundColor: "#f3e8ff", justifyContent: "center", alignItems: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  cardCategory: { fontSize: 10, color: "#9333ea", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { ...fonts.bold, color: "#1a1a1a" },
  cardDescription: { fontSize: 12, color: "#888", lineHeight: 17 },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#9333ea", marginTop: 2 },
  cardActions: { gap: 4 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  cardViews: { fontSize: 11, color: "#aaa" },
  shareBtn: { padding: 6, backgroundColor: "#f0f9ff", borderRadius: 8, alignItems: "center" },
  editBtn: { padding: 6, backgroundColor: "#f3e8ff", borderRadius: 8, alignItems: "center" },
  deleteBtn: { padding: 6, backgroundColor: "#fff5f5", borderRadius: 8, alignItems: "center" },
  actionIcon: { fontSize: 16 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 28, lineHeight: 22 },
  addBtn: { backgroundColor: "#9333ea", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  addBtnText: { fontFamily: "PlusJakartaSans_700Bold", color: "#fff", fontSize: 15 },
  editsCounter: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  upsellBanner: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  upsellTitle: { color: "#fff", fontWeight: "800", fontSize: 13, marginBottom: 2 },
  upsellSub: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  upsellBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, marginTop: 6, overflow: "hidden" },
  upsellBarFill: { height: 4, backgroundColor: "#fff", borderRadius: 2 },
  upsellArrow: { color: "#fff", fontSize: 11, fontWeight: "700", flexShrink: 0 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#eee" },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1a1a" },
});

