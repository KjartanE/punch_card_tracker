import { useEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper"

import { ActivityPicker, describeActivity } from "@/components/ActivityPicker"
import { DateTimeField } from "@/components/DateTimeField"
import { FieldRow } from "@/components/FieldRow"
import { KeyboardedDialog } from "@/components/KeyboardedDialog"
import { useClients } from "@/hooks/useClients"
import { useJobs } from "@/hooks/useJobs"
import type { TimeEntryType } from "@/types"

export interface TimeEntryEditValues {
  clientId: string | null
  jobId: string | null
  type: TimeEntryType
  startedAt: number
  endedAt: number | null
  notes: string | null
}

interface Props {
  visible: boolean
  mode: "create" | "edit"
  initialValues: TimeEntryEditValues
  onDismiss: () => void
  onSave: (values: TimeEntryEditValues) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export function TimeEntryEditDialog({
  visible,
  mode,
  initialValues,
  onDismiss,
  onSave,
  onDelete,
}: Props) {
  const [clientId, setClientId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [type, setType] = useState<TimeEntryType>("onsite")
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  const clients = useClients({ includeArchived: true })
  const jobs = useJobs({ includeArchived: true })

  useEffect(() => {
    if (visible) {
      setClientId(initialValues.clientId)
      setJobId(initialValues.jobId)
      setType(initialValues.type)
      setStartedAt(initialValues.startedAt)
      setEndedAt(initialValues.endedAt)
      setNotes(initialValues.notes ?? "")
      setBusy(false)
    }
  }, [
    visible,
    initialValues.clientId,
    initialValues.jobId,
    initialValues.type,
    initialValues.startedAt,
    initialValues.endedAt,
    initialValues.notes,
  ])

  const activityLabel = describeActivity(
    { clientId, jobId, type },
    {
      clientName: (id) => clients?.find((c) => c.id === id)?.name,
      jobName: (id) => jobs?.find((j) => j.id === id)?.name,
    },
  )

  const canSave =
    !busy &&
    (mode === "edit"
      ? endedAt === null || endedAt >= startedAt
      : endedAt !== null && endedAt >= startedAt)

  const handleSave = async () => {
    if (!canSave) return
    setBusy(true)
    try {
      await onSave({
        clientId,
        jobId,
        type,
        startedAt,
        endedAt,
        notes: notes.trim() || null,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || busy) return
    setBusy(true)
    try {
      await onDelete()
    } finally {
      setBusy(false)
    }
  }

  const title = mode === "create" ? "New entry" : "Edit entry"

  return (
    <Portal>
      <KeyboardedDialog visible={visible} onDismiss={onDismiss}>
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
            <FieldRow
              label="Activity"
              value={activityLabel}
              onPress={() => setActivityOpen(true)}
            />
            <DateTimeField
              label="Started"
              value={startedAt}
              onChange={(v) => {
                if (v !== null) setStartedAt(v)
              }}
            />
            <DateTimeField
              label="Ended"
              value={endedAt}
              placeholder={mode === "edit" ? "(still open)" : "Pick end time"}
              onChange={setEndedAt}
              allowClear={mode === "edit"}
              clearLabel="Mark as still open"
            />
            {endedAt !== null && endedAt < startedAt ? (
              <Text style={{ color: "red" }}>End must be after start.</Text>
            ) : null}
            <TextInput
              label="Notes"
              mode="outlined"
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          {onDelete ? (
            <Button onPress={handleDelete} textColor="red" disabled={busy}>
              Delete
            </Button>
          ) : null}
          <View style={{ flex: 1 }} />
          <Button onPress={onDismiss} disabled={busy}>
            Cancel
          </Button>
          <Button onPress={handleSave} mode="contained" disabled={!canSave}>
            Save
          </Button>
        </Dialog.Actions>
      </KeyboardedDialog>
      <ActivityPicker
        visible={activityOpen}
        initial={{ clientId, jobId, type }}
        onDismiss={() => setActivityOpen(false)}
        onSelect={(v) => {
          setClientId(v.clientId)
          setJobId(v.jobId)
          setType(v.type)
          setActivityOpen(false)
        }}
      />
    </Portal>
  )
}
