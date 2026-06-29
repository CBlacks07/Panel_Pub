import { useCallback, useState, useRef, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image,
  TextInput, Dimensions, FlatList, Animated, Share, RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import OnboardingModal from "../../components/OnboardingModal";
import { DashboardSkeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { Chip } from "../../components/ui/Chip";
import { useToast } from "../../components/ui/Toast";
import { PRODUCT_IMAGE_RATIO, colors } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { optimizeImage } from "../../lib/cloudinary";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { LinearGradient } from "expo-linear-gradient";

const { width: SW } = Dimensions.get("window");
const MAX_W = Math.min(SW, 680);
const CARD_W = (MAX_W - 48) / 2;
const IMG_H = CARD_W * PRODUCT_IMAGE_RATIO;

type Product = {
  id: string; title: string; price: number; compare_at_price: number | null;
  last_edited_at?: string | null; views: number;
  category: string; description: string | null; image_url: string | null;
};

/* ── Mini image produit avec shimmer ── */
function ProductThumb({ uri, emoji }: { uri: string | null; emoji: string }) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View style={[thumb.wrap, { backgroundColor: "#f5f6fa", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: CARD_W * 0.28 }}>{emoji}</Text>
      </View>
    );
  }
  return (
    <Image source={{ uri: optimizeImage(uri, CARD_W * 2.5) ?? uri }} style={thumb.wrap} resizeMode="cover" onError={() => setErr(true)} />
  );
}
const thumb = StyleSheet.create({ wrap: { width: CARD_W, height: IMG_H } });

/* ── Carte stat ── */
function StatCard({ icon, value, label, color, onPress }: {
  icon: string; value: string | number; label: string; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user, bizType, profile } = useAuth();
  const { primary, getPlanById } = useConfig();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "views" | "price">("recent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const searchClearScale = useRef(new Animated.Value(0)).current;

  const SHOP_URL = `https://panel-pub-web.vercel.app/shop/${user?.id}`;

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("onboarding_done").then((done) => {
        if (!done) setShowOnboarding(true);
      });
      fetchAll();
    }, [])
  );

  const fetchAll = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
    // TECH-03 fix : charger les produits d'abord, puis les vues avec les IDs déjà connus
    const [{ data: prods, error: prodsErr }, { data: ratingsData }] = await Promise.all([
      supabase.from("products")
        .select("id, title, price, compare_at_price, category, description, image_url, last_edited_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("shop_ratings").select("rating").eq("shop_id", user.id),
    ]);
    if (prodsErr) throw prodsErr;

    const productIds = prods?.map(p => p.id) ?? [];
    const { data: viewsData } = productIds.length > 0
      ? await supabase.from("product_views").select("product_id").in("product_id", productIds)
      : { data: [] };

    const viewMap: Record<string, number> = {};
    viewsData?.forEach((v) => { viewMap[v.product_id] = (viewMap[v.product_id] || 0) + 1; });
    const total = viewsData?.length ?? 0;
    setTotalViews(total);

    const avg = ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length : 0;
    setAvgRating(avg);

    if (prods) {
      setProducts(prods.map((p) => ({ ...p, views: viewMap[p.id] || 0 })));
    }
    } catch (e) {
      console.warn("[Dashboard] fetchAll error:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  };

  // Liste affichée : recherche + tri (recomputée à la volée)
  const displayed = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === "views") sorted.sort((a, b) => b.views - a.views);
    else if (sort === "price") sorted.sort((a, b) => a.price - b.price);
    // "recent" = ordre serveur (created_at desc)
    return sorted;
  }, [products, search, sort]);

  const handleSearch = (text: string) => {
    setSearch(text);
    Animated.spring(searchClearScale, { toValue: text.length > 0 ? 1 : 0, useNativeDriver: true, speed: 50 }).start();
  };

  const shareShop = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: `Découvre ma boutique 🛍️\n${SHOP_URL}`, url: SHOP_URL });
  };

  const shareProduct = async (title: string, price: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = `${title} — ${price.toLocaleString("fr-FR")} FCFA\nDisponible dans ma boutique 🛍️\n${SHOP_URL}`;
    await Share.share({ message: msg, url: SHOP_URL });
  };

  const confirmDelete = (id: string, title: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Supprimer l'article", `Supprimer "${title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", user!.id);
          if (error) { toast("Impossible de supprimer cet article", "error"); return; }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setProducts((prev) => prev.filter((p) => p.id !== id));
          toast("Article supprimé");
        },
      },
    ]);
  };

  const currentPlan = getPlanById(profile?.plan || "free");
  const isFreePlan = currentPlan.id === "free";
  const totalCreated = profile?.total_articles_created ?? products.length;
  const PLAN_LIMIT = currentPlan.article_limit;
  const usagePct = Math.min((totalCreated / PLAN_LIMIT) * 100, 100);
  const shopName = profile?.shop_name || user?.email?.split("@")[0] || "Ma boutique";
  const shopLogo = profile?.shop_logo_url || null;

  if (loading) return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <DashboardSkeleton />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 130 }]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} colors={[primary]} />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
        ListHeaderComponent={
          <>
            {/* ── HEADER ── */}
            <View style={styles.header}>
              <LinearGradient colors={[primary, primary + "cc"]} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerCircle1} />
                <View style={styles.headerCircle2} />

                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.headerGreeting}>Bonjour 👋</Text>
                    <Text style={styles.headerShopName} numberOfLines={1}>{shopName}</Text>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>Plan {currentPlan.name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/shop/${user?.id}`)} style={styles.headerAvatar} accessibilityRole="button" accessibilityLabel="Voir ma boutique publique">
                    {shopLogo ? (
                      <Image source={{ uri: shopLogo }} style={styles.headerAvatarImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.headerAvatarText}>{shopName[0].toUpperCase()}</Text>
                    )}
                    <View style={styles.headerAvatarBadge}>
                      <Ionicons name="eye-outline" size={10} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Barre de progression plan */}
                {isFreePlan && (
                  <TouchableOpacity style={styles.planProgress} onPress={() => router.push("/(app)/plans")} activeOpacity={0.8}>
                    <View style={styles.planProgressTop}>
                      <Text style={styles.planProgressLabel}>{totalCreated}/{PLAN_LIMIT} articles créés</Text>
                      <Text style={styles.planProgressLink}>Upgrader →</Text>
                    </View>
                    <View style={styles.planProgressBar}>
                      <View style={[styles.planProgressFill, { width: `${usagePct}%` as any, backgroundColor: usagePct >= 90 ? "#ef4444" : "#fff" }]} />
                    </View>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>

            {/* ── RAPPEL WHATSAPP (si non renseigné) ── */}
            {!profile?.phone_whatsapp && (
              <TouchableOpacity
                style={styles.waReminder}
                onPress={() => router.push("/(app)/profile")}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.waReminderTitle}>Ajoute ton numéro WhatsApp</Text>
                  <Text style={styles.waReminderText}>Sans lui, tes clients ne peuvent pas commander.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#16a34a" />
              </TouchableOpacity>
            )}

            {/* ── RACCOURCIS ── */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                style={[styles.shortcutBtn, { borderColor: primary + "40", backgroundColor: primary + "08" }]}
                onPress={shareShop}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={16} color={primary} />
                <Text style={[styles.shortcutText, { color: primary }]}>Partager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => router.push("/marketplace")}
                activeOpacity={0.8}
              >
                <Ionicons name="grid-outline" size={16} color="#6b7280" />
                <Text style={styles.shortcutText}>Marketplace</Text>
              </TouchableOpacity>
            </View>

            {/* ── STATS ── */}
            <View style={styles.statsRow}>
              <StatCard
                icon="cube-outline"
                value={products.length}
                label="Articles"
                color={primary}
                onPress={() => {}}
              />
              <StatCard
                icon="eye-outline"
                value={totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
                label="Vues totales"
                color="#3b82f6"
              />
              <StatCard
                icon="star-outline"
                value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
                label="Note moy."
                color="#f59e0b"
              />
            </View>

            {/* ── SEARCH ── */}
            {products.length > 0 && (
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={16} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Rechercher dans ${products.length} article${products.length > 1 ? "s" : ""}...`}
                  placeholderTextColor="#c4c4c4"
                  value={search}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <Animated.View style={{ transform: [{ scale: searchClearScale }] }}>
                  <TouchableOpacity onPress={() => handleSearch("")} disabled={search.length === 0} style={{ opacity: search.length > 0 ? 1 : 0 }}>
                    <Ionicons name="close-circle" size={18} color="#c4c4c4" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            {/* Titre section + tri */}
            {products.length > 0 && (
              <>
                <View style={styles.sectionTitle}>
                  <Text style={styles.sectionTitleText}>
                    {search ? `${displayed.length} résultat${displayed.length > 1 ? "s" : ""}` : "Mes articles"}
                  </Text>
                </View>
                <View style={styles.sortRow}>
                  <Chip label="Récents" selected={sort === "recent"} onPress={() => setSort("recent")} />
                  <Chip label="Plus vus" selected={sort === "views"} onPress={() => setSort("views")} />
                  <Chip label="Prix" selected={sort === "price"} onPress={() => setSort("price")} />
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            emoji={bizType.emoji}
            accent={primary}
            title={search ? "Aucun article trouvé" : bizType.ui.emptyTitle}
            subtitle={search ? `Aucun article ne correspond à "${search}"` : bizType.ui.emptySubtitle}
            actionLabel={!search ? bizType.ui.addBtn : undefined}
            actionIcon={!search ? "add-circle-outline" : undefined}
            onAction={!search ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(app)/add-product");
            } : undefined}
          />
        }
        renderItem={({ item }) => {
          const canEdit = !item.last_edited_at || currentPlan.edit_cooldown_hours === 0 ||
            (Date.now() - new Date(item.last_edited_at).getTime()) >= currentPlan.edit_cooldown_hours * 3600000;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/(app)/edit-product?id=${item.id}`);
              }}
              activeOpacity={0.9}
            >
              {/* Image */}
              <View style={styles.cardImageWrap}>
                <ProductThumb uri={item.image_url} emoji={bizType.emoji} />
                {/* Badge vues */}
                {item.views > 0 && (
                  <View style={styles.viewsBadge}>
                    <Ionicons name="eye" size={10} color="#fff" />
                    <Text style={styles.viewsBadgeText}>{item.views}</Text>
                  </View>
                )}
                {/* Badge cooldown */}
                {!canEdit && (
                  <View style={styles.cooldownBadge}>
                    <Ionicons name="time-outline" size={10} color="#f59e0b" />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardCat, { color: primary + "99" }]}>{item.category}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.cardPrice, { color: primary }]}>{item.price.toLocaleString("fr-FR")} F</Text>
                  {item.compare_at_price && item.compare_at_price > item.price ? (
                    <Text style={styles.cardComparePrice}>{item.compare_at_price.toLocaleString("fr-FR")} F</Text>
                  ) : null}
                </View>
              </View>

              {/* Actions rapides */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#f0f9ff" }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${item.title}`}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/(app)/edit-product?id=${item.id}`);
                  }}
                >
                  <Ionicons name={canEdit ? "create-outline" : "time-outline"} size={14} color={canEdit ? primary : "#f59e0b"} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#f0fdf4" }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Partager ${item.title}`}
                  onPress={(e) => { e.stopPropagation(); shareProduct(item.title, item.price); }}
                >
                  <Ionicons name="share-social-outline" size={14} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#fff5f5" }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Supprimer ${item.title}`}
                  onPress={(e) => { e.stopPropagation(); confirmDelete(item.id, item.title); }}
                >
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <OnboardingModal visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6fa" },
  listContent: { paddingHorizontal: 16, paddingTop: 0 },
  row: { gap: 12, marginBottom: 12 },

  // Rappel WhatsApp
  waReminder: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#f0fdf4", borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  waReminderTitle: { fontSize: 14, fontWeight: "800", color: "#166534" },
  waReminderText: { fontSize: 12, color: "#16a34a", marginTop: 1 },

  // Tri
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 12 },

  // Header gradient
  header: { marginBottom: 16, marginHorizontal: -16 },
  headerGradient: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, overflow: "hidden" },
  headerCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)", top: -60, right: -40,
  },
  headerCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: -20, left: -20,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerLeft: { gap: 4 },
  headerGreeting: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  headerShopName: { fontSize: 22, fontWeight: "900", color: "#fff", maxWidth: SW * 0.6 },
  planBadge: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 2,
  },
  planBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  headerAvatar: {
    width: 52, height: 52, borderRadius: 20, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", position: "relative",
  },
  headerAvatarImg: { width: 52, height: 52 },
  headerAvatarText: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerAvatarBadge: {
    position: "absolute", bottom: 0, right: 0, width: 18, height: 18,
    borderRadius: 9, backgroundColor: "#22c55e", justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  planProgress: {
    marginTop: 14, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12, padding: 10, gap: 6,
  },
  planProgressTop: { flexDirection: "row", justifyContent: "space-between" },
  planProgressLabel: { fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  planProgressLink: { fontSize: 11, color: "#fff", fontWeight: "800" },
  planProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
  planProgressFill: { height: 4, borderRadius: 2 },

  // Raccourcis
  shortcutsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  shortcutBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14,
    paddingVertical: 10, backgroundColor: "#fff",
  },
  shortcutText: { fontSize: 13, fontWeight: "700", color: "#6b7280" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 12,
    alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500", textAlign: "center" },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1a1a" },

  // Section title
  sectionTitle: { marginBottom: 8 },
  sectionTitleText: { fontSize: 14, fontWeight: "700", color: "#6b7280" },

  // Product card
  card: {
    width: CARD_W, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardImageWrap: { position: "relative" },
  viewsBadge: {
    position: "absolute", top: 8, left: 8,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  viewsBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cooldownBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(245,158,11,0.9)", borderRadius: 10,
    width: 22, height: 22, justifyContent: "center", alignItems: "center",
  },
  cardInfo: { padding: 10, gap: 2 },
  cardCat: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", lineHeight: 18 },
  cardPrice: { fontSize: 14, fontWeight: "900" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" },
  cardComparePrice: { fontSize: 12, color: "#9ca3af", textDecorationLine: "line-through", fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingBottom: 10 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 7, alignItems: "center" },

  // Empty
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 32, gap: 12 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#1a1a1a", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
