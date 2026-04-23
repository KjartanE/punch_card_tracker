import { useSQLiteContext } from "expo-sqlite"
import { useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import {
  Button,
  Chip,
  Dialog,
  IconButton,
  Portal,
  Text,
  useTheme,
} from "react-native-paper"

import { ActivityPicker } from "@/components/ActivityPicker"
import { computeEarnings, endEntry, startEntry } from "@/domain/timeEntries"
import { useSettings } from "@/hooks/useSettings"
import { useElapsedMs, useOpenEntry } from "@/hooks/useTimeEntries"
import { bump } from "@/stores/invalidation"
import {
  chipMatchesEntry,
  useActivitiesStore,
  type ActivityChip,
} from "@/stores/activities"
import type { TimeEntryType } from "@/types"
import { formatDuration } from "@/utils/duration"
import { formatCents } from "@/utils/money"

export default function NowScreen() {
  const db = useSQLiteContext()
  const theme = useTheme()
  const settings = useSettings()
  const openEntry = useOpenEntry()
  const chips = useActivitiesStore((s) => s.chips)
  const activitiesLoaded = useActivitiesStore((s) => s.loaded)
  const addChip = useActivitiesStore((s) => s.add)
  const removeChip = useActivitiesStore((s) => s.remove)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<ActivityChip | null>(null)
  const [busy, setBusy] = useState(false)

  if (openEntry === undefined || settings === null || !activitiesLoaded) {
    return null
  }

  const startLap = async (chip: ActivityChip) => {
    if (busy) return
    if (openEntry && chipMatchesEntry(chip, openEntry)) return
    setBusy(true)
    try {
      await startEntry(db, {
        clientId: chip.clientId,
        jobId: chip.jobId,
        type: chip.type,
      })
      bump("timeEntries")
    } finally {
      setBusy(false)
    }
  }

  const stopTimer = async () => {
    if (!openEntry || busy) return
    setBusy(true)
    try {
      await endEntry(db, openEntry.id)
      bump("timeEntries")
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ActiveTimerBanner
        openEntry={openEntry}
        settings={settings}
        onStop={stopTimer}
      />
      <ScrollView contentContainerStyle={styles.chipWrap}>
        <Text variant="labelLarge" style={{ marginBottom: 8, opacity: 0.7 }}>
          Activities · tap to start / lap
        </Text>
        <View style={styles.chipGrid}>
          {chips.map((chip) => {
            const isActive = !!openEntry && chipMatchesEntry(chip, openEntry)
            return (
              <Chip
                key={chip.id}
                icon={typeIcon(chip.type)}
                mode={isActive ? "flat" : "outlined"}
                selected={isActive}
                showSelectedCheck={false}
                onPress={() => void startLap(chip)}
                onLongPress={() => setConfirmRemove(chip)}
                style={styles.chip}
              >
                {chip.label}
              </Chip>
            )
          })}
          <Chip
            icon="plus"
            mode="outlined"
            onPress={() => setPickerOpen(true)}
            style={styles.chip}
          >
            Add
          </Chip>
        </View>
        {chips.length === 0 ? (
          <Text style={{ opacity: 0.6, marginTop: 12 }}>
            Add an activity to start tracking. Tip: long-press a chip to remove
            it.
          </Text>
        ) : null}
      </ScrollView>

      <ActivityPicker
        visible={pickerOpen}
        onDismiss={() => setPickerOpen(false)}
        onSelect={(v, label) => {
          addChip({
            label,
            clientId: v.clientId,
            jobId: v.jobId,
            type: v.type,
          })
          setPickerOpen(false)
        }}
      />

      <Portal>
        <Dialog
          visible={confirmRemove !== null}
          onDismiss={() => setConfirmRemove(null)}
        >
          <Dialog.Title>Remove activity?</Dialog.Title>
          <Dialog.Content>
            <Text>
              {`"${confirmRemove?.label}" will be removed from your quick-start list. Past entries stay in history.`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmRemove(null)}>Cancel</Button>
            <Button
              onPress={() => {
                if (confirmRemove) removeChip(confirmRemove.id)
                setConfirmRemove(null)
              }}
              textColor={theme.colors.error}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

function typeIcon(type: TimeEntryType): string {
  if (type === "driving") return "car"
  if (type === "office") return "office-building-outline"
  return "hammer-wrench"
}

function typeLabel(type: TimeEntryType): string {
  if (type === "driving") return "Driving"
  if (type === "office") return "Office"
  return "Onsite"
}

interface BannerProps {
  openEntry: ReturnType<typeof useOpenEntry>
  settings: NonNullable<ReturnType<typeof useSettings>>
  onStop: () => void | Promise<void>
}

function ActiveTimerBanner({ openEntry, settings, onStop }: BannerProps) {
  const theme = useTheme()
  const elapsed = useElapsedMs(openEntry?.startedAt ?? null)

  if (!openEntry) {
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Text variant="labelLarge" style={{ opacity: 0.7 }}>
          NOT RUNNING
        </Text>
        <Text
          variant="displaySmall"
          style={{ fontVariant: ["tabular-nums"], opacity: 0.4 }}
        >
          00:00:00
        </Text>
        <Text variant="bodyMedium" style={{ opacity: 0.6, marginTop: 4 }}>
          Tap any activity below to start.
        </Text>
      </View>
    )
  }

  const earnings = computeEarnings(
    openEntry,
    {
      onsiteCents: settings.defaultOnsiteRateCents,
      drivingCents: settings.defaultDrivingRateCents,
    },
    Date.now(),
  )
  const running =
    earnings.effectiveRateCents != null
      ? Math.round((elapsed / 3_600_000) * earnings.effectiveRateCents)
      : null

  const primary =
    openEntry.jobName ?? openEntry.clientName ?? typeLabel(openEntry.type)
  const secondary =
    openEntry.jobName && openEntry.clientName
      ? openEntry.clientName
      : openEntry.jobName
        ? null
        : openEntry.clientName
          ? typeLabel(openEntry.type)
          : null

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.onPrimaryContainer }}
        >
          RUNNING
        </Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="stop"
          mode="contained"
          containerColor={theme.colors.error}
          iconColor={theme.colors.onError}
          onPress={() => void onStop()}
          size={20}
        />
      </View>
      <Text
        variant="displaySmall"
        style={{
          fontVariant: ["tabular-nums"],
          color: theme.colors.onPrimaryContainer,
        }}
      >
        {formatDuration(elapsed, true)}
      </Text>
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}
      >
        {primary}
      </Text>
      {secondary ? (
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onPrimaryContainer, opacity: 0.75 }}
        >
          {secondary}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <Chip icon={typeIcon(openEntry.type)} compact>
          {typeLabel(openEntry.type)}
        </Chip>
        {running != null ? (
          <Chip icon="cash" compact>
            {formatCents(running, settings.currency)}
          </Chip>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    padding: 20,
    gap: 2,
  },
  chipWrap: {
    padding: 16,
    gap: 8,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {},
})
