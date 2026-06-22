import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useConfig } from "../../context/ConfigContext";
import { Button } from "../../components/ui/Button";
import { colors } from "../../lib/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const { config, primary } = useConfig();
  const appName = config.app_name || "Boutiki";
  const hasLogo = !!(config.logo_url && config.logo_url.trim().length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[primary, primary + "bb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.illus}
        >
          {hasLogo ? (
            <Image source={{ uri: config.logo_url }} style={styles.logoImg} resizeMode="cover" />
          ) : (
            <Text style={styles.illusEmoji}>🛍️</Text>
          )}
        </LinearGradient>

        <Text style={styles.title}>Ta boutique{"\n"}en ligne en 2 min</Text>
        <Text style={styles.subtitle}>
          Publie tes articles et reçois tes commandes directement sur WhatsApp.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button label="Créer ma boutique" icon="storefront-outline" onPress={() => router.push("/(auth)/register")} />
        <Button label="J'ai déjà un compte" variant="ghost" onPress={() => router.push("/(auth)/login")} />
        <Text style={styles.appName}>{appName}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 24, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 22 },
  illus: {
    width: 168, height: 168, borderRadius: 36, alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#2563EB", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  illusEmoji: { fontSize: 78 },
  logoImg: { width: 168, height: 168 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center", lineHeight: 34 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  footer: { gap: 12, alignItems: "center" },
  appName: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 4 },
});
