import { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import type { TextInput as RNTextInput } from "react-native"
import { Button, Dialog, Portal, TextInput } from "react-native-paper"

import { KeyboardedDialog } from "@/components/KeyboardedDialog"

export interface ClientFormValues {
  name: string
  notes: string | null
  phone: string | null
  email: string | null
  homeLocation: string | null
}

interface Props {
  visible: boolean
  title?: string
  initialValues?: {
    name?: string
    notes?: string | null
    phone?: string | null
    email?: string | null
    homeLocation?: string | null
  }
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
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [homeLocation, setHomeLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const phoneRef = useRef<RNTextInput>(null)
  const emailRef = useRef<RNTextInput>(null)
  const homeRef = useRef<RNTextInput>(null)
  const notesRef = useRef<RNTextInput>(null)

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? "")
      setPhone(initialValues?.phone ?? "")
      setEmail(initialValues?.email ?? "")
      setHomeLocation(initialValues?.homeLocation ?? "")
      setNotes(initialValues?.notes ?? "")
      setSubmitting(false)
    }
  }, [
    visible,
    initialValues?.name,
    initialValues?.phone,
    initialValues?.email,
    initialValues?.homeLocation,
    initialValues?.notes,
  ])

  const canSubmit = name.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        homeLocation: homeLocation.trim() || null,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <KeyboardedDialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: 8,
              gap: 12,
            }}
          >
            <TextInput
              label="Name"
              mode="outlined"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <TextInput
              ref={phoneRef}
              label="Phone"
              mode="outlined"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextInput
              ref={emailRef}
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => homeRef.current?.focus()}
            />
            <TextInput
              ref={homeRef}
              label="Home location"
              mode="outlined"
              value={homeLocation}
              onChangeText={setHomeLocation}
              placeholder="Address, cross streets, whatever helps"
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
              numberOfLines={3}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              blurOnSubmit
            />
          </View>
        </Dialog.ScrollArea>
        <Dialog.Actions>
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
