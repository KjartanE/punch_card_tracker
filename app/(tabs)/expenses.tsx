import { useSQLiteContext } from "expo-sqlite"
import { useMemo, useState } from "react"
import { SectionList, StyleSheet, View } from "react-native"
import {
  Chip,
  Divider,
  FAB,
  Menu,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper"

import { ExpenseFormDialog } from "@/components/ExpenseFormDialog"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  createExpense,
  deleteExpense,
  updateExpense,
  type ExpenseView,
} from "@/domain/expenses"
import { useClients } from "@/hooks/useClients"
import { useExpenses } from "@/hooks/useExpenses"
import { useSettings } from "@/hooks/useSettings"
import { bump } from "@/stores/invalidation"
import type { ExpenseCategory } from "@/types"
import { formatDate, formatMonthHeader, startOfMonth } from "@/utils/datetime"
import { formatCents } from "@/utils/money"

interface MonthSection {
  title: string
  monthMs: number
  data: ExpenseView[]
  totalCents: number
}

export default function ExpensesScreen() {
  const db = useSQLiteContext()
  const theme = useTheme()
  const settings = useSettings()
  const clients = useClients({ includeArchived: true })

  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [clientMenu, setClientMenu] = useState(false)
  const [dialog, setDialog] = useState<{
    open: boolean
    editing?: ExpenseView
  }>({
    open: false,
  })

  const expenses = useExpenses({
    clientId: clientFilter ?? undefined,
    limit: 500,
  })

  const sections = useMemo<MonthSection[]>(() => {
    if (!expenses) return []
    const byMonth = new Map<number, MonthSection>()
    for (const expense of expenses) {
      const monthMs = startOfMonth(expense.occurredAt)
      let section = byMonth.get(monthMs)
      if (!section) {
        section = {
          title: formatMonthHeader(monthMs),
          monthMs,
          data: [],
          totalCents: 0,
        }
        byMonth.set(monthMs, section)
      }
      section.data.push(expense)
      section.totalCents += expense.amountCents
    }
    return Array.from(byMonth.values()).sort((a, b) => b.monthMs - a.monthMs)
  }, [expenses])

  const thisMonthSummary = useMemo(() => {
    if (!expenses) return null
    const from = startOfMonth(Date.now())
    const perCategory: Record<ExpenseCategory, number> = {
      bill: 0,
      gas: 0,
      tools: 0,
      repair: 0,
      other: 0,
    }
    let total = 0
    for (const e of expenses) {
      if (e.occurredAt < from) continue
      perCategory[e.category] += e.amountCents
      total += e.amountCents
    }
    return { total, perCategory }
  }, [expenses])

  if (!settings || clients === null || expenses === null) return null

  const currency = settings.currency
  const activeClient = clientFilter
    ? clients.find((c) => c.id === clientFilter)
    : null

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterBar}>
        <Menu
          visible={clientMenu}
          onDismiss={() => setClientMenu(false)}
          anchor={
            <Chip
              icon="filter-variant"
              onPress={() => setClientMenu(true)}
              mode={clientFilter ? "flat" : "outlined"}
              selected={!!clientFilter}
            >
              {activeClient?.name ?? "All clients"}
            </Chip>
          }
        >
          <Menu.Item
            title="All clients"
            onPress={() => {
              setClientFilter(null)
              setClientMenu(false)
            }}
          />
          <Divider />
          {clients.map((c) => (
            <Menu.Item
              key={c.id}
              title={c.name}
              onPress={() => {
                setClientFilter(c.id)
                setClientMenu(false)
              }}
            />
          ))}
        </Menu>
      </View>
      <Divider />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          thisMonthSummary ? (
            <Surface style={styles.summary} elevation={1} mode="flat">
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                THIS MONTH
              </Text>
              <Text variant="headlineMedium" style={{ marginTop: 2 }}>
                {formatCents(thisMonthSummary.total, currency)}
              </Text>
              <View style={styles.summaryChips}>
                {EXPENSE_CATEGORIES.filter(
                  (cat) => thisMonthSummary.perCategory[cat] > 0,
                ).map((cat) => (
                  <Chip key={cat} icon={EXPENSE_CATEGORY_ICONS[cat]} compact>
                    {`${EXPENSE_CATEGORY_LABELS[cat]} · ${formatCents(
                      thisMonthSummary.perCategory[cat],
                      currency,
                    )}`}
                  </Chip>
                ))}
                {Object.values(thisMonthSummary.perCategory).every(
                  (v) => v === 0,
                ) ? (
                  <Text style={{ opacity: 0.6 }}>
                    No expenses this month yet.
                  </Text>
                ) : null}
              </View>
            </Surface>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text variant="labelLarge" style={{ flex: 1 }}>
              {section.title}
            </Text>
            <Text variant="labelMedium" style={{ opacity: 0.75 }}>
              {formatCents(section.totalCents, currency)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            currency={currency}
            onPress={() => setDialog({ open: true, editing: item })}
          />
        )}
        ItemSeparatorComponent={Divider}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          expenses.length === 0 ? (
            <View style={{ padding: 32 }}>
              <Text style={{ textAlign: "center", opacity: 0.6 }}>
                No expenses yet. Tap + to add one.
              </Text>
            </View>
          ) : null
        }
      />
      <FAB
        icon="plus"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => setDialog({ open: true })}
      />
      <ExpenseFormDialog
        visible={dialog.open}
        initialValues={
          dialog.editing
            ? {
                clientId: dialog.editing.clientId,
                jobId: dialog.editing.jobId,
                category: dialog.editing.category,
                amountCents: dialog.editing.amountCents,
                occurredAt: dialog.editing.occurredAt,
                description: dialog.editing.description,
              }
            : undefined
        }
        clients={clients}
        currency={currency}
        onDismiss={() => setDialog({ open: false })}
        onSubmit={async (values) => {
          if (dialog.editing) {
            await updateExpense(db, dialog.editing.id, values)
          } else {
            await createExpense(db, values)
          }
          bump("expenses")
          setDialog({ open: false })
        }}
        onDelete={
          dialog.editing
            ? async () => {
                await deleteExpense(db, dialog.editing!.id)
                bump("expenses")
                setDialog({ open: false })
              }
            : undefined
        }
      />
    </View>
  )
}

interface ExpenseRowProps {
  expense: ExpenseView
  currency: string
  onPress: () => void
}

function ExpenseRow({ expense, currency, onPress }: ExpenseRowProps) {
  const label = EXPENSE_CATEGORY_LABELS[expense.category]
  const attribution = [expense.clientName, expense.jobName]
    .filter(Boolean)
    .join(" · ")
  return (
    <TouchableRipple onPress={onPress}>
      <View style={styles.expenseRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">
            {expense.description ? expense.description : label}
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
            {formatDate(expense.occurredAt)}
            {attribution ? `  ·  ${attribution}` : ""}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <Chip icon={EXPENSE_CATEGORY_ICONS[expense.category]} compact>
              {label}
            </Chip>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
          <Text variant="titleMedium">
            {formatCents(expense.amountCents, currency)}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  summary: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  expenseRow: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
    gap: 12,
  },
})
