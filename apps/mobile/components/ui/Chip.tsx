import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useConfig } from "../../context/ConfigContext";
import { colors, radius } from "../../lib/theme";

/**
 * Puce sélectionnable (filtres, catégories, options).
 */
export function Chip({
  label, selected, onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { primary } = useConfig();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && { backgroundColor: primary, borderColor: primary }]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface,
  },
  text: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  textSelected: { color: "#fff", fontWeight: "700" },
});
