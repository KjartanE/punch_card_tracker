import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Menu, TextInput } from 'react-native-paper';

import { ExportDialog } from '@/components/ExportDialog';
import { updateSettings } from '@/domain/settings';
import { useSettings } from '@/hooks/useSettings';
import { bump } from '@/stores/invalidation';
import { SUPPORTED_CURRENCIES } from '@/utils/currencies';
import { formatCentsPlain, parseCents } from '@/utils/money';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const settings = useSettings();

  const [onsite, setOnsite] = useState('');
  const [driving, setDriving] = useState('');
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setOnsite(formatCentsPlain(settings.defaultOnsiteRateCents));
      setDriving(formatCentsPlain(settings.defaultDrivingRateCents));
    }
  }, [settings]);

  if (!settings) return null;

  const saveRate = async (
    field: 'defaultOnsiteRateCents' | 'defaultDrivingRateCents',
    value: string,
    currentCents: number | null,
  ) => {
    const trimmed = value.trim();
    const cents = trimmed === '' ? null : parseCents(trimmed);
    if (trimmed !== '' && cents === null) {
      const revert = formatCentsPlain(currentCents);
      if (field === 'defaultOnsiteRateCents') setOnsite(revert);
      else setDriving(revert);
      return;
    }
    if (cents === currentCents) return;
    await updateSettings(db, { [field]: cents });
    bump('settings');
  };

  const saveCurrency = async (code: string) => {
    setCurrencyMenuOpen(false);
    if (code === settings.currency) return;
    await updateSettings(db, { currency: code });
    bump('settings');
  };

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      <List.Section title="Default hourly rates">
        <View style={styles.field}>
          <TextInput
            label="Onsite rate"
            mode="outlined"
            keyboardType="decimal-pad"
            value={onsite}
            onChangeText={setOnsite}
            onBlur={() => saveRate('defaultOnsiteRateCents', onsite, settings.defaultOnsiteRateCents)}
            placeholder="0.00"
            right={<TextInput.Affix text={`${settings.currency}/hr`} />}
          />
        </View>
        <View style={styles.field}>
          <TextInput
            label="Driving rate"
            mode="outlined"
            keyboardType="decimal-pad"
            value={driving}
            onChangeText={setDriving}
            onBlur={() => saveRate('defaultDrivingRateCents', driving, settings.defaultDrivingRateCents)}
            placeholder="0.00"
            right={<TextInput.Affix text={`${settings.currency}/hr`} />}
          />
        </View>
      </List.Section>

      <Divider />

      <List.Section title="Currency">
        <Menu
          visible={currencyMenuOpen}
          onDismiss={() => setCurrencyMenuOpen(false)}
          anchor={
            <List.Item
              title={settings.currency}
              description="Tap to change"
              right={(props) => <List.Icon {...props} icon="chevron-down" />}
              onPress={() => setCurrencyMenuOpen(true)}
            />
          }
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <Menu.Item key={c} title={c} onPress={() => saveCurrency(c)} />
          ))}
        </Menu>
      </List.Section>

      <Divider />

      <List.Section title="Data">
        <List.Item
          title="Google Sheets"
          description="Coming in Phase 5"
          disabled
          left={(props) => <List.Icon {...props} icon="google" />}
        />
        <List.Item
          title="Export CSV"
          description="Share time entries or expenses via CSV"
          onPress={() => setExportOpen(true)}
          left={(props) => <List.Icon {...props} icon="file-export-outline" />}
        />
      </List.Section>
      <ExportDialog visible={exportOpen} onDismiss={() => setExportOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: { paddingHorizontal: 16, paddingVertical: 8 },
});
