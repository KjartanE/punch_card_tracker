import { useEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { Button, Chip, Dialog, Portal, TextInput } from "react-native-paper"

import { FieldRow } from "@/components/FieldRow"
import { PickerDialog } from "@/components/PickerDialog"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
} from "@/domain/expenses"
import { useJobs } from "@/hooks/useJobs"
import type { Client, ExpenseCategory } from "@/types"
import { formatDate, pickDate } from "@/utils/datetime"
import { formatCentsPlain, parseCents } from "@/utils/money"

export interface ExpenseFormValues {
  clientId: string | null
  jobId: string | null
  category: ExpenseCategory
  amountCents: number
  occurredAt: number
  description: string | null
}

interface Props {
  visible: boolean
  title?: string
  initialValues?: Partial<ExpenseFormValues>
  clients: Client[]
  currency: string
  onDismiss: () => void
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export function ExpenseFormDialog({
  visible,
  title,
  initialValues,
  clients,
  currency,
  onDismiss,
  onSubmit,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<ExpenseCategory>("other")
  const [amount, setAmount] = useState("")
  const [occurredAt, setOccurredAt] = useState<number>(Date.now())
  const [clientId, setClientId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [clientPicker, setClientPicker] = useState(false)
  const [jobPicker, setJobPicker] = useState(false)

  const jobs = useJobs({ clientId: clientId ?? undefined })

  useEffect(() => {
    if (visible) {
      setCategory(initialValues?.category ?? "other")
      setAmount(formatCentsPlain(initialValues?.amountCents ?? null))
      setOccurredAt(initialValues?.occurredAt ?? Date.now())
      setClientId(initialValues?.clientId ?? null)
      setJobId(initialValues?.jobId ?? null)
      setDescription(initialValues?.description ?? "")
      setBusy(false)
    }
  }, [
    visible,
    initialValues?.category,
    initialValues?.amountCents,
    initialValues?.occurredAt,
    initialValues?.clientId,
    initialValues?.jobId,
    initialValues?.description,
  ])

  const cents = parseCents(amount)
  const canSubmit = !busy && cents !== null && cents > 0

  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedJob = (jobs ?? []).find((j) => j.id === jobId)

  const handlePickDate = async () => {
    const picked = await pickDate(occurredAt)
    if (picked !== null) setOccurredAt(picked)
  }

  const handleSubmit = async () => {
    if (!canSubmit || cents === null) return
    setBusy(true)
    try {
      await onSubmit({
        category,
        amountCents: cents,
        occurredAt,
        clientId,
        jobId,
        description: description.trim() || null,
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

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          {title ?? (onDelete ? "Edit expense" : "New expense")}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 8,
              gap: 12,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    icon={EXPENSE_CATEGORY_ICONS[cat]}
                    selected={category === cat}
                    showSelectedCheck={false}
                    onPress={() => setCategory(cat)}
                  >
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </Chip>
                ))}
              </View>
            </ScrollView>
            <TextInput
              label="Amount"
              mode="outlined"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              right={<TextInput.Affix text={currency} />}
            />
            <Button mode="outlined" icon="calendar" onPress={handlePickDate}>
              {formatDate(occurredAt)}
            </Button>
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
            <TextInput
              label="Description (optional)"
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
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
          <Button onPress={handleSubmit} mode="contained" disabled={!canSubmit}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
      <PickerDialog
        visible={clientPicker}
        title="Select client"
        options={[
          { id: "__none__", title: "None (unassigned)" },
          ...clients.map((c) => ({ id: c.id, title: c.name })),
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
