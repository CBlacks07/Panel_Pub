"use client";
import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Image } from "react-native";
import { supabase } from "../../lib/supabase";
import { useConfig } from "../../context/ConfigContext";
import { BUSINESS_TYPES } from "../../lib/businessTypes";

const { width } = Dimensions.get("window");
const IS_WEB_DESKTOP = Platform.OS === "web" && width > 768;

export default function RegisterScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { config, primary } = useConfig();
  const appName = config.app_name || "Boutiki";
  const vendorCta = config.vendor_cta || "Créer ma boutique gratuitement";
  const hasLogo = config.logo_url && config.logo_url.trim().length > 0;

  const handleNextStep = () => {
    if (!shopName.trim()) { Alert.alert("Champ manquant", "Entre le nom de ta boutique"); return; }
    if (!businessType) { Alert.alert("Champ manquant", "Choisis le type de ta boutique"); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!email || !password) { Alert.alert("Champs manquants", "Remplis tous les champs"); return; }
    if (password.length < 6) { Alert.alert("Mot de passe trop court", "6 caractères minimum"); return; }
    setLoading(true);
    // Note: la vérification WhatsApp se fait dans le profil, pas à l'inscription
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { shop_name: shopName, business_type: businessType } },
    });
    if (error) {
      Alert.alert("Erreur", error.message);
      setLoading(false);
      return;
    }
    // Mettre à jour directement le profil avec le business_type
    // (au cas où le trigger ne le fait pas encore)
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        shop_name: shopName,
        business_type: businessType,
      });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, IS_WEB_DESKTOP && styles.cardDesktop]}>

            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={[styles.logo, { backgroundColor: hasLogo ? "transparent" : primary }]}>
                {hasLogo
                  ? <Image source={{ uri: config.logo_url }} style={styles.logoImage} resizeMode="cover" />
                  : <Text style={styles.logoText}>{appName[0].toUpperCase()}</Text>
                }
              </View>
              <Text style={styles.appName}>{appName}</Text>
            </View>

            {/* Étapes */}
            <View style={styles.stepsRow}>
              <View style={[styles.stepCircle, { backgroundColor: primary }]}>
                <Text style={styles.stepCircleText}>1</Text>
              </View>
              <View style={[styles.stepLine, step === 2 && { backgroundColor: primary }]} />
              <View style={[styles.stepCircle, step === 2 ? { backgroundColor: primary } : styles.stepCircleInactive]}>
                <Text style={[styles.stepCircleText, step !== 2 && { color: "#aaa" }]}>2</Text>
              </View>
            </View>

            {step === 1 ? (
              <>
                <Text style={styles.title}>Ta boutique 🛍️</Text>
                <Text style={styles.subtitle}>Donne un nom à ta boutique et choisis ton activité</Text>

                <View style={styles.form}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Nom de ta boutique</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Awa Fashion, Style by Kofi..."
                      placeholderTextColor="#bbb"
                      value={shopName}
                      onChangeText={setShopName}
                      autoCapitalize="words"
                      autoFocus
                    />
                  </View>

                  <Text style={styles.inputLabel}>Type de boutique</Text>
                  <View style={styles.businessGrid}>
                    {BUSINESS_TYPES.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.businessCard, businessType === b.id && { borderColor: primary, backgroundColor: primary + "10" }]}
                        onPress={() => setBusinessType(b.id)}
                      >
                        <Text style={styles.businessEmoji}>{b.emoji}</Text>
                        <Text style={[styles.businessLabel, businessType === b.id && { color: primary, fontWeight: "700" }]}>{b.label}</Text>
                        <Text style={styles.businessDesc} numberOfLines={1}>{b.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: primary }]}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.btnText}>Continuer {">"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Ton compte</Text>
                <Text style={styles.subtitle}>Crée ton accès — Gratuit, prêt en 30 secondes</Text>

                <View style={styles.form}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ton@email.com"
                      placeholderTextColor="#bbb"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Mot de passe</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6 caractères minimum"
                      placeholderTextColor="#bbb"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: primary }, loading && styles.btnDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <Text style={styles.btnText}>{loading ? "Création..." : vendorCta}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{"<"} Retour</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.linkBtn}>
                <Text style={styles.linkText}>Déjà un compte ? <Text style={[styles.linkTextBold, { color: primary }]}>Se connecter</Text></Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, paddingBottom: 40 },
  card: {
    width: "100%", maxWidth: 440, backgroundColor: "#fff", borderRadius: 24, padding: 28,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardDesktop: { padding: 48 },
  logoWrap: { alignItems: "center", marginBottom: 20 },
  logo: { width: 96, height: 96, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  logoImage: { width: 96, height: 96 },
  logoText: { fontSize: 44, fontWeight: "800", color: "#fff" },
  appName: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 20 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  stepCircleInactive: { backgroundColor: "#e5e5e5" },
  stepCircleText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  stepLine: { width: 48, height: 2, backgroundColor: "#e5e5e5" },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 20 },
  form: { gap: 16 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 2 },
  input: {
    borderWidth: 1.5, borderColor: "#eee", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
  },
  businessGrid: { gap: 8 },
  businessCard: {
    borderWidth: 1.5, borderColor: "#eee", borderRadius: 14, padding: 14,
    backgroundColor: "#fafafa",
  },
  businessEmoji: { fontSize: 24, marginBottom: 4 },
  businessLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 2 },
  businessDesc: { fontSize: 12, color: "#aaa" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backBtn: { alignItems: "center", padding: 8 },
  backBtnText: { color: "#aaa", fontSize: 14 },
  linkBtn: { alignItems: "center", padding: 8, marginTop: 8 },
  linkText: { color: "#888", fontSize: 14 },
  linkTextBold: { fontWeight: "700" },
});
