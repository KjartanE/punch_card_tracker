import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker"
import { useState } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper"

interface Props {
  value: number | null
  label?: string
  placeholder?: string
  onChange: (ms: number | null) => void
  allowClear?: boolean
  clearLabel?: string
}

function formatDateOnly(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatTimeOnly(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mergeDate(base: number, picked: Date): number {
  const d = new Date(base)
  d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
  return d.getTime()
}

function mergeTime(base: number, picked: Date): number {
  const d = new Date(base)
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
  return d.getTime()
}

export function DateTimeField({
  value,
  label,
  placeholder,
  onChange,
  allowClear,
  clearLabel = "Clear",
}: Props) {
  const theme = useTheme()
  const [iosPicker, setIosPicker] = useState<"date" | "time" | null>(null)
  const effective = value ?? Date.now()

  const openAndroid = (mode: "date" | "time") => {
    DateTimePickerAndroid.open({
      value: new Date(effective),
      mode,
      is24Hour: true,
      onChange: (ev, picked) => {
        if (ev.type !== "set" || !picked) return
        const next =
          mode === "date"
            ? mergeDate(effective, picked)
            : mergeTime(effective, picked)
        onChange(next)
      },
    })
  }

  const open = (mode: "date" | "time") => {
    if (Platform.OS === "android") openAndroid(mode)
    else setIosPicker(mode)
  }

  const dateText = value === null ? (placeholder ?? "—") : formatDateOnly(value)
  const timeText = value === null ? "—" : formatTimeOnly(value)
  const isPlaceholder = value === null

  return (
    <View>
      {label ? (
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}
        >
          {label}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Button
          mode="outlined"
          icon="calendar"
          style={{ flex: 3 }}
          onPress={() => open("date")}
          textColor={
            isPlaceholder ? theme.colors.onSurfaceVariant : theme.colors.primary
          }
        >
          {dateText}
        </Button>
        <Button
          mode="outlined"
          icon="clock-outline"
          style={{ flex: 2 }}
          onPress={() => open("time")}
          disabled={isPlaceholder}
          textColor={
            isPlaceholder ? theme.colors.onSurfaceVariant : theme.colors.primary
          }
        >
          {timeText}
        </Button>
      </View>
      {allowClear && value !== null ? (
        <Button
          mode="text"
          compact
          onPress={() => onChange(null)}
          style={{ alignSelf: "flex-start", marginTop: 4 }}
        >
          {clearLabel}
        </Button>
      ) : null}

      {Platform.OS === "ios" ? (
        <Portal>
          <Dialog
            visible={iosPicker !== null}
            onDismiss={() => setIosPicker(null)}
          >
            <Dialog.Content>
              {iosPicker ? (
                <DateTimePicker
                  value={new Date(effective)}
                  mode={iosPicker}
                  display="spinner"
                  is24Hour
                  onChange={(_ev, picked) => {
                    if (!picked) return
                    const next =
                      iosPicker === "date"
                        ? mergeDate(effective, picked)
                        : mergeTime(effective, picked)
                    onChange(next)
                  }}
                />
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIosPicker(null)}>Done</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
})
