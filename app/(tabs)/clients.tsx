import { useNavigation } from "expo-router"
import { useSQLiteContext } from "expo-sqlite"
import { useLayoutEffect, useState } from "react"
import { Linking, ScrollView, StyleSheet, View } from "react-native"
import {
  Button,
  Divider,
  FAB,
  IconButton,
  List,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper"

import { ClientFormDialog } from "@/components/ClientFormDialog"
import { JobFormDialog } from "@/components/JobFormDialog"
import {
  archiveClient,
  createClient,
  unarchiveClient,
  updateClient,
} from "@/domain/clients"
import { archiveJob, createJob, unarchiveJob, updateJob } from "@/domain/jobs"
import { useClients } from "@/hooks/useClients"
import { useJobs } from "@/hooks/useJobs"
import { bump } from "@/stores/invalidation"
import type { Client, Job } from "@/types"

export default function ClientsScreen() {
  const db = useSQLiteContext()
  const navigation = useNavigation()
  const [includeArchived, setIncludeArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const clients = useClients({ includeArchived })

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TopMenu
          includeArchived={includeArchived}
          onToggleArchived={() => setIncludeArchived((v) => !v)}
          onNewClient={() => setNewClientOpen(true)}
        />
      ),
    })
  }, [navigation, includeArchived])

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        {clients === null ? null : clients.length === 0 ? (
          <View style={{ padding: 32 }}>
            <Text style={{ textAlign: "center", opacity: 0.6 }}>
              No clients yet. Tap + to add one.
            </Text>
          </View>
        ) : (
          clients.map((client) => (
            <View key={client.id}>
              <ClientRow
                client={client}
                expanded={expandedId === client.id}
                onToggle={() =>
                  setExpandedId((id) => (id === client.id ? null : client.id))
                }
              />
              <Divider />
            </View>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => setNewClientOpen(true)}
      />
      <ClientFormDialog
        visible={newClientOpen}
        onDismiss={() => setNewClientOpen(false)}
        onSubmit={async (input) => {
          await createClient(db, input)
          bump("clients")
          setNewClientOpen(false)
        }}
      />
    </>
  )
}

interface TopMenuProps {
  includeArchived: boolean
  onToggleArchived: () => void
  onNewClient: () => void
}

function TopMenu({
  includeArchived,
  onToggleArchived,
  onNewClient,
}: TopMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={<IconButton icon="dots-vertical" onPress={() => setOpen(true)} />}
    >
      <Menu.Item
        leadingIcon={includeArchived ? "eye-off-outline" : "eye-outline"}
        title={includeArchived ? "Hide archived" : "Show archived"}
        onPress={() => {
          onToggleArchived()
          setOpen(false)
        }}
      />
      <Divider />
      <Menu.Item
        leadingIcon="plus"
        title="New client"
        onPress={() => {
          setOpen(false)
          onNewClient()
        }}
      />
    </Menu>
  )
}

interface ClientRowProps {
  client: Client
  expanded: boolean
  onToggle: () => void
}

function ClientRow({ client, expanded, onToggle }: ClientRowProps) {
  const db = useSQLiteContext()
  const theme = useTheme()
  const [rowMenu, setRowMenu] = useState(false)
  const [showArchivedJobs, setShowArchivedJobs] = useState(false)
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [jobDialog, setJobDialog] = useState<{
    open: boolean
    editing?: Job
  }>({ open: false })

  const jobs = useJobs({
    clientId: client.id,
    includeArchived: showArchivedJobs,
  })

  const isArchived = client.archivedAt !== null

  return (
    <View style={{ opacity: isArchived ? 0.55 : 1 }}>
      <TouchableRipple onPress={onToggle}>
        <View style={styles.rowHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">
              {client.name}
              {isArchived ? "  ·  Archived" : ""}
            </Text>
            {!expanded && client.notes ? (
              <Text
                variant="bodySmall"
                style={{ opacity: 0.7 }}
                numberOfLines={1}
              >
                {client.notes}
              </Text>
            ) : null}
          </View>
          <List.Icon
            icon={expanded ? "chevron-up" : "chevron-down"}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </TouchableRipple>
      {expanded ? (
        <View
          style={[
            styles.expanded,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <View style={{ flex: 1 }}>
              {client.notes ? (
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  {client.notes}
                </Text>
              ) : null}
              {client.homeLocation ? (
                <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                  📍 {client.homeLocation}
                </Text>
              ) : null}
            </View>
            <Menu
              visible={rowMenu}
              onDismiss={() => setRowMenu(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setRowMenu(true)}
                  size={20}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil-outline"
                title="Edit client"
                onPress={() => {
                  setRowMenu(false)
                  setEditClientOpen(true)
                }}
              />
              {isArchived ? (
                <Menu.Item
                  leadingIcon="archive-arrow-up-outline"
                  title="Unarchive"
                  onPress={async () => {
                    setRowMenu(false)
                    await unarchiveClient(db, client.id)
                    bump("clients")
                  }}
                />
              ) : (
                <Menu.Item
                  leadingIcon="archive-arrow-down-outline"
                  title="Archive"
                  onPress={async () => {
                    setRowMenu(false)
                    await archiveClient(db, client.id)
                    bump("clients")
                  }}
                />
              )}
              <Divider />
              <Menu.Item
                leadingIcon={
                  showArchivedJobs ? "eye-off-outline" : "eye-outline"
                }
                title={
                  showArchivedJobs ? "Hide archived jobs" : "Show archived jobs"
                }
                onPress={() => {
                  setShowArchivedJobs((v) => !v)
                  setRowMenu(false)
                }}
              />
            </Menu>
          </View>

          <QuickActions client={client} />

          <View style={{ marginTop: 12 }}>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginBottom: 4,
              }}
            >
              JOBS
            </Text>
            {jobs === null ? null : jobs.length === 0 ? (
              <Text style={{ opacity: 0.6, paddingVertical: 8 }}>
                No jobs yet.
              </Text>
            ) : (
              jobs.map((job) => (
                <TouchableRipple
                  key={job.id}
                  onPress={() => setJobDialog({ open: true, editing: job })}
                >
                  <View style={styles.jobRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="bodyLarge"
                        style={job.archivedAt ? { opacity: 0.5 } : undefined}
                      >
                        {job.name}
                        {job.archivedAt ? "  ·  Archived" : ""}
                      </Text>
                      <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                        📍 {job.location ?? client.homeLocation ?? "—"}
                      </Text>
                    </View>
                    <List.Icon icon="chevron-right" />
                  </View>
                </TouchableRipple>
              ))
            )}
            <Button
              icon="plus"
              mode="text"
              onPress={() => setJobDialog({ open: true })}
              style={{ alignSelf: "flex-start", marginTop: 4 }}
            >
              Add job
            </Button>
          </View>
        </View>
      ) : null}

      <ClientFormDialog
        visible={editClientOpen}
        title="Edit client"
        initialValues={{
          name: client.name,
          notes: client.notes,
          phone: client.phone,
          email: client.email,
          homeLocation: client.homeLocation,
        }}
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
                location: jobDialog.editing.location,
                notes: jobDialog.editing.notes,
              }
            : undefined
        }
        homeLocationPlaceholder={client.homeLocation}
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
    </View>
  )
}

function QuickActions({ client }: { client: Client }) {
  const canCall = !!client.phone
  const canEmail = !!client.email
  const canText = !!client.phone

  if (!canCall && !canEmail && !canText) return null

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
        flexWrap: "wrap",
      }}
    >
      {canCall ? (
        <Button
          icon="phone"
          mode="outlined"
          compact
          onPress={() => void Linking.openURL(`tel:${client.phone}`)}
        >
          Call
        </Button>
      ) : null}
      {canText ? (
        <Button
          icon="message-text-outline"
          mode="outlined"
          compact
          onPress={() => void Linking.openURL(`sms:${client.phone}`)}
        >
          Text
        </Button>
      ) : null}
      {canEmail ? (
        <Button
          icon="email-outline"
          mode="outlined"
          compact
          onPress={() => void Linking.openURL(`mailto:${client.email}`)}
        >
          Email
        </Button>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  expanded: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
})
