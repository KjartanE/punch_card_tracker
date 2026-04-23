import { Stack, useLocalSearchParams } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import {
  Button,
  Divider,
  FAB,
  IconButton,
  List,
  Menu,
  Text,
} from "react-native-paper"

import { ClientFormDialog } from "@/components/ClientFormDialog"
import { JobFormDialog } from "@/components/JobFormDialog"
import { archiveClient, unarchiveClient, updateClient } from "@/domain/clients"
import { archiveJob, createJob, unarchiveJob, updateJob } from "@/domain/jobs"
import { useClient } from "@/hooks/useClients"
import { useJobs } from "@/hooks/useJobs"
import { useSettings } from "@/hooks/useSettings"
import { bump } from "@/stores/invalidation"
import type { Job } from "@/types"
import { formatRate } from "@/utils/money"

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id
  const db = useSQLiteContext()
  const client = useClient(id)
  const jobs = useJobs({ clientId: id, includeArchived: true })
  const settings = useSettings()

  const [menuOpen, setMenuOpen] = useState(false)
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [jobDialog, setJobDialog] = useState<{ open: boolean; editing?: Job }>({
    open: false,
  })

  if (client === undefined || jobs === null || settings === null) {
    return <Stack.Screen options={{ title: "" }} />
  }
  if (client === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Not found" }} />
        <View style={{ padding: 24 }}>
          <Text>Client not found.</Text>
        </View>
      </>
    )
  }

  const currency = settings.currency
  const activeJobs = jobs.filter((j) => !j.archivedAt)
  const archivedJobs = jobs.filter((j) => j.archivedAt)

  const renderJob = (job: Job) => (
    <List.Item
      key={job.id}
      title={job.name}
      description={[
        `Onsite ${formatRate(
          job.onsiteRateCents ?? settings.defaultOnsiteRateCents,
          currency,
        )}`,
        `Driving ${formatRate(
          job.drivingRateCents ?? settings.defaultDrivingRateCents,
          currency,
        )}`,
      ].join("  ·  ")}
      onPress={() => setJobDialog({ open: true, editing: job })}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
    />
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: client.name,
          headerRight: () => (
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuOpen(true)}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil-outline"
                title="Edit"
                onPress={() => {
                  setMenuOpen(false)
                  setEditClientOpen(true)
                }}
              />
              {client.archivedAt ? (
                <Menu.Item
                  leadingIcon="archive-arrow-up-outline"
                  title="Unarchive"
                  onPress={async () => {
                    setMenuOpen(false)
                    await unarchiveClient(db, client.id)
                    bump("clients")
                  }}
                />
              ) : (
                <Menu.Item
                  leadingIcon="archive-arrow-down-outline"
                  title="Archive"
                  onPress={async () => {
                    setMenuOpen(false)
                    await archiveClient(db, client.id)
                    bump("clients")
                  }}
                />
              )}
            </Menu>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {client.notes ? (
          <View style={{ padding: 16 }}>
            <Text variant="bodyMedium">{client.notes}</Text>
          </View>
        ) : null}
        {client.archivedAt ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text variant="labelMedium" style={{ opacity: 0.6 }}>
              This client is archived.
            </Text>
          </View>
        ) : null}
        <Divider />
        <List.Section title={`Jobs (${activeJobs.length})`}>
          {activeJobs.length === 0 ? (
            <Text style={{ paddingHorizontal: 16, opacity: 0.6 }}>
              No active jobs. Tap + to add one.
            </Text>
          ) : (
            activeJobs.map(renderJob)
          )}
        </List.Section>
        {archivedJobs.length > 0 ? (
          <>
            <Divider />
            <List.Section title="Archived jobs">
              {archivedJobs.map(renderJob)}
            </List.Section>
          </>
        ) : null}
      </ScrollView>
      <FAB
        icon="plus"
        label="Add job"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => setJobDialog({ open: true })}
      />

      <ClientFormDialog
        visible={editClientOpen}
        title="Edit client"
        initialValues={{ name: client.name, notes: client.notes }}
        onDismiss={() => setEditClientOpen(false)}
        onSubmit={async (input) => {
          await updateClient(db, client.id, input)
          bump("clients")
          setEditClientOpen(false)
        }}
      />

      <JobFormDialog
        visible={jobDialog.open}
        title={jobDialog.editing ? "Edit job" : "New job"}
        initialValues={
          jobDialog.editing
            ? {
                name: jobDialog.editing.name,
                onsiteRateCents: jobDialog.editing.onsiteRateCents,
                drivingRateCents: jobDialog.editing.drivingRateCents,
                notes: jobDialog.editing.notes,
              }
            : undefined
        }
        defaultOnsiteRateCents={settings.defaultOnsiteRateCents}
        defaultDrivingRateCents={settings.defaultDrivingRateCents}
        currency={currency}
        extraActions={
          jobDialog.editing ? (
            <Button
              onPress={async () => {
                const editing = jobDialog.editing!
                if (editing.archivedAt) {
                  await unarchiveJob(db, editing.id)
                } else {
                  await archiveJob(db, editing.id)
                }
                bump("jobs")
                setJobDialog({ open: false })
              }}
            >
              {jobDialog.editing.archivedAt ? "Unarchive" : "Archive"}
            </Button>
          ) : null
        }
        onDismiss={() => setJobDialog({ open: false })}
        onSubmit={async (input) => {
          if (jobDialog.editing) {
            await updateJob(db, jobDialog.editing.id, input)
          } else {
            await createJob(db, { clientId: client.id, ...input })
          }
          bump("jobs")
          setJobDialog({ open: false })
        }}
      />
    </>
  )
}
