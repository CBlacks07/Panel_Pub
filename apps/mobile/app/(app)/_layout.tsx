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
        size={24}
        color={focused ? primary : "#b0b8c1"}
      />
      <Text style={[styles.tabLabel, { color: focused ? primary : "#b0b8c1" }]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={styles.addWrap}>
      <View style={[styles.addBtn, { backgroundColor: primary }]}>
        <Ionicons name="add" size={30} color="#fff" />
      </View>
      <Text style={[styles.tabLabel, { color: primary }]} numberOfLines={1}>
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
          borderTopColor: "#ebebeb",
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="storefront-outline" nameActive="storefront"
              label="Boutique" focused={focused} primary={primary} />
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
            <TabIcon name="person-outline" nameActive="person"
              label="Profil" focused={focused} primary={primary} />
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
    gap: 4,
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  addWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
});
