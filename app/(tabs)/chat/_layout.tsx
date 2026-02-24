import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'

export default function Layout() {
  return (
    <>
      <Stack >
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} />
        <Stack.Screen name="chatOpen"  options={{ headerShown: false , presentation: 'modal' }}/>

      </Stack >
      <StatusBar style="auto" />
    </>
  )
}
