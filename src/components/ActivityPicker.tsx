import { useEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import {
  Button,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
} from "react-native-paper"

import { FieldRow } from "@/components/FieldRow"
import { PickerDialog } from "@/components/PickerDialog"
import { useClients } from "@/hooks/useClients"
import { useJobs } from "@/hooks/useJobs"
import type { TimeEntryType } from "@/types"

export interface ActivityValue {
  clientId: string | null
  jobId: string | null
  type: TimeEntryType
}

interface Props {
  visible: boolean
  title?: string
  initial?: ActivityValue
  onDismiss: () => void
  onSelect: (value: ActivityValue, label: string) => void
}

/**
 * Compose a label for an activity from its parts. Used both by the picker and by
 * any chip/list that wants to display a default name.
 */
export function describeActivity(
  value: ActivityValue,
  lookup: {
    clientName?: (id: string) => string | undefined
    jobName?: (id: string) => string | undefined
  } = {},
): string {
  const typeLabel =
    value.type === "driving"
      ? "Driving"
      : value.type === "office"
        ? "Office"
        : "Onsite"
  if (value.jobId) {
    const jn = lookup.jobName?.(value.jobId) ?? "Job"
    const cn = value.clientId ? lookup.clientName?.(value.clientId) : undefined
    return cn ? `${cn} · ${jn}` : jn
  }
  if (value.clientId) {
    const cn = lookup.clientName?.(value.clientId) ?? "Client"
    return `${cn} · ${typeLabel}`
  }
  return typeLabel
}

export function ActivityPicker({
  visible,
  title = "Select activity",
  initial,
  onDismiss,
  onSelect,
}: Props) {
  const clients = useClients({ includeArchived: false })
  const [type, setType] = useState<TimeEntryType>("onsite")
  const [clientId, setClientId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [clientPicker, setClientPicker] = useState(false)
  const [jobPicker, setJobPicker] = useState(false)

  const jobs = useJobs({ clientId: clientId ?? undefined })

  useEffect(() => {
    if (visible) {
      setType(initial?.type ?? "onsite")
      setClientId(initial?.clientId ?? null)
      setJobId(initial?.jobId ?? null)
    }
  }, [visible, initial?.type, initial?.clientId, initial?.jobId])

  const selectedClient = (clients ?? []).find((c) => c.id === clientId)
  const selectedJob = (jobs ?? []).find((j) => j.id === jobId)

  const canSubmit = true // Every combination is valid; Office generic, Driving generic, etc.

  const handleSubmit = () => {
    const value: ActivityValue = { clientId, jobId, type }
    const label = describeActivity(value, {
      clientName: (id) => (clients ?? []).find((c) => c.id === id)?.name,
      jobName: (id) => (jobs ?? []).find((j) => j.id === id)?.name,
    })
    onSelect(value, label)
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 8,
              gap: 12,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text variant="labelMedium" style={{ marginBottom: 6 }}>
                Type
              </Text>
              <SegmentedButtons
                value={type}
                onValueChange={(v) => setType(v as TimeEntryType)}
                buttons={[
                  { value: "onsite", label: "Onsite", icon: "hammer-wrench" },
                  { value: "driving", label: "Driving", icon: "car" },
                  {
                    value: "office",
                    label: "Office",
                    icon: "office-building-outline",
                  },
                ]}
              />
            </View>
            <FieldRow
              label="Client (optional)"
              value={selectedClient?.name ?? ""}
              placeholder="None"
              onPress={() => setClientPicker(true)}
            />
            <FieldRow
              label="Job (optional)"
              value={selectedJob?.name ?? ""}
              placeholder={clientId ? "None" : "Pick a client first"}
              onPress={() => setJobPicker(true)}
              disabled={!clientId}
            />
            <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 8 }}>
              {describePreview(type, selectedClient?.name, selectedJob?.name)}
            </Text>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit} disabled={!canSubmit}>
            Select
          </Button>
        </Dialog.Actions>
      </Dialog>

      <PickerDialog
        visible={clientPicker}
        title="Select client"
        options={[
          { id: "__none__", title: "None (unassigned)" },
          ...(clients ?? []).map((c) => ({ id: c.id, title: c.name })),
        ]}
        selectedId={clientId ?? "__none__"}
        onSelect={(id) => {
          const next = id === "__none__" ? null : id
          setClientId(next)
          if (next !== clientId) setJobId(null)
          setClientPicker(false)
        }}
        onDismiss={() => setClientPicker(false)}
      />
      <PickerDialog
        visible={jobPicker}
        title="Select job"
        options={[
          { id: "__none__", title: "None" },
          ...(jobs ?? []).map((j) => ({ id: j.id, title: j.name })),
        ]}
        selectedId={jobId ?? "__none__"}
        emptyHint="This client has no active jobs."
        onSelect={(id) => {
          setJobId(id === "__none__" ? null : id)
          setJobPicker(false)
        }}
        onDismiss={() => setJobPicker(false)}
      />
    </Portal>
  )
}

function describePreview(
  type: TimeEntryType,
  clientName: string | undefined,
  jobName: string | undefined,
): string {
  const parts: string[] = []
  if (clientName) parts.push(clientName)
  if (jobName) parts.push(jobName)
  parts.push(
    type === "driving" ? "Driving" : type === "office" ? "Office" : "Onsite",
  )
  return `Preview: ${parts.join(" · ")}`
}
