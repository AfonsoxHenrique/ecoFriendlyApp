import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: "#f2f2f2",
          borderTopWidth: 0,
          height: 54,          
          paddingTop: 8,       
          paddingBottom: 8,     
      },
        tabBarActiveTintColor: "#6B8E5A", 
        tabBarInactiveTintColor: "#9ca3af", 
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? "home" : "home-outline"}
            size={24}
            color={color}
          />
        ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? "heart" : "heart-outline"}
            size={24}
            color={color}
          />
        ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? "bag-handle" : "bag-handle-outline"}
            size={24}
            color={color}
          />
        ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? "leaf" : "leaf-outline"}
            size={24}
            color={color}
          />
        ),
        }}
      />
    </Tabs>
  );
}