import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Linking } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useConfig } from "../../context/ConfigContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors } from "../../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { config, primary } = useConfig();
  const appName = config.app_name || "Boutiki";
  const hasLogo = !!(config.logo_url && config.logo_url.trim().length > 0);

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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={[styles.logo, { backgroundColor: hasLogo ? "transparent" : primary }]}>
            {hasLogo
              ? <Image source={{ uri: config.logo_url }} style={styles.logoImg} resizeMode="cover" />
              : <Text style={styles.logoText}>{appName[0].toUpperCase()}</Text>}
          </View>
          <Text style={styles.appName}>{appName}</Text>
        </View>

        <Text style={styles.title}>Bon retour 👋</Text>
        <Text style={styles.subtitle}>Connecte-toi pour accéder à ta boutique.</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="ton@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button label="Se connecter" loading={loading} onPress={handleLogin} />
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgot}>
            <Text style={[styles.forgotText, { color: primary }]}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Pas encore de compte ? <Text style={[styles.linkBold, { color: primary }]}>Créer ma boutique</Text></Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity onPress={() => Linking.openURL("https://panel-pub-web.vercel.app/privacy")} style={styles.privacy}>
          <Text style={styles.privacyText}>Politique de confidentialité · Conditions d'utilisation</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logo: {
    width: 88, height: 88, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 10, overflow: "hidden",
    shadowColor: "#2563EB", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  logoText: { fontSize: 40, fontWeight: "800", color: "#fff" },
  logoImg: { width: 88, height: 88 },
  appName: { fontSize: 18, fontWeight: "800", color: colors.text },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  form: { gap: 16 },
  forgot: { alignItems: "center", paddingVertical: 4 },
  forgotText: { fontSize: 13, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingTop: 24 },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkBold: { fontWeight: "700" },
  privacy: { alignItems: "center", paddingVertical: 12 },
  privacyText: { color: colors.textFaint, fontSize: 11, textAlign: "center" },
});
