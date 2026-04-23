import { useEffect, useState } from "react"
import { View } from "react-native"
import { Button, Dialog, Portal, TextInput } from "react-native-paper"

import { formatCentsPlain, parseCents } from "@/utils/money"

export interface JobFormValues {
  name: string
  onsiteRateCents: number | null
  drivingRateCents: number | null
  notes: string | null
}

interface Props {
  visible: boolean
  title?: string
  initialValues?: {
    name?: string
    onsiteRateCents?: number | null
    drivingRateCents?: number | null
    notes?: string | null
  }
  defaultOnsiteRateCents: number | null
  defaultDrivingRateCents: number | null
  currency: string
  extraActions?: React.ReactNode
  onDismiss: () => void
  onSubmit: (values: JobFormValues) => Promise<void> | void
}

export function JobFormDialog({
  visible,
  title = "New job",
  initialValues,
  defaultOnsiteRateCents,
  defaultDrivingRateCents,
  currency,
  extraActions,
  onDismiss,
  onSubmit,
}: Props) {
  const [name, setName] = useState("")
  const [onsite, setOnsite] = useState("")
  const [driving, setDriving] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? "")
      setOnsite(formatCentsPlain(initialValues?.onsiteRateCents ?? null))
      setDriving(formatCentsPlain(initialValues?.drivingRateCents ?? null))
      setNotes(initialValues?.notes ?? "")
      setSubmitting(false)
    }
  }, [
    visible,
    initialValues?.name,
    initialValues?.onsiteRateCents,
    initialValues?.drivingRateCents,
    initialValues?.notes,
  ])

  const canSubmit = name.trim().length > 0 && !submitting

  const rateOrNull = (value: string): number | null => {
    const trimmed = value.trim()
    if (trimmed === "") return null
    return parseCents(trimmed)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    const onsiteCents = rateOrNull(onsite)
    const drivingCents = rateOrNull(driving)
    if (onsite.trim() !== "" && onsiteCents === null) return
    if (driving.trim() !== "" && drivingCents === null) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        onsiteRateCents: onsiteCents,
        drivingRateCents: drivingCents,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const onsitePlaceholder =
    formatCentsPlain(defaultOnsiteRateCents) || "default"
  const drivingPlaceholder =
    formatCentsPlain(defaultDrivingRateCents) || "default"

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
              placeholder="e.g. Main office rewire"
            />
            <TextInput
              label="Onsite rate"
              mode="outlined"
              keyboardType="decimal-pad"
              value={onsite}
              onChangeText={setOnsite}
              placeholder={onsitePlaceholder}
              right={<TextInput.Affix text={`${currency}/hr`} />}
            />
            <TextInput
              label="Driving rate"
              mode="outlined"
              keyboardType="decimal-pad"
              value={driving}
              onChangeText={setDriving}
              placeholder={drivingPlaceholder}
              right={<TextInput.Affix text={`${currency}/hr`} />}
            />
            <TextInput
              label="Notes (optional)"
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
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
      </Dialog>
    </Portal>
  )
}
