import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getAppConfig, AppConfig } from "../lib/config";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const mountTime = useRef(Date.now());
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAppConfig(true).then((cfg) => {
      setConfig(cfg);
      setConfigLoaded(true);
    });
  }, []);

  // Lance les animations dès que la config est chargée
  useEffect(() => {
    if (!configLoaded) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(bgScale, { toValue: 1, tension: 25, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [configLoaded]);

  useEffect(() => {
    if (loading) return;
    const MIN_DISPLAY = 4500;
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(MIN_DISPLAY - elapsed, 0);
    const timer = setTimeout(() => {
      router.replace(session ? "/(app)/dashboard" : "/marketplace");
    }, remaining);
    return () => clearTimeout(timer);
  }, [loading, session]);

  const primaryColor = config?.primary_color || "#34adea";
  const title = config?.splash_title || "Boutiki";
  const subtitle = config?.splash_subtitle || "Ta boutique en ligne, tes clients à portée de main.";
  const hasLogo = config?.logo_url && config.logo_url.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <Animated.View style={[styles.circle1, { transform: [{ scale: bgScale }] }]} />
      <Animated.View style={[styles.circle2, { transform: [{ scale: bgScale }] }]} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logo}>
          {hasLogo ? (
            <Image source={{ uri: config!.logo_url }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={[styles.logoText, { color: primaryColor }]}>{title[0].toUpperCase()}</Text>
          )}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        {title}
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        {subtitle}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  circle1: {
    position: "absolute", width: width * 1.5, height: width * 1.5,
    borderRadius: width * 0.75, backgroundColor: "rgba(255,255,255,0.06)",
    top: -width * 0.5, left: -width * 0.25,
  },
  circle2: {
    position: "absolute", width: width, height: width,
    borderRadius: width * 0.5, backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -width * 0.3, right: -width * 0.2,
  },
  logoWrap: { marginBottom: 24 },
  logo: {
    width: 130, height: 130, borderRadius: 36,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    overflow: "hidden",
  },
  logoText: { fontSize: 68, fontWeight: "800" },
  logoImage: { width: 130, height: 130 },
  appName: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: 1, marginBottom: 12 },
  tagline: {
    fontSize: 15, color: "rgba(255,255,255,0.85)",
    textAlign: "center", paddingHorizontal: 40, lineHeight: 22,
  },
});
