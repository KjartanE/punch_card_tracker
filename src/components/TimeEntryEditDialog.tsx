import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import { formatDateTime, pickDateTime } from '@/utils/datetime';
import type { TimeEntryType } from '@/types';

export interface TimeEntryEditValues {
  type: TimeEntryType;
  startedAt: number;
  endedAt: number | null;
  notes: string | null;
}

interface Props {
  visible: boolean;
  initialValues: TimeEntryEditValues;
  onDismiss: () => void;
  onSave: (values: TimeEntryEditValues) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function TimeEntryEditDialog({
  visible,
  initialValues,
  onDismiss,
  onSave,
  onDelete,
}: Props) {
  const [type, setType] = useState<TimeEntryType>('onsite');
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(initialValues.type);
      setStartedAt(initialValues.startedAt);
      setEndedAt(initialValues.endedAt);
      setNotes(initialValues.notes ?? '');
      setBusy(false);
    }
  }, [visible, initialValues.type, initialValues.startedAt, initialValues.endedAt, initialValues.notes]);

  const pickStart = async () => {
    const picked = await pickDateTime(startedAt);
    if (picked !== null) setStartedAt(picked);
  };

  const pickEnd = async () => {
    const picked = await pickDateTime(endedAt ?? Date.now());
    if (picked !== null) setEndedAt(picked);
  };

  const canSave =
    !busy && (endedAt === null || endedAt >= startedAt);

  const handleSave = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await onSave({
        type,
        startedAt,
        endedAt,
        notes: notes.trim() || null,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Edit entry</Dialog.Title>
        <Dialog.Content>
          <View style={{ gap: 12 }}>
            <SegmentedButtons
              value={type}
              onValueChange={(v) => setType(v as TimeEntryType)}
              buttons={[
                { value: 'onsite', label: 'Onsite', icon: 'hammer-wrench' },
                { value: 'driving', label: 'Driving', icon: 'car' },
              ]}
            />
            <Button mode="outlined" icon="clock-start" onPress={pickStart}>
              {`Started · ${formatDateTime(startedAt)}`}
            </Button>
            <Button mode="outlined" icon="clock-end" onPress={pickEnd}>
              {endedAt === null ? 'Ended · (still open)' : `Ended · ${formatDateTime(endedAt)}`}
            </Button>
            {endedAt !== null && endedAt < startedAt ? (
              <Text style={{ color: 'red' }}>End must be after start.</Text>
            ) : null}
            <TextInput
              label="Notes"
              mode="outlined"
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDelete} textColor="red" disabled={busy}>
            Delete
          </Button>
          <View style={{ flex: 1 }} />
          <Button onPress={onDismiss} disabled={busy}>
            Cancel
          </Button>
          <Button onPress={handleSave} mode="contained" disabled={!canSave}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
