import { useEffect, useRef, memo } from "react";
import { Animated, TouchableOpacity, View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarRating from "./StarRating";
import { getBusinessType } from "../lib/businessTypes";
import { formatDistance } from "../lib/location";
import { optimizeImage } from "../lib/cloudinary";
import { Ionicons } from "@expo/vector-icons";

const { width: SW } = Dimensions.get("window");
const GRID_MAX = Math.min(SW, 780);
const CARD_W = (GRID_MAX - 32 - 12) / 2; // 16px de marge x2, 12px de gouttière
const COVER_H = Math.round(CARD_W * 0.62);

// Couleur d'accent par type de boutique
const BIZ_COLORS: Record<string, string> = {
  mode:         "#6366f1",
  chaussures:   "#f59e0b",
  beaute:       "#ec4899",
  sacs:         "#8b5cf6",
  bijoux:       "#f59e0b",
  electronique: "#3b82f6",
  alimentation: "#22c55e",
  autre:        "#6b7280",
};

type Props = {
  item: {
    id: string;
    shop_name: string;
    slogan: string | null;
    description: string | null;
    product_count: number;
    avg_rating: number;
    rating_count: number;
    shop_logo_url?: string | null;
    shop_cover_url?: string | null;
    business_type?: string | null;
    city?: string | null;
    distance?: number;
  };
  index: number;
  onPress: () => void;
};

function AnimatedShopCard({ item, index, onPress }: Props) {
  const biz = getBusinessType(item.business_type || "mode");
  const accent = BIZ_COLORS[item.business_type || "mode"] || "#2563EB";

  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 360, delay: Math.min(index * 50, 350), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 360, delay: Math.min(index * 50, 350), useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const hasLogo = !!(item.shop_logo_url && item.shop_logo_url.trim().length > 0);
  const hasCover = !!(item.shop_cover_url && item.shop_cover_url.trim().length > 0);

  return (
    <Animated.View style={{ width: CARD_W, opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        {/* Cover */}
        <View style={styles.cover}>
          {hasCover ? (
            <Image source={{ uri: optimizeImage(item.shop_cover_url, CARD_W * 2.5) ?? item.shop_cover_url! }} style={styles.coverImg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[accent, accent + "aa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverImg}>
              <Text style={styles.coverEmoji}>{biz.emoji}</Text>
            </LinearGradient>
          )}

          {/* Badge type */}
          <View style={[styles.bizTag, { backgroundColor: accent }]}>
            <Text style={styles.bizTagText} numberOfLines={1}>{biz.emoji} {biz.label}</Text>
          </View>

          {/* Logo coin bas-gauche */}
          <View style={styles.logoWrap}>
            <View style={[styles.logo, { backgroundColor: hasLogo ? "#fff" : accent }]}>
              {hasLogo ? (
                <Image source={{ uri: optimizeImage(item.shop_logo_url, 120) ?? item.shop_logo_url! }} style={styles.logoImg} resizeMode="cover" />
              ) : (
                <Text style={styles.logoInitial}>{item.shop_name[0].toUpperCase()}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Corps */}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{item.shop_name}</Text>

          {item.avg_rating > 0 ? (
            <StarRating rating={item.avg_rating} count={item.rating_count} size="sm" />
          ) : (
            <Text style={styles.new}>Nouveau</Text>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="cube-outline" size={11} color="#6b7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.product_count > 0
                ? `${item.product_count} ${biz.ui.itemLabel}${item.product_count > 1 ? "s" : ""}`
                : "Bientôt"}
            </Text>
            {(item.distance !== undefined || item.city) && (
              <>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="location-outline" size={11} color="#6b7280" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.distance !== undefined ? formatDistance(item.distance) : item.city}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W, borderRadius: 18, backgroundColor: "#fff", overflow: "hidden",
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },

  cover: { height: COVER_H, position: "relative", backgroundColor: "#eef2f7" },
  coverImg: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  coverEmoji: { fontSize: 40, opacity: 0.9 },
  bizTag: {
    position: "absolute", top: 8, right: 8, maxWidth: CARD_W - 60,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  bizTagText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  logoWrap: {
    position: "absolute", left: 10, bottom: -16,
    borderRadius: 16, borderWidth: 3, borderColor: "#fff", overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4,
  },
  logo: { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  logoImg: { width: 44, height: 44 },
  logoInitial: { fontSize: 18, fontWeight: "900", color: "#fff" },

  body: { paddingTop: 22, paddingHorizontal: 12, paddingBottom: 12, gap: 3 },
  name: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  new: { fontSize: 11, color: "#10b981", fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  metaText: { fontSize: 11, color: "#6b7280", fontWeight: "500", flexShrink: 1 },
  dot: { color: "#cbd5e1", fontSize: 11, marginHorizontal: 1 },
});

// Mémoïsé : objets boutique stables après filtrage -> pas de re-render inutile
export default memo(AnimatedShopCard, (prev, next) => prev.item === next.item);
