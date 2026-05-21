import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ConfigProvider } from "../context/ConfigContext";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useState } from "react";

// Empêche le splash de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";
    const inPublicGroup = segments[0] === "shop" || segments[0] === "marketplace";
    const isSplash = (segments as string[]).length === 0 || segments[0] === "index";

    if (isSplash) return;

    if (!session && inAppGroup) {
      router.replace("/marketplace");
    } else if (!session && !inAuthGroup && !inPublicGroup) {
      router.replace("/marketplace");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [session, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Charger les polices — si ça échoue, continuer quand même
        await Font.loadAsync({
          PlusJakartaSans_400Regular: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_400Regular.ttf"),
          PlusJakartaSans_500Medium: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_500Medium.ttf"),
          PlusJakartaSans_600SemiBold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_600SemiBold.ttf"),
          PlusJakartaSans_700Bold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_700Bold.ttf"),
          PlusJakartaSans_800ExtraBold: require("@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_800ExtraBold.ttf"),
        });
      } catch (e) {
        // Polices non chargées — l'app fonctionne avec les polices système
        console.warn("Font loading failed, using system fonts:", e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
