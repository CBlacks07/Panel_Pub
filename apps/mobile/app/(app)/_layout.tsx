import { Tabs } from "expo-router";
import { View, StyleSheet, Animated } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";

function TabIcon({ name, focused, primary }: { name: any; focused: boolean; primary: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  if (focused) {
    Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
  } else {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }

  return (
    <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, { transform: [{ scale }] }]}>
      <Ionicons name={name} size={22} color={focused ? primary : "#aaa"} />
    </Animated.View>
  );
}

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={[styles.addBtn, { backgroundColor: primary }]}>
      <Ionicons name="add" size={28} color="#fff" />
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
          bottom: 12,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 22,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "storefront" : "storefront-outline"} focused={focused} primary={primary} />
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
            <TabIcon name={focused ? "person" : "person-outline"} focused={focused} primary={primary} />
          ),
        }}
      />
      <Tabs.Screen name="edit-product" options={{ href: null }} />
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  addBtn: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    marginTop: -8,
  },
});
