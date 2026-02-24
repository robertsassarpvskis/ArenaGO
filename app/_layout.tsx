// app/_layout.tsx
import { ParticipatedEventsProvider } from "@/hooks/context/ParticipatedEventsContext";
import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ParticipatedEventsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ParticipatedEventsProvider>
    </AuthProvider>
  );
}
