import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Divider, FAB, List, Switch, Text } from 'react-native-paper';

import { ClientFormDialog } from '@/components/ClientFormDialog';
import { createClient } from '@/domain/clients';
import { useClients } from '@/hooks/useClients';
import { bump } from '@/stores/invalidation';

export default function ClientsListScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const clients = useClients({ includeArchived });

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          Show archived
        </Text>
        <Switch value={includeArchived} onValueChange={setIncludeArchived} />
      </View>
      <Divider />
      <FlatList
        data={clients ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={
              item.archivedAt
                ? 'Archived'
                : item.notes ?? undefined
            }
            onPress={() => router.push({ pathname: '/clients/[id]', params: { id: item.id } })}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        )}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          clients !== null ? (
            <View style={{ padding: 32 }}>
              <Text style={{ textAlign: 'center', opacity: 0.6 }}>
                No clients yet. Tap + to add one.
              </Text>
            </View>
          ) : null
        }
      />
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => setDialogOpen(true)}
      />
      <ClientFormDialog
        visible={dialogOpen}
        onDismiss={() => setDialogOpen(false)}
        onSubmit={async (input) => {
          await createClient(db, input);
          bump('clients');
          setDialogOpen(false);
        }}
      />
    </View>
  );
}
