import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";
import { LinearGradient } from "expo-linear-gradient";

function TabIcon({
  name, nameActive, label, focused, primary,
}: { name: any; nameActive: any; label: string; focused: boolean; primary: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  if (focused) {
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, speed: 60, bounciness: 10 }).start();
  } else {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  }

  return (
    <Animated.View style={[styles.tabItem, { transform: [{ scale }] }]}>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: primary + "20" }]} />
      )}
      <Ionicons
        name={focused ? nameActive : name}
        size={22}
        color={focused ? primary : "#9ca3af"}
      />
      <Text style={[styles.tabLabel, { color: focused ? primary : "#9ca3af", fontWeight: focused ? "700" : "500" }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={styles.addTabWrap}>
      <LinearGradient
        colors={[primary, primary + "cc"]}
        style={styles.addBtn}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </LinearGradient>
      <Text style={[styles.tabLabel, { color: primary, fontWeight: "700" }]}>Ajouter</Text>
    </View>
  );
}

export default function AppLayout() {
  const { primary } = useConfig();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 20 : 12,
          left: 16,
          right: 16,
          height: 72,
          borderRadius: 24,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 16,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="storefront-outline"
              nameActive="storefront"
              label="Boutique"
              focused={focused}
              primary={primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          tabBarIcon: () => <AddTabIcon primary={primary} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person-outline"
              nameActive="person"
              label="Profil"
              focused={focused}
              primary={primary}
            />
          ),
        }}
      />
      <Tabs.Screen name="edit-product" options={{ href: null }} />
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center", justifyContent: "center",
    gap: 3, paddingTop: 10, position: "relative",
  },
  activeIndicator: {
    position: "absolute", top: 8, width: 48, height: 32,
    borderRadius: 16,
  },
  tabLabel: { fontSize: 10, letterSpacing: 0.2 },
  addTabWrap: { alignItems: "center", justifyContent: "center", gap: 3 },
  addBtn: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
    marginTop: -18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
});
