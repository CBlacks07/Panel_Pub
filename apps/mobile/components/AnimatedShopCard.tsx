import { useEffect, useRef, memo } from "react";
import { Animated, TouchableOpacity, View, Text, StyleSheet, Image, Dimensions } from "react-native";
import StarRating from "./StarRating";
import { useConfig } from "../context/ConfigContext";
import { getBusinessType } from "../lib/businessTypes";
import { formatDistance } from "../lib/location";
import { optimizeImage } from "../lib/cloudinary";
import { Ionicons } from "@expo/vector-icons";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW, 680) - 32;

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
    business_type?: string | null;
    city?: string | null;
    distance?: number;
  };
  index: number;
  onPress: () => void;
};

function AnimatedShopCard({ item, index, onPress }: Props) {
  const { primary } = useConfig();
  const biz = getBusinessType(item.business_type || "mode");
  const accentColor = BIZ_COLORS[item.business_type || "mode"] || primary;

  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 380, delay: Math.min(index * 60, 400), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: Math.min(index * 60, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const hasLogo = item.shop_logo_url && item.shop_logo_url.trim().length > 0;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Bandeau supérieur coloré */}
        <View style={[styles.banner, { backgroundColor: accentColor + "22" }]}>
          {/* Motif décoratif */}
          <View style={[styles.bannerCircle1, { backgroundColor: accentColor + "30" }]} />
          <View style={[styles.bannerCircle2, { backgroundColor: accentColor + "20" }]} />

          {/* Badge catégorie */}
          <View style={[styles.bizTag, { backgroundColor: accentColor }]}>
            <Text style={styles.bizTagText}>{biz.emoji} {biz.label}</Text>
          </View>
        </View>

        {/* Corps */}
        <View style={styles.body}>
          {/* Logo + infos */}
          <View style={styles.topRow}>
            {/* Logo flottant sur le bandeau */}
            <View style={[styles.logoWrap, { borderColor: accentColor + "40" }]}>
              <View style={[styles.logo, { backgroundColor: hasLogo ? "#fff" : accentColor }]}>
                {hasLogo ? (
                  <Image source={{ uri: optimizeImage(item.shop_logo_url, 150) ?? item.shop_logo_url! }} style={styles.logoImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.logoInitial}>{item.shop_name[0].toUpperCase()}</Text>
                )}
              </View>
            </View>

            {/* Nom + étoiles */}
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={1}>{item.shop_name}</Text>
              {item.avg_rating > 0 ? (
                <StarRating rating={item.avg_rating} count={item.rating_count} size="sm" />
              ) : (
                <Text style={styles.noRating}>Nouveau</Text>
              )}
            </View>

            {/* Flèche CTA */}
            <View style={[styles.cta, { backgroundColor: accentColor }]}>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </View>

          {/* Slogan */}
          {item.slogan ? (
            <Text style={[styles.slogan, { color: accentColor }]} numberOfLines={1}>
              "{item.slogan}"
            </Text>
          ) : item.description ? (
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
          ) : null}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="cube-outline" size={11} color="#6b7280" />
              <Text style={styles.metaText}>
                {item.product_count > 0
                  ? `${item.product_count} ${biz.ui.itemLabel}${item.product_count > 1 ? "s" : ""}`
                  : `Aucun ${biz.ui.itemLabel}`}
              </Text>
            </View>

            {(item.distance !== undefined || item.city) && (
              <View style={styles.metaBadge}>
                <Ionicons name="location-outline" size={11} color="#6b7280" />
                <Text style={styles.metaText}>
                  {item.distance !== undefined ? formatDistance(item.distance) : item.city}
                </Text>
              </View>
            )}

            {item.product_count === 0 && (
              <View style={[styles.metaBadge, { backgroundColor: "#fff7ed" }]}>
                <Text style={[styles.metaText, { color: "#f59e0b" }]}>Bientôt disponible</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W, borderRadius: 20, backgroundColor: "#fff", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    alignSelf: "center",
  },

  // Bandeau
  banner: { height: 56, overflow: "hidden", position: "relative" },
  bannerCircle1: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    top: -20, right: 40,
  },
  bannerCircle2: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    top: -40, right: -10,
  },
  bizTag: {
    position: "absolute", top: 10, left: 14,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: "row", alignItems: "center",
  },
  bizTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Corps
  body: { padding: 14, paddingTop: 0, gap: 8 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -16 },

  logoWrap: {
    borderWidth: 3, borderColor: "#fff", borderRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, flexShrink: 0,
  },
  logo: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
  },
  logoImg: { width: 52, height: 52 },
  logoInitial: { fontSize: 22, fontWeight: "900", color: "#fff" },

  nameBlock: { flex: 1, gap: 2, marginTop: 18 },
  name: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  noRating: { fontSize: 11, color: "#10b981", fontWeight: "600" },

  cta: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    marginTop: 16, flexShrink: 0,
  },

  slogan: { fontSize: 12, fontStyle: "italic", fontWeight: "600" },
  desc: { fontSize: 12, color: "#9ca3af" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f3f4f6", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  metaText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
});

// Mémoïsé : les objets boutique gardent la même référence après filtrage,
// donc on évite de re-rendre toutes les cartes à chaque frappe (le re-render
// massif fermait le clavier). On ignore l'identité de onPress (effet identique).
export default memo(AnimatedShopCard, (prev, next) => prev.item === next.item);
