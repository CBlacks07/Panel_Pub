import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Animated, Image, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import AnimatedShopCard from "../components/AnimatedShopCard";
import { MarketplaceSkeleton } from "../components/Skeleton";
import { getAppConfig, AppConfig } from "../lib/config";
import { useConfig } from "../context/ConfigContext";
import { BUSINESS_TYPES } from "../lib/businessTypes";
import { getPlanFeatures } from "../lib/planFeatures";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import { getDistance, formatDistance } from "../lib/location";

type Shop = {
  id: string;
  shop_name: string;
  slogan: string | null;
  description: string | null;
  shop_logo_url: string | null;
  business_type: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  product_count: number;
  avg_rating: number;
  rating_count: number;
  distance?: number;
};

function PricingCard({ plan, primary, onPress }: { plan: any; primary: string; index: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pricingCard, plan.is_popular && { borderColor: primary, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {plan.is_popular && (
        <View style={[styles.popularTag, { backgroundColor: primary }]}>
          <Text style={styles.popularTagText}>⭐ Recommandé</Text>
        </View>
      )}
      <Text style={styles.pricingName}>{plan.name}</Text>
      <Text style={[styles.pricingPrice, { color: primary }]}>
        {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString("fr-FR")} ${plan.currency}`}
      </Text>
      <Text style={styles.pricingBilling}>
        {plan.price === 0 ? "pour toujours" : `/${plan.billing}`}
      </Text>
      <View style={styles.pricingDivider} />
      {getPlanFeatures(plan).map((f: string, i: number) => (
        <Text key={i} style={[styles.pricingFeature, i < 2 && { fontWeight: "700", color: "#333" }]}>✓ {f}</Text>
      ))}
      <View style={[styles.pricingBtn, { backgroundColor: plan.is_popular ? primary : "#f3f4f6" }]}>
        <Text style={[styles.pricingBtnText, { color: plan.is_popular ? "#fff" : "#555" }]}>
          {plan.price === 0 ? "Commencer" : `Choisir ${plan.name}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Variables GLOBALES — survivent à la destruction/recréation du composant
let savedScrollOffset = 0;
let cachedLocation: { lat: number; lon: number } | null = null;
let locationRequested = false;

export default function MarketplaceScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { primary } = useConfig();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filtered, setFiltered] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeBizType, setActiveBizType] = useState("all");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(-30)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  // Référence stable pour le ListHeader — évite le remontage du TextInput
  const listHeaderFnRef = useRef<() => React.ReactElement>(() => <></>);
  const StableListHeader = useCallback(() => listHeaderFnRef.current(), []);

  useEffect(() => {
    getAppConfig().then(setConfig);
    supabase.from("plans").select("*").eq("active", true).order("sort_order").then(({ data }) => { if (data) setPlans(data); });
    // Géolocalisation — une seule demande par session d'appli
    if (cachedLocation) {
      setUserLocation(cachedLocation);
    } else if (!locationRequested) {
      locationRequested = true;
      ExpoLocation.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === "granted") {
          ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
            .then((loc) => {
              const loc2d = { lat: loc.coords.latitude, lon: loc.coords.longitude };
              cachedLocation = loc2d;
              setUserLocation(loc2d);
            })
            .catch(() => {});
        }
      });
    }
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bannerAnim, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  // Charger une seule fois au montage — pas à chaque retour
  useEffect(() => {
    loadShops();
  }, []);

  // Restaurer le scroll quand les données sont prêtes
  useEffect(() => {
    if (!loading && savedScrollOffset > 0) {
      const offset = savedScrollOffset;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: false });
      }, 100);
    }
  }, [loading]);

  const loadShops = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, shop_name, slogan, description, shop_logo_url, business_type, city, latitude, longitude");

    if (data) {
      const [{ data: counts }, { data: ratings }] = await Promise.all([
        supabase.from("products").select("user_id"),
        supabase.from("shop_ratings").select("shop_id, rating"),
      ]);

      const countMap: Record<string, number> = {};
      counts?.forEach((p) => { countMap[p.user_id] = (countMap[p.user_id] || 0) + 1; });

      const ratingMap: Record<string, { sum: number; count: number }> = {};
      ratings?.forEach((r) => {
        if (!ratingMap[r.shop_id]) ratingMap[r.shop_id] = { sum: 0, count: 0 };
        ratingMap[r.shop_id].sum += r.rating;
        ratingMap[r.shop_id].count += 1;
      });

      const shopsWithStats = data.map((s) => {
        const dist = (userLocation && s.latitude && s.longitude)
          ? getDistance(userLocation.lat, userLocation.lon, s.latitude, s.longitude)
          : undefined;
        return {
          ...s,
          product_count: countMap[s.id] || 0,
          avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
          rating_count: ratingMap[s.id]?.count || 0,
          distance: dist,
        };
      }).sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        return b.product_count - a.product_count;
      });

      setShops(shopsWithStats);
      setFiltered(shopsWithStats);
      setActiveBizType("all");
    }
    setLoading(false);
  };

  const applyFilters = (text: string, bizType: string) => {
    let result = shops;
    if (bizType !== "all") result = result.filter((s) => s.business_type === bizType);
    if (text.trim()) result = result.filter((s) => s.shop_name.toLowerCase().includes(text.toLowerCase()));
    setFiltered(result);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(text, activeBizType);
  };

  const handleBizFilter = (bizType: string) => {
    setActiveBizType(bizType);
    applyFilters(search, bizType);
  };

  // Stables → la FlatList ne re-rend pas toutes les cartes à chaque frappe
  const keyExtractor = useCallback((item: Shop) => item.id, []);
  const renderShop = useCallback(
    ({ item, index }: { item: Shop; index: number }) => (
      <AnimatedShopCard item={item} index={index} onPress={() => router.push(`/shop/${item.id}`)} />
    ),
    [router]
  );

  // Met à jour la ref à chaque render — StableListHeader appellera toujours la dernière version
  listHeaderFnRef.current = () => (
    <>
      {/* Bannière CTA vendeur */}
      <Animated.View style={[styles.banner, { backgroundColor: primary, transform: [{ translateY: bannerAnim }], opacity: bannerOpacity }]}>
        <Text style={styles.bannerTitle}>{config?.marketplace_banner_title || "Les boutiques mode du moment ✨"}</Text>
        <Text style={styles.bannerSubtitle}>{config?.marketplace_banner_subtitle || "Mode locale · Commande via WhatsApp"}</Text>
        {!session && (
          <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/(auth)/register")}>
            <Text style={[styles.bannerBtnText, { color: primary }]}>{config?.vendor_cta || "Ouvrir ma boutique — Gratuit"}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Forfaits en scroll horizontal — uniquement si pas connecté */}
      {!session && plans.length > 0 && (
        <View style={styles.pricingWrap}>
          <View style={styles.pricingSectionHeader}>
            <Text style={styles.pricingSectionTitle}>💼 Nos forfaits</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.pricingSectionLink, { color: primary }]}>Commencer &gt;</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pricingScrollContent}
            decelerationRate="fast"
            snapToInterval={252}
            snapToAlignment="start"
          >
            {plans.map((plan: any, index: number) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                primary={primary}
                index={index}
                onPress={() => router.push("/(auth)/register")}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Compteur de résultats */}
      <Text style={styles.sectionTitle}>
        {filtered.length} boutique{filtered.length > 1 ? "s" : ""}
        {search.trim()
          ? ` · « ${search.trim()} »`
          : activeBizType !== "all"
            ? ` · ${BUSINESS_TYPES.find((b) => b.id === activeBizType)?.label ?? ""}`
            : filtered[0]?.avg_rating > 0
              ? " · triées par note"
              : ""}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixe */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerBrand}>
          {config?.logo_url && config.logo_url.trim().length > 0 ? (
            <Image source={{ uri: config.logo_url }} style={styles.headerLogo} resizeMode="cover" />
          ) : (
            <View style={[styles.headerLogoFallback, { backgroundColor: primary }]}>
              <Text style={styles.headerLogoFallbackText}>{(config?.app_name || "B")[0].toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.title}>{config?.app_name || "Boutiki"}</Text>
        </View>
        {session ? (
          <TouchableOpacity style={[styles.dashBtn, { backgroundColor: primary }]} onPress={() => router.push("/(app)/dashboard")}>
            <Text style={styles.dashBtnText}>Ma boutique</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.vendorBtn, { borderColor: primary }]} onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.vendorBtnText, { color: primary }]}>Je suis vendeur</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Barre de recherche + filtres — FIXES, toujours visibles */}
      <View style={styles.controls}>
        <View style={[styles.searchWrap, searchFocused && { borderColor: primary, backgroundColor: "#fff" }]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? primary : "#9ca3af"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une boutique..."
            placeholderTextColor="#b0b6bf"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TouchableOpacity
            onPress={() => handleSearch("")}
            disabled={search.length === 0}
            style={{ opacity: search.length > 0 ? 1 : 0 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#c4c4c4" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bizFilterBar}
          contentContainerStyle={styles.bizFilterContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={[styles.bizFilterChip, activeBizType === "all" && { backgroundColor: primary, borderColor: primary }]} onPress={() => handleBizFilter("all")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="storefront-outline" size={13} color={activeBizType === "all" ? "#fff" : "#555"} />
              <Text style={[styles.bizFilterText, activeBizType === "all" && { color: "#fff" }]}>Tout</Text>
            </View>
          </TouchableOpacity>
          {BUSINESS_TYPES.filter((b) => shops.some((s) => s.business_type === b.id)).map((b) => (
            <TouchableOpacity key={b.id} style={[styles.bizFilterChip, activeBizType === b.id && { backgroundColor: primary, borderColor: primary }]} onPress={() => handleBizFilter(b.id)}>
              <Text style={[styles.bizFilterText, activeBizType === b.id && { color: "#fff" }]}>{b.emoji} {b.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <MarketplaceSkeleton />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filtered}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={StableListHeader}
          ListEmptyComponent={
            search.length > 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucune boutique trouvée</Text>
                <Text style={styles.emptySub}>Essaie un autre nom ou un autre type de boutique.</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onScroll={(e) => { savedScrollOffset = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={32}
          keyExtractor={keyExtractor}
          renderItem={renderShop}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    maxWidth: 780, width: "100%", alignSelf: "center",
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 34, height: 34, borderRadius: 10 },
  headerLogoFallback: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerLogoFallbackText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  title: { fontSize: 19, fontWeight: "800", color: "#1a1a1a" },
  vendorBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  vendorBtnText: { fontWeight: "700", fontSize: 13 },
  dashBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  dashBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  banner: {
    margin: 16, marginBottom: 8,
    borderRadius: 20, padding: 20, gap: 6,
  },
  bannerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", lineHeight: 24 },
  bannerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  bannerBtn: {
    marginTop: 8, backgroundColor: "#fff",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: "flex-start",
  },
  bannerBtnText: { fontWeight: "800", fontSize: 13 },

  // Barre fixe recherche + filtres
  controls: {
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    paddingTop: 10, paddingBottom: 4,
    maxWidth: 780, width: "100%", alignSelf: "center",
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: "#f4f6f8",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#eaedf1",
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: "#1a1a1a", padding: 0 },

  bizFilterBar: { maxHeight: 50 },
  bizFilterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  bizFilterChip: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#eee", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fafafa" },
  bizFilterText: { fontSize: 12, fontWeight: "600", color: "#555" },
  sectionTitle: { fontSize: 13, color: "#aaa", fontWeight: "600", marginHorizontal: 16, marginBottom: 8 },
  pricingWrap: { marginBottom: 8 },
  pricingSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  pricingSectionTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  pricingSectionLink: { fontSize: 13, fontWeight: "700" },
  pricingScrollContent: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  pricingCard: {
    width: 240, borderRadius: 20, borderWidth: 1, borderColor: "#f0f0f0",
    padding: 18, gap: 5, backgroundColor: "#fff", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  popularTag: { position: "absolute", top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 5, borderBottomLeftRadius: 12 },
  popularTagText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  pricingName: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginTop: 4 },
  pricingPrice: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  pricingBilling: { fontSize: 11, color: "#aaa" },
  pricingDivider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  pricingLimit: { fontSize: 12, color: "#444", fontWeight: "600" },
  pricingFeature: { fontSize: 12, color: "#666" },
  pricingBtn: { borderRadius: 12, padding: 10, alignItems: "center", marginTop: 12 },
  pricingBtnText: { fontWeight: "700", fontSize: 13 },
  shopsTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },

  list: { paddingBottom: 32, maxWidth: 780, width: "100%", alignSelf: "center", paddingHorizontal: 16, paddingTop: 4 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#888" },
  emptySub: { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 19 },
});
