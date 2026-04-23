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
import { hydrateActivities } from "@/stores/activities"
import { darkTheme, lightTheme } from "@/theme"

export default function RootLayout() {
  const scheme = useColorScheme()
  const theme = scheme === "dark" ? darkTheme : lightTheme

  useEffect(() => {
    void hydrateActivities()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <SQLiteProvider databaseName={DB_NAME} onInit={migrate}>
            <PaperProvider theme={theme}>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
              </Stack>
            </PaperProvider>
          </SQLiteProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
