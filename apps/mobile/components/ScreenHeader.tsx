import { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../lib/theme";

/**
 * En-tête d'écran standard : bouton retour + titre (+ sous-titre / action).
 * Unifie les écrans secondaires (add/edit produit, forfaits, plans...).
 */
export function ScreenHeader({
  title, subtitle, onBack, right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Retour">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right ?? <View style={{ width: 36 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center",
  },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  right: { minWidth: 36, alignItems: "flex-end" },
});
