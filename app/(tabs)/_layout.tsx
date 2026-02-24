import { IconSymbol } from "@/components/ui/icon-symbol";
import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="bolt" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="search" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "create",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="plus" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="message.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarBadge: 2,
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
