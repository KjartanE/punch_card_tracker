import { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import type { TextInput as RNTextInput } from "react-native"
import { Button, Dialog, Portal, TextInput } from "react-native-paper"

import { KeyboardedDialog } from "@/components/KeyboardedDialog"

export interface JobFormValues {
  name: string
  location: string | null
  notes: string | null
}

interface Props {
  visible: boolean
  title?: string
  initialValues?: {
    name?: string
    location?: string | null
    notes?: string | null
  }
  homeLocationPlaceholder?: string | null
  extraActions?: React.ReactNode
  onDismiss: () => void
  onSubmit: (values: JobFormValues) => Promise<void> | void
}

export function JobFormDialog({
  visible,
  title = "New job",
  initialValues,
  homeLocationPlaceholder,
  extraActions,
  onDismiss,
  onSubmit,
}: Props) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const locationRef = useRef<RNTextInput>(null)
  const notesRef = useRef<RNTextInput>(null)

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? "")
      setLocation(initialValues?.location ?? "")
      setNotes(initialValues?.notes ?? "")
      setSubmitting(false)
    }
  }, [
    visible,
    initialValues?.name,
    initialValues?.location,
    initialValues?.notes,
  ])

  const canSubmit = name.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        location: location.trim() || null,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const locationPlaceholder = homeLocationPlaceholder
    ? `Default: ${homeLocationPlaceholder}`
    : "Optional"

  return (
    <Portal>
      <KeyboardedDialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <View style={{ gap: 12 }}>
            <TextInput
              label="Name"
              mode="outlined"
              value={name}
              onChangeText={setName}
              autoFocus
              placeholder="e.g. Main office rewire"
              returnKeyType="next"
              onSubmitEditing={() => locationRef.current?.focus()}
            />
            <TextInput
              ref={locationRef}
              label="Location"
              mode="outlined"
              value={location}
              onChangeText={setLocation}
              placeholder={locationPlaceholder}
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
            <TextInput
              ref={notesRef}
              label="Notes (optional)"
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              blurOnSubmit
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          {extraActions}
          <Button onPress={onDismiss} disabled={submitting}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} disabled={!canSubmit} mode="contained">
            Save
          </Button>
        </Dialog.Actions>
      </KeyboardedDialog>
    </Portal>
  )
}
