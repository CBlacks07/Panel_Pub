import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={[styles.addBtn, { backgroundColor: primary }]}>
      <Ionicons name="add" size={30} color="#fff" />
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
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: "#b0b8c1",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
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
          tabBarLabel: "Boutique",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              size={24}
              color={focused ? primary : "#b0b8c1"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          tabBarLabel: "Ajouter",
          tabBarIcon: () => <AddTabIcon primary={primary} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={focused ? primary : "#b0b8c1"}
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
