import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ConfigProvider } from "../context/ConfigContext";
import * as SplashScreen from "expo-splash-screen";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Cacher le splash après un court délai — polices chargées via CSS/native
    const timer = setTimeout(async () => {
      setReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

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
