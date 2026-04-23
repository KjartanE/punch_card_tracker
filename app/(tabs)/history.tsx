import { useSQLiteContext } from "expo-sqlite"
import { useMemo, useState } from "react"
import { SectionList, StyleSheet, View } from "react-native"
import {
  Chip,
  Divider,
  FAB,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper"

import { TimeEntryEditDialog } from "@/components/TimeEntryEditDialog"
import {
  computeEarnings,
  deleteTimeEntry,
  insertTimeEntry,
  updateTimeEntry,
  type TimeEntryView,
} from "@/domain/timeEntries"
import { useClients } from "@/hooks/useClients"
import { useSettings } from "@/hooks/useSettings"
import { useTimeEntries } from "@/hooks/useTimeEntries"
import { bump } from "@/stores/invalidation"
import { formatDayHeader, startOfDay } from "@/utils/datetime"
import { formatDuration, formatHours } from "@/utils/duration"
import { formatCents } from "@/utils/money"

interface DaySection {
  title: string
  dayMs: number
  data: TimeEntryView[]
  totalMs: number
  totalCents: number | null
}

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; editing: TimeEntryView }

export default function HistoryScreen() {
  const db = useSQLiteContext()
  const theme = useTheme()
  const settings = useSettings()
  const clients = useClients({ includeArchived: true })

  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [clientMenuOpen, setClientMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState>({ open: false })

  const entries = useTimeEntries({
    clientId: clientFilter ?? undefined,
    limit: 500,
  })

  const sections = useMemo<DaySection[]>(() => {
    if (!entries || !settings) return []
    const defaults = {
      onsiteCents: settings.defaultOnsiteRateCents,
      drivingCents: settings.defaultDrivingRateCents,
    }
    const byDay = new Map<number, DaySection>()
    for (const entry of entries) {
      const dayMs = startOfDay(entry.startedAt)
      const earnings = computeEarnings(entry, defaults)
      let section = byDay.get(dayMs)
      if (!section) {
        section = {
          title: formatDayHeader(dayMs),
          dayMs,
          data: [],
          totalMs: 0,
          totalCents: 0,
        }
        byDay.set(dayMs, section)
      }
      section.data.push(entry)
      section.totalMs += earnings.durationMs
      if (earnings.earningsCents == null) {
        section.totalCents = null
      } else if (section.totalCents != null) {
        section.totalCents += earnings.earningsCents
      }
    }
    return Array.from(byDay.values()).sort((a, b) => b.dayMs - a.dayMs)
  }, [entries, settings])

  if (!settings || clients === null) return null

  const activeClient = clientFilter
    ? clients.find((c) => c.id === clientFilter)
    : null
  const currency = settings.currency

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterBar}>
        <Menu
          visible={clientMenuOpen}
          onDismiss={() => setClientMenuOpen(false)}
          anchor={
            <Chip
              icon="filter-variant"
              onPress={() => setClientMenuOpen(true)}
              mode={clientFilter ? "flat" : "outlined"}
              selected={!!clientFilter}
            >
              {activeClient?.name ?? "All clients"}
            </Chip>
          }
        >
          <Menu.Item
            title="All clients"
            onPress={() => {
              setClientFilter(null)
              setClientMenuOpen(false)
            }}
          />
          <Divider />
          {clients.map((c) => (
            <Menu.Item
              key={c.id}
              title={c.name}
              onPress={() => {
                setClientFilter(c.id)
                setClientMenuOpen(false)
              }}
            />
          ))}
        </Menu>
      </View>
      <Divider />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text variant="labelLarge" style={{ flex: 1 }}>
              {section.title}
            </Text>
            <Text variant="labelMedium" style={{ opacity: 0.75 }}>
              {formatHours(section.totalMs)}
              {section.totalCents != null
                ? `  ·  ${formatCents(section.totalCents, currency)}`
                : ""}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            defaults={{
              onsiteCents: settings.defaultOnsiteRateCents,
              drivingCents: settings.defaultDrivingRateCents,
            }}
            currency={currency}
            onPress={() =>
              setDialog({ open: true, mode: "edit", editing: item })
            }
          />
        )}
        ItemSeparatorComponent={Divider}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          entries !== null ? (
            <View style={{ padding: 32 }}>
              <Text style={{ textAlign: "center", opacity: 0.6 }}>
                No completed entries yet. Punch in from the Now tab, or tap + to
                add one manually.
              </Text>
            </View>
          ) : null
        }
      />
      <FAB
        icon="plus"
        label="Add entry"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => setDialog({ open: true, mode: "create" })}
      />
      {dialog.open ? (
        <TimeEntryEditDialog
          visible
          mode={dialog.mode}
          initialValues={
            dialog.mode === "edit"
              ? {
                  clientId: dialog.editing.clientId,
                  jobId: dialog.editing.jobId,
                  type: dialog.editing.type,
                  startedAt: dialog.editing.startedAt,
                  endedAt: dialog.editing.endedAt,
                  notes: dialog.editing.notes,
                }
              : {
                  clientId: null,
                  jobId: null,
                  type: "onsite",
                  startedAt: Date.now() - 60 * 60 * 1000,
                  endedAt: Date.now(),
                  notes: null,
                }
          }
          onDismiss={() => setDialog({ open: false })}
          onSave={async (values) => {
            if (dialog.mode === "edit") {
              await updateTimeEntry(db, dialog.editing.id, values)
            } else {
              if (values.endedAt === null) return
              await insertTimeEntry(db, {
                clientId: values.clientId,
                jobId: values.jobId,
                type: values.type,
                startedAt: values.startedAt,
                endedAt: values.endedAt,
                notes: values.notes,
              })
            }
            bump("timeEntries")
            setDialog({ open: false })
          }}
          onDelete={
            dialog.mode === "edit"
              ? async () => {
                  await deleteTimeEntry(db, dialog.editing.id)
                  bump("timeEntries")
                  setDialog({ open: false })
                }
              : undefined
          }
        />
      ) : null}
    </View>
  )
}

interface EntryRowProps {
  entry: TimeEntryView
  defaults: { onsiteCents: number | null; drivingCents: number | null }
  currency: string
  onPress: () => void
}

function typeMeta(type: TimeEntryView["type"]): {
  label: string
  icon: string
} {
  if (type === "driving") return { label: "Driving", icon: "car" }
  if (type === "office")
    return { label: "Office", icon: "office-building-outline" }
  return { label: "Onsite", icon: "hammer-wrench" }
}

function EntryRow({ entry, defaults, currency, onPress }: EntryRowProps) {
  const earnings = computeEarnings(entry, defaults)
  const meta = typeMeta(entry.type)
  const primary = entry.jobName ?? entry.clientName ?? meta.label
  const secondary =
    entry.jobName && entry.clientName
      ? entry.clientName
      : entry.jobName
        ? null
        : entry.clientName
          ? meta.label
          : "Unassigned"
  return (
    <TouchableRipple onPress={onPress}>
      <View style={styles.entryRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{primary}</Text>
          {secondary ? (
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>
              {secondary}
            </Text>
          ) : null}
          {entry.notes ? (
            <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 2 }}>
              {entry.notes}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text variant="titleSmall">
            {formatDuration(earnings.durationMs)}
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.75 }}>
            {earnings.earningsCents != null
              ? formatCents(earnings.earningsCents, currency)
              : "No rate"}
          </Text>
          <Chip icon={meta.icon} compact style={{ marginTop: 2 }}>
            {meta.label}
          </Chip>
        </View>
      </View>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  entryRow: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
    gap: 12,
  },
})
