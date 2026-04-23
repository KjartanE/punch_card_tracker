import { useEffect, useState } from "react"
import { View } from "react-native"
import { Button, Dialog, Portal, TextInput } from "react-native-paper"

export interface ClientFormValues {
  name: string
  notes: string | null
}

interface Props {
  visible: boolean
  title?: string
  initialValues?: { name?: string; notes?: string | null }
  onDismiss: () => void
  onSubmit: (values: ClientFormValues) => Promise<void> | void
}

export function ClientFormDialog({
  visible,
  title = "New client",
  initialValues,
  onDismiss,
  onSubmit,
}: Props) {
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? "")
      setNotes(initialValues?.notes ?? "")
      setSubmitting(false)
    }
  }, [visible, initialValues?.name, initialValues?.notes])

  const canSubmit = name.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), notes: notes.trim() || null })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <View style={{ gap: 12 }}>
            <TextInput
              label="Name"
              mode="outlined"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TextInput
              label="Notes (optional)"
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={submitting}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} disabled={!canSubmit} mode="contained">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
