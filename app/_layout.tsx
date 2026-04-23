import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SQLiteProvider } from "expo-sqlite"
import { useEffect } from "react"
import { useColorScheme } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { DB_NAME, migrate } from "@/db"
import { useSettings } from "@/hooks/useSettings"
import { hydrateActivities } from "@/stores/activities"
import { buildTheme, DEFAULT_ACCENT_ID } from "@/theme"

export default function RootLayout() {
  useEffect(() => {
    void hydrateActivities()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <SQLiteProvider databaseName={DB_NAME} onInit={migrate}>
            <ThemedRoot />
          </SQLiteProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}

function ThemedRoot() {
  const systemScheme = useColorScheme()
  const settings = useSettings()

  const mode = settings?.themeMode ?? "system"
  const effective =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode
  const accent = settings?.accentColor ?? DEFAULT_ACCENT_ID
  const theme = buildTheme(accent, effective)

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={effective === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  )
}
