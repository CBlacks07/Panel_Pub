import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOnline) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (wasOffline) {
      // Afficher brièvement "Connexion rétablie" puis cacher
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -60, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -60, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }], opacity },
      isOnline ? styles.bannerOnline : styles.bannerOffline]}>
      <Ionicons
        name={isOnline ? "checkmark-circle" : "wifi-outline"}
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>
        {isOnline ? "Connexion rétablie" : "Pas de connexion internet"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 999,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  bannerOffline: { backgroundColor: "#ef4444" },
  bannerOnline: { backgroundColor: "#22c55e" },
  text: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
