import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { optimizeImage } from "../../lib/cloudinary";
import { brand, colors } from "../../lib/theme";

export type HomeProduct = {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  user_id: string;
  shop_name: string;
  business_type: string | null;
};

const CARD_W = 152;

/** Pastille catégorie ronde (type de boutique). */
export function CategoryCircle({
  emoji, label, selected, accent, onPress,
}: { emoji: string; label: string; selected: boolean; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.catWrap} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[
        styles.catCircle,
        selected && { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
      ]}>
        <Text style={styles.catEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.catLabel, selected && { color: colors.text, fontWeight: "800" }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Carte produit du home (image cover, badge promo, pastille vendeur, prix). */
export function ProductMiniCard({
  product, accent, fallbackEmoji, onPress,
}: { product: HomeProduct; accent: string; fallbackEmoji: string; onPress: () => void }) {
  const hasPromo = !!product.compare_at_price && product.compare_at_price > product.price;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: optimizeImage(product.image_url, CARD_W * 2.5) ?? product.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={{ fontSize: 40 }}>{fallbackEmoji}</Text>
          </View>
        )}

        {hasPromo && (
          <View style={styles.discount}>
            <Text style={styles.discountText}>-{Math.round((1 - product.price / product.compare_at_price!) * 100)}%</Text>
          </View>
        )}

        {/* Pastille vendeur */}
        <View style={styles.vendorPill}>
          <Ionicons name="storefront" size={10} color={accent} />
          <Text style={styles.vendorText} numberOfLines={1}>{product.shop_name}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: accent }]}>{product.price.toLocaleString("fr-FR")} F</Text>
        {hasPromo && (
          <Text style={styles.compare}>{product.compare_at_price!.toLocaleString("fr-FR")} F</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Catégorie ronde
  catWrap: { width: 66, alignItems: "center", gap: 5 },
  catCircle: {
    width: 58, height: 58, borderRadius: 20, backgroundColor: colors.surface,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "600", textAlign: "center" },

  // Carte produit
  card: { width: CARD_W },
  imageWrap: {
    width: CARD_W, height: CARD_W, borderRadius: 14, overflow: "hidden",
    backgroundColor: colors.pastelWarm, position: "relative",
    borderWidth: 1, borderColor: colors.border,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { justifyContent: "center", alignItems: "center", backgroundColor: colors.pastelWarm },
  discount: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: brand.coral, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  vendorPill: {
    position: "absolute", bottom: 8, left: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 9,
    paddingHorizontal: 7, paddingVertical: 4, alignSelf: "flex-start", maxWidth: CARD_W - 16,
  },
  vendorText: { fontSize: 10, fontWeight: "700", color: colors.text, flexShrink: 1 },
  title: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" },
  price: { fontSize: 14, fontWeight: "900" },
  compare: { fontSize: 11, color: colors.textMuted, textDecorationLine: "line-through", fontWeight: "600" },
});
