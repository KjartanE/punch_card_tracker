import { Stack } from "expo-router"
import { useTheme } from "react-native-paper"

export default function ClientsLayout() {
  const theme = useTheme()

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.onSurface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Clients" }} />
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  )
}
