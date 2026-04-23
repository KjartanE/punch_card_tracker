import { useRouter } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { useMemo, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import {
  Button,
  Chip,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper"

import { FieldRow } from "@/components/FieldRow"
import { PickerDialog } from "@/components/PickerDialog"
import { computeEarnings, endEntry, startEntry } from "@/domain/timeEntries"
import { useClients } from "@/hooks/useClients"
import { useJobs } from "@/hooks/useJobs"
import { useSettings } from "@/hooks/useSettings"
import { useElapsedMs, useOpenEntry } from "@/hooks/useTimeEntries"
import { bump } from "@/stores/invalidation"
import type { TimeEntryType } from "@/types"
import { formatDuration } from "@/utils/duration"
import { formatCents } from "@/utils/money"

export default function NowScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const theme = useTheme()
  const settings = useSettings()
  const openEntry = useOpenEntry()
  const clients = useClients()

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [type, setType] = useState<TimeEntryType>("onsite")
  const [clientDialog, setClientDialog] = useState(false)
  const [jobDialog, setJobDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const jobs = useJobs({ clientId: selectedClientId ?? undefined })

  const selectedClient = useMemo(
    () => (clients ?? []).find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  )
  const selectedJob = useMemo(
    () => (jobs ?? []).find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  )

  if (openEntry === undefined || clients === null || settings === null) {
    return null
  }

  if (openEntry) {
    return <ActiveEntry onStop={() => void stopEntry()} />
  }

  async function stopEntry() {
    if (!openEntry) return
    setSubmitting(true)
    try {
      await endEntry(db, openEntry.id)
      bump("timeEntries")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePunchIn() {
    if (!selectedJobId) return
    setSubmitting(true)
    try {
      await startEntry(db, { jobId: selectedJobId, type })
      bump("timeEntries")
    } finally {
      setSubmitting(false)
    }
  }

  if (clients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
          Add a client first
        </Text>
        <Text
          variant="bodyMedium"
          style={{ textAlign: "center", opacity: 0.7, marginBottom: 24 }}
        >
          You need at least one client and job before you can punch in.
        </Text>
        <Button mode="contained" onPress={() => router.navigate("/clients")}>
          Go to Clients
        </Button>
      </View>
    )
  }

  const canPunchIn = !!selectedJobId && !submitting

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
        Not punched in
      </Text>
      <Text variant="bodyMedium" style={{ opacity: 0.7, marginBottom: 24 }}>
        Pick a client and job, then punch in.
      </Text>

      <View style={{ gap: 12 }}>
        <FieldRow
          label="Client"
          value={selectedClient?.name ?? ""}
          placeholder="Select client"
          onPress={() => setClientDialog(true)}
        />
        <FieldRow
          label="Job"
          value={selectedJob?.name ?? ""}
          placeholder={selectedClient ? "Select job" : "Pick a client first"}
          onPress={() => setJobDialog(true)}
          disabled={!selectedClient}
        />
        <View>
          <Text
            variant="labelMedium"
            style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}
          >
            Type
          </Text>
          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TimeEntryType)}
            buttons={[
              { value: "onsite", label: "Onsite", icon: "hammer-wrench" },
              { value: "driving", label: "Driving", icon: "car" },
            ]}
          />
        </View>
      </View>

      <View style={{ marginTop: 32 }}>
        <Button
          mode="contained"
          onPress={handlePunchIn}
          disabled={!canPunchIn}
          contentStyle={{ paddingVertical: 12 }}
          icon="play"
        >
          Punch in
        </Button>
      </View>

      <PickerDialog
        visible={clientDialog}
        title="Select client"
        options={(clients ?? []).map((c) => ({ id: c.id, title: c.name }))}
        selectedId={selectedClientId}
        onSelect={(id) => {
          setSelectedClientId(id)
          setSelectedJobId(null)
          setClientDialog(false)
        }}
        onDismiss={() => setClientDialog(false)}
      />
      <PickerDialog
        visible={jobDialog}
        title="Select job"
        options={(jobs ?? []).map((j) => ({ id: j.id, title: j.name }))}
        selectedId={selectedJobId}
        emptyHint="This client has no active jobs. Add one in the Clients tab."
        onSelect={(id) => {
          setSelectedJobId(id)
          setJobDialog(false)
        }}
        onDismiss={() => setJobDialog(false)}
      />
    </ScrollView>
  )
}

function ActiveEntry({ onStop }: { onStop: () => void }) {
  const openEntry = useOpenEntry()
  const settings = useSettings()
  const elapsed = useElapsedMs(openEntry?.startedAt ?? null)
  const theme = useTheme()

  if (!openEntry || !settings) return null

  const earnings = computeEarnings(openEntry, {
    onsiteCents: settings.defaultOnsiteRateCents,
    drivingCents: settings.defaultDrivingRateCents,
  })
  const effectiveEarnings =
    earnings.effectiveRateCents != null
      ? Math.round((elapsed / 3_600_000) * earnings.effectiveRateCents)
      : null

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.primary, marginBottom: 8 }}
      >
        PUNCHED IN
      </Text>
      <Text variant="displayMedium" style={{ fontVariant: ["tabular-nums"] }}>
        {formatDuration(elapsed, true)}
      </Text>

      <View style={{ marginTop: 24, alignItems: "center", gap: 4 }}>
        <Text variant="titleLarge">{openEntry.jobName}</Text>
        <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
          {openEntry.clientName}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Chip
            icon={openEntry.type === "driving" ? "car" : "hammer-wrench"}
            compact
          >
            {openEntry.type === "driving" ? "Driving" : "Onsite"}
          </Chip>
          {effectiveEarnings != null ? (
            <Chip icon="cash" compact>
              {formatCents(effectiveEarnings, settings.currency)}
            </Chip>
          ) : null}
        </View>
      </View>

      <View style={{ marginTop: 40, width: "100%" }}>
        <Button
          mode="contained"
          onPress={onStop}
          contentStyle={{ paddingVertical: 12 }}
          icon="stop"
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
        >
          Punch out
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
})
