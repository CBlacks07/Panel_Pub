"use client";
import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Dimensions, Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Image } from "react-native";
import { supabase } from "../../lib/supabase";
import { useConfig } from "../../context/ConfigContext";
import FadeSlide from "../../components/Animated/FadeSlide";

const { width } = Dimensions.get("window");
const IS_WEB_DESKTOP = Platform.OS === "web" && width > 768;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { config, primary } = useConfig();
  const appName = config.app_name || "Boutiki";
  const hasLogo = config.logo_url && config.logo_url.trim().length > 0;

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert("Email requis", "Entre ton email pour recevoir un lien de réinitialisation"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert("Erreur", error.message);
    else Alert.alert("Email envoyé !", `Un lien de réinitialisation a été envoyé à ${email}`);
  };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Champs manquants", "Remplis l'email et le mot de passe"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Connexion impossible", error.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={24}>
          <View style={[styles.card, IS_WEB_DESKTOP && styles.cardDesktop]}>
            {/* Logo */}
            <FadeSlide direction="down" delay={0} duration={500}>
            <View style={styles.logoWrap}>
              <View style={[styles.logo, { backgroundColor: hasLogo ? "transparent" : primary }]}>
                {hasLogo
                  ? <Image source={{ uri: config.logo_url }} style={styles.logoImage} resizeMode="cover" />
                  : <Text style={styles.logoText}>{appName[0].toUpperCase()}</Text>
                }
              </View>
              <Text style={styles.appName}>{appName}</Text>
            </View>

            </FadeSlide>
            <FadeSlide direction="up" delay={150} duration={500}>
            <Text style={styles.title}>Bon retour 👋</Text>
            <Text style={styles.subtitle}>Connecte-toi pour accéder à ta boutique</Text>

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
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: primary }, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? "Connexion..." : "Se connecter"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                <Text style={[styles.forgotText, { color: primary }]}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            </FadeSlide>
            <FadeSlide direction="up" delay={300}>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.linkBtn}>
                <Text style={styles.linkText}>Pas encore de compte ? <Text style={[styles.linkTextBold, { color: primary }]}>Créer un compte</Text></Text>
              </TouchableOpacity>
            </Link>
            </FadeSlide>
          </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: {
    width: "100%", maxWidth: 440,
    backgroundColor: "#fff", borderRadius: 24,
    padding: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardDesktop: { padding: 48 },
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logo: { width: 96, height: 96, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  logoText: { fontSize: 44, fontWeight: "800", color: "#fff" },
  logoImage: { width: 96, height: 96 },
  appName: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  title: { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 28, lineHeight: 20 },
  form: { gap: 16, marginBottom: 20 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#444" },
  input: {
    borderWidth: 1.5, borderColor: "#eee", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
  },
  btn: {
    borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  forgotBtn: { alignItems: "center", paddingVertical: 6 },
  forgotText: { fontSize: 13, fontWeight: "600" },
  linkBtn: { alignItems: "center", padding: 8 },
  linkText: { color: "#888", fontSize: 14 },
  linkTextBold: { fontWeight: "700" },
});
