import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  name, nameActive, label, focused, primary,
}: { name: any; nameActive: any; label: string; focused: boolean; primary: string }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? nameActive : name}
        size={22}
        color={focused ? primary : "#9ca3af"}
      />
      <Text
        style={[styles.tabLabel, { color: focused ? primary : "#9ca3af", fontWeight: focused ? "700" : "500" }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: primary }]} />}
    </View>
  );
}

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={styles.addWrap}>
      <View style={[styles.addBtn, { backgroundColor: primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
      <Text style={[styles.tabLabel, { color: primary, fontWeight: "700" }]} numberOfLines={1}>
        Ajouter
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { primary } = useConfig();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="storefront-outline" nameActive="storefront" label="Boutique" focused={focused} primary={primary} />
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
            <TabIcon name="person-outline" nameActive="person" label="Profil" focused={focused} primary={primary} />
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
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 2,
    position: "relative",
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  addWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
