import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ConfigProvider } from "../context/ConfigContext";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

// Garder le splash screen visible pendant le chargement
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
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Cacher le splash dès que les polices sont prêtes (ou en cas d'erreur)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Attendre que les polices chargent
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: "#34adea" }} />;
  }

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
