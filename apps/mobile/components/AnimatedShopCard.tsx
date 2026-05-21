import { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import StarRating from "./StarRating";
import { useConfig } from "../context/ConfigContext";
import { getBusinessType } from "../lib/businessTypes";
import { formatDistance } from "../lib/location";
import { Ionicons } from "@expo/vector-icons";

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

export default function AnimatedShopCard({ item, index, onPress }: Props) {
  const { primary } = useConfig();
  const biz = getBusinessType(item.business_type || "mode");
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={[styles.avatar, { backgroundColor: primary }]}>
          {item.shop_logo_url && item.shop_logo_url.trim().length > 0 ? (
            <Image source={{ uri: item.shop_logo_url }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{item.shop_name[0].toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.shop_name}</Text>
            <View style={[styles.bizBadge, { backgroundColor: primary + "18" }]}>
              <Text style={styles.bizBadgeText}>{biz.emoji}</Text>
            </View>
          </View>
          {item.avg_rating > 0 && <StarRating rating={item.avg_rating} count={item.rating_count} size="sm" />}
          {item.slogan ? <Text style={[styles.slogan, { color: primary }]} numberOfLines={1}>"{item.slogan}"</Text> : null}
          {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.count}>
              {item.product_count > 0
                ? `${item.product_count} ${biz.ui.itemLabel}${item.product_count > 1 ? "s" : ""}`
                : `Aucun ${biz.ui.itemLabel} pour l'instant`}
            </Text>
            {(item.distance !== undefined || item.city) && (
              <View style={styles.locationBadge}>
                <Ionicons name="location-outline" size={11} color="#6b7280" />
                <Text style={styles.locationText}>
                  {item.distance !== undefined
                    ? formatDistance(item.distance)
                    : item.city}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 18, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", flexShrink: 0, overflow: "hidden" },
  avatarImg: { width: 56, height: 56 },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", flex: 1 },
  bizBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  bizBadgeText: { fontSize: 14 },
  slogan: { fontSize: 12, fontStyle: "italic", fontWeight: "600" },
  desc: { fontSize: 12, color: "#888", lineHeight: 17 },
  count: { fontSize: 11, color: "#aaa", fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  arrow: { fontSize: 24, color: "#ccc", fontWeight: "300" },
});
