import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
} from 'react-native-paper';

import { listExpenses } from '@/domain/expenses';
import { listTimeEntries } from '@/domain/timeEntries';
import { buildExpensesCsv, buildTimeEntriesCsv } from '@/export/csv';
import { shareCsv } from '@/export/share';
import { useSettings } from '@/hooks/useSettings';
import { startOfMonth } from '@/utils/datetime';

type DataKind = 'timeEntries' | 'expenses';
type Range = 'thisMonth' | 'thisYear' | 'all';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

interface RangeBounds {
  from?: number;
  label: string;
}

function computeRange(range: Range): RangeBounds {
  const now = Date.now();
  if (range === 'all') return { label: 'all' };
  if (range === 'thisMonth') {
    const from = startOfMonth(now);
    const d = new Date(from);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return { from, label: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` };
  }
  const d = new Date(now);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return { from: d.getTime(), label: `${d.getFullYear()}` };
}

export function ExportDialog({ visible, onDismiss }: Props) {
  const db = useSQLiteContext();
  const settings = useSettings();
  const [kind, setKind] = useState<DataKind>('timeEntries');
  const [range, setRange] = useState<Range>('thisMonth');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!settings || busy) return;
    setBusy(true);
    setError(null);
    try {
      const bounds = computeRange(range);
      let csv: string;
      let filename: string;
      if (kind === 'timeEntries') {
        const entries = await listTimeEntries(db, {
          startedAtFrom: bounds.from,
          includeOpen: false,
          limit: 10000,
        });
        csv = buildTimeEntriesCsv(entries, settings);
        filename = `punch-time-entries-${bounds.label}.csv`;
      } else {
        const expenses = await listExpenses(db, {
          occurredAtFrom: bounds.from,
          limit: 10000,
        });
        csv = buildExpensesCsv(expenses, settings);
        filename = `punch-expenses-${bounds.label}.csv`;
      }
      const shared = await shareCsv(filename, csv);
      if (!shared) {
        setError('Sharing is not available on this device.');
      } else {
        onDismiss();
      }
    } catch (e) {
      setError((e as Error).message ?? 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={busy ? undefined : onDismiss}>
        <Dialog.Title>Export CSV</Dialog.Title>
        <Dialog.Content>
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text variant="labelMedium">Data</Text>
              <SegmentedButtons
                value={kind}
                onValueChange={(v) => setKind(v as DataKind)}
                buttons={[
                  { value: 'timeEntries', label: 'Time entries' },
                  { value: 'expenses', label: 'Expenses' },
                ]}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text variant="labelMedium">Range</Text>
              <SegmentedButtons
                value={range}
                onValueChange={(v) => setRange(v as Range)}
                buttons={[
                  { value: 'thisMonth', label: 'Month' },
                  { value: 'thisYear', label: 'Year' },
                  { value: 'all', label: 'All' },
                ]}
              />
            </View>
            {error ? (
              <Text style={{ color: 'red' }}>{error}</Text>
            ) : null}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={busy}>
            Cancel
          </Button>
          <Button
            onPress={handleExport}
            mode="contained"
            loading={busy}
            disabled={busy}
            icon="export"
          >
            Export
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
