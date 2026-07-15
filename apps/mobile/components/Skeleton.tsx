import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";

const { width: SW } = Dimensions.get("window");

function SkeletonBox({ width, height, borderRadius = 12, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#e5e7eb", opacity }, style]}
    />
  );
}

export function DashboardSkeleton() {
  const CARD = (SW - 56) / 2;
  return (
    <View style={sk.container}>
      {/* Header skeleton */}
      <View style={sk.header}>
        <View style={{ gap: 8 }}>
          <SkeletonBox width={120} height={14} borderRadius={7} />
          <SkeletonBox width={180} height={22} borderRadius={7} />
          <SkeletonBox width={100} height={12} borderRadius={6} />
        </View>
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* Stats row */}
      <View style={sk.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={sk.statCard}>
            <SkeletonBox width={32} height={32} borderRadius={16} />
            <SkeletonBox width={40} height={20} borderRadius={6} style={{ marginTop: 8 }} />
            <SkeletonBox width={56} height={11} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        <SkeletonBox width="100%" height={44} borderRadius={14} />
      </View>

      {/* Grid */}
      <View style={sk.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[sk.gridCard, { width: CARD }]}>
            <SkeletonBox width={CARD} height={CARD} borderRadius={0} />
            <View style={{ padding: 10, gap: 6 }}>
              <SkeletonBox width="80%" height={13} borderRadius={6} />
              <SkeletonBox width="50%" height={13} borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MarketplaceSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={sk.shopCard}>
          <View style={{ height: 56, backgroundColor: "#f3f4f6", borderRadius: "12px" as any }} />
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SkeletonBox width={52} height={52} borderRadius={18} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="60%" height={14} borderRadius={7} />
                <SkeletonBox width="40%" height={11} borderRadius={5} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonBox width={80} height={26} borderRadius={13} />
              <SkeletonBox width={70} height={26} borderRadius={13} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F4" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, backgroundColor: "#fff", marginBottom: 12,
  },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14,
    alignItems: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  gridCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" },
  shopCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
});
