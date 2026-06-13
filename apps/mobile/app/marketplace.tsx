import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Animated, Image, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import AnimatedShopCard from "../components/AnimatedShopCard";
import { MarketplaceSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { getAppConfig, AppConfig } from "../lib/config";
import { useConfig } from "../context/ConfigContext";
import { BUSINESS_TYPES } from "../lib/businessTypes";
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(-30)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  // Référence stable pour le ListHeader — évite le remontage du TextInput
  const listHeaderFnRef = useRef<() => React.ReactElement>(() => <></>);
  const StableListHeader = useCallback(() => listHeaderFnRef.current(), []);

  useEffect(() => {
    getAppConfig().then(setConfig);
    AsyncStorage.getItem("mk_banner_hidden").then((v) => { if (v) setBannerHidden(true); });
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

  // Calcule distance + tri (distance > note > nb articles) et alimente l'état
  const finalizeShops = (rows: any[]) => {
    const withStats = rows.map((s) => ({
      ...s,
      product_count: s.product_count ?? 0,
      avg_rating: s.avg_rating ?? 0,
      rating_count: s.rating_count ?? 0,
      distance: (userLocation && s.latitude && s.longitude)
        ? getDistance(userLocation.lat, userLocation.lon, s.latitude, s.longitude)
        : undefined,
    })).sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      return b.product_count - a.product_count;
    });
    setShops(withStats);
    setFiltered(withStats);
    setActiveBizType("all");
  };

  const loadShops = async () => {
    setLoading(true);

    // Chemin efficace : vue agrégée côté serveur (1 requête). Migration 006.
    const view = await supabase
      .from("marketplace_shops")
      .select("id, shop_name, slogan, description, shop_logo_url, business_type, city, latitude, longitude, product_count, avg_rating, rating_count")
      .limit(500);

    if (!view.error && view.data) {
      finalizeShops(view.data);
      setLoading(false);
      return;
    }

    // Fallback (vue absente / migration 006 pas encore appliquée) : agrégation client
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
      finalizeShops(data.map((s) => ({
        ...s,
        product_count: countMap[s.id] || 0,
        avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
        rating_count: ratingMap[s.id]?.count || 0,
      })));
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

  const dismissBanner = () => {
    setBannerHidden(true);
    AsyncStorage.setItem("mk_banner_hidden", "1").catch(() => {});
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
      {/* Bannière CTA vendeur — masquée pour les vendeurs connectés ou si déjà fermée */}
      {!session && !bannerHidden && (
        <Animated.View style={[styles.banner, { backgroundColor: primary, transform: [{ translateY: bannerAnim }], opacity: bannerOpacity }]}>
          <TouchableOpacity
            style={styles.bannerClose}
            onPress={dismissBanner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Masquer cette bannière"
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.bannerTitle, { paddingRight: 28 }]}>{config?.marketplace_banner_title || "Les boutiques mode du moment ✨"}</Text>
          <Text style={styles.bannerSubtitle}>{config?.marketplace_banner_subtitle || "Mode locale · Commande via WhatsApp"}</Text>
          <View style={styles.bannerActions}>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.bannerBtnText, { color: primary }]}>{config?.vendor_cta || "Ouvrir ma boutique — Gratuit"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bannerLink} onPress={() => router.push("/forfaits")}>
              <Text style={styles.bannerLinkText}>Voir les forfaits</Text>
              <Ionicons name="chevron-forward" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
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
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
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
              <EmptyState
                emoji="🔍"
                accent={primary}
                title="Aucune boutique trouvée"
                subtitle="Essaie un autre nom ou un autre type de boutique."
              />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onScroll={(e) => { savedScrollOffset = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={32}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          removeClippedSubviews
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
    position: "relative", overflow: "hidden",
  },
  bannerClose: {
    position: "absolute", top: 10, right: 10, zIndex: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
  },
  bannerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", lineHeight: 24 },
  bannerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  bannerActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" },
  bannerBtn: {
    backgroundColor: "#fff",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerBtnText: { fontWeight: "800", fontSize: 13 },
  bannerLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  bannerLinkText: { color: "#fff", fontWeight: "700", fontSize: 13, textDecorationLine: "underline" },

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

  list: { paddingBottom: 32, maxWidth: 780, width: "100%", alignSelf: "center", paddingHorizontal: 16, paddingTop: 4 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#888" },
  emptySub: { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 19 },
});
