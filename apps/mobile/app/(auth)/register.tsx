import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { authErrorMessage } from "../../lib/authErrors";
import { useConfig } from "../../context/ConfigContext";
import { BUSINESS_TYPES } from "../../lib/businessTypes";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { brand, colors } from "../../lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { primary } = useConfig();
  const [step, setStep] = useState<1 | 2>(1);
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ shopName?: string; businessType?: string; email?: string; password?: string; form?: string }>({});
  const clear = (k: keyof typeof errors) => setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));

  const handleNextStep = () => {
    const next: typeof errors = {};
    if (!shopName.trim()) next.shopName = "Entre le nom de ta boutique";
    if (!businessType) next.businessType = "Choisis le type de ta boutique";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep(2);
  };

  const handleRegister = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Entre ton email";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Cet email n'a pas l'air valide";
    if (!password) next.password = "Choisis un mot de passe";
    else if (password.length < 6) next.password = "6 caractères minimum";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { shop_name: shopName, business_type: businessType } },
    });
    if (error) { setErrors({ form: authErrorMessage(error) }); setLoading(false); return; }
    if (data.user) {
      await supabase.from("users").update({ shop_name: shopName, business_type: businessType }).eq("id", data.user.id);
    }
    setLoading(false);
    // La session active redirige automatiquement vers le dashboard (cf. _layout)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête : retour + progression */}
      <View style={styles.topbar}>
        <TouchableOpacity
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (step === 2 ? setStep(1) : router.back())}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={[styles.dot, step === 2 && styles.dotOn]} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={24}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>Ta boutique</Text>
            <Text style={styles.subtitle}>Donne-lui un nom et choisis ton activité.</Text>

            <View style={styles.form}>
              <Input
                label="Nom de la boutique"
                placeholder="Ex : Awa Fashion, Style by Kofi…"
                value={shopName}
                onChangeText={(v) => { setShopName(v); clear("shopName"); }}
                error={errors.shopName}
                autoCapitalize="words"
                autoFocus
              />

              <View>
                <Text style={styles.fieldLabel}>Type d'activité</Text>
                <View style={styles.bizGrid}>
                  {BUSINESS_TYPES.map((b) => {
                    const on = businessType === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => { setBusinessType(b.id); clear("businessType"); }}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={[styles.bizCard, on && styles.bizCardOn]}
                      >
                        <Text style={styles.bizEmoji}>{b.emoji}</Text>
                        <Text style={[styles.bizLabel, on && styles.bizLabelOn]}>{b.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.businessType ? <Text style={styles.fieldError}>{errors.businessType}</Text> : null}
              </View>

              <Button label="Continuer" icon="arrow-forward" onPress={handleNextStep} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Ton compte</Text>
            <Text style={styles.subtitle}>Crée ton accès — gratuit, prêt en 30 secondes.</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="ton@email.com"
                value={email}
                onChangeText={(v) => { setEmail(v); clear("email"); }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <Input
                label="Mot de passe"
                placeholder="6 caractères minimum"
                value={password}
                onChangeText={(v) => { setPassword(v); clear("password"); }}
                error={errors.password}
                secureTextEntry
              />
              {errors.form ? <Text style={styles.formError} accessibilityLiveRegion="polite">{errors.form}</Text> : null}
              <Button label="Créer ma boutique" icon="checkmark-circle-outline" loading={loading} onPress={handleRegister} />
            </View>
          </>
        )}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Déjà un compte ? <Text style={[styles.linkBold, { color: primary }]}>Se connecter</Text></Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgAlt, justifyContent: "center", alignItems: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 5, backgroundColor: colors.border },
  dotOn: { width: 22, backgroundColor: brand.blue },

  scroll: { padding: 24, paddingTop: 12, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  form: { gap: 18 },
  fieldError: { fontSize: 12, fontWeight: "600", color: "#DC2626", marginTop: 8 },
  formError: { fontSize: 13, fontWeight: "600", color: "#DC2626", backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 10 },

  bizGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bizCard: {
    width: "31%", borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", gap: 6, backgroundColor: colors.surface,
  },
  bizCardOn: { borderColor: brand.blue, backgroundColor: brand.blueSoft },
  bizEmoji: { fontSize: 26 },
  bizLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  bizLabelOn: { color: brand.blue, fontWeight: "700" },

  linkBtn: { alignItems: "center", paddingVertical: 18, marginTop: "auto" },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkBold: { fontWeight: "700" },
});
