import { View, Text, StyleSheet } from "react-native";

type Props = {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
};

export default function StarRating({ rating, count, size = "md" }: Props) {
  const fontSize = size === "sm" ? 12 : size === "lg" ? 22 : 16;
  const filled = Math.round(rating);

  return (
    <View style={styles.wrap}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Text key={s} style={[styles.star, { fontSize }, s <= filled ? styles.filled : styles.empty]}>
            ★
          </Text>
        ))}
      </View>
      {rating > 0 && (
        <Text style={[styles.label, { fontSize: fontSize - 4 }]}>
          {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  stars: { flexDirection: "row", gap: 1 },
  star: {},
  filled: { color: "#f59e0b" },
  empty: { color: "#e5e5e5" },
  label: { color: "#888", fontWeight: "600" },
});
