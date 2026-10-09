import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Linking } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { authErrorMessage } from "../../lib/authErrors";
import { useConfig } from "../../context/ConfigContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors } from "../../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const { config, primary } = useConfig();
  const appName = config.app_name || "Boutiki";
  const hasLogo = !!(config.logo_url && config.logo_url.trim().length > 0);

  const handleForgotPassword = async () => {
    if (!email.trim()) { setErrors({ email: "Entre ton email pour recevoir un lien de réinitialisation" }); return; }
    setErrors({});
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert("Erreur", authErrorMessage(error));
    else Alert.alert("Email envoyé !", `Un lien de réinitialisation a été envoyé à ${email}`);
  };

  const handleLogin = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Entre ton email";
    if (!password) next.password = "Entre ton mot de passe";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErrors({ form: authErrorMessage(error) });
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

        <Text style={styles.title}>Bon retour</Text>
        <Text style={styles.subtitle}>Connecte-toi pour accéder à ta boutique.</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="ton@email.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined, form: undefined })); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined, form: undefined })); }}
            error={errors.password}
            secureTextEntry
          />
          {errors.form ? <Text style={styles.formError} accessibilityLiveRegion="polite">{errors.form}</Text> : null}
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
  formError: { fontSize: 13, fontWeight: "600", color: "#DC2626", backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, lineHeight: 18 },
  forgot: { alignItems: "center", paddingVertical: 4 },
  forgotText: { fontSize: 13, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingTop: 24 },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkBold: { fontWeight: "700" },
  privacy: { alignItems: "center", paddingVertical: 12 },
  privacyText: { color: colors.textFaint, fontSize: 11, textAlign: "center" },
});
