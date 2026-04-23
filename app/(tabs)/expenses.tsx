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
import {
  formatDate,
  formatDayHeader,
  formatMonthHeader,
  startOfDay,
  startOfMonth,
} from "@/utils/datetime"
import { formatCents } from "@/utils/money"

interface DaySection {
  title: string
  dayMs: number
  monthMs: number
  monthLabel: string
  showMonthBanner: boolean
  monthTotalCents: number
  data: ExpenseView[]
  totalCents: number
}

export default function ExpensesScreen() {
  const db = useSQLiteContext()
  const theme = useTheme()
  const settings = useSettings()
  const clients = useClients({ includeArchived: true })

  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(
    null,
  )
  const [clientMenu, setClientMenu] = useState(false)
  const [categoryMenu, setCategoryMenu] = useState(false)
  const [dialog, setDialog] = useState<{
    open: boolean
    editing?: ExpenseView
  }>({
    open: false,
  })

  const expenses = useExpenses({
    clientId: clientFilter ?? undefined,
    category: categoryFilter ?? undefined,
    limit: 500,
  })

  const sections = useMemo<DaySection[]>(() => {
    if (!expenses) return []
    // Group by day, track month totals, flag the first day of each month.
    const byDay = new Map<number, DaySection>()
    const monthTotals = new Map<number, number>()
    for (const expense of expenses) {
      const dayMs = startOfDay(expense.occurredAt)
      const monthMs = startOfMonth(expense.occurredAt)
      let section = byDay.get(dayMs)
      if (!section) {
        section = {
          title: formatDayHeader(dayMs),
          dayMs,
          monthMs,
          monthLabel: formatMonthHeader(monthMs),
          showMonthBanner: false,
          monthTotalCents: 0,
          data: [],
          totalCents: 0,
        }
        byDay.set(dayMs, section)
      }
      section.data.push(expense)
      section.totalCents += expense.amountCents
      monthTotals.set(
        monthMs,
        (monthTotals.get(monthMs) ?? 0) + expense.amountCents,
      )
    }
    const sorted = Array.from(byDay.values()).sort((a, b) => b.dayMs - a.dayMs)
    // Mark the first day-section of each month so the header renders a month banner.
    let lastMonth: number | null = null
    for (const s of sorted) {
      s.monthTotalCents = monthTotals.get(s.monthMs) ?? 0
      if (s.monthMs !== lastMonth) {
        s.showMonthBanner = true
        lastMonth = s.monthMs
      }
    }
    return sorted
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
  const selectedId = dialog.editing?.id ?? null

  const clearAll = () => {
    setClientFilter(null)
    setCategoryFilter(null)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterBar}>
        <Menu
          visible={clientMenu}
          onDismiss={() => setClientMenu(false)}
          anchor={
            <Chip
              icon="account-outline"
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
        <Menu
          visible={categoryMenu}
          onDismiss={() => setCategoryMenu(false)}
          anchor={
            <Chip
              icon={
                categoryFilter
                  ? EXPENSE_CATEGORY_ICONS[categoryFilter]
                  : "tag-multiple-outline"
              }
              onPress={() => setCategoryMenu(true)}
              mode={categoryFilter ? "flat" : "outlined"}
              selected={!!categoryFilter}
            >
              {categoryFilter
                ? EXPENSE_CATEGORY_LABELS[categoryFilter]
                : "All categories"}
            </Chip>
          }
        >
          <Menu.Item
            title="All categories"
            onPress={() => {
              setCategoryFilter(null)
              setCategoryMenu(false)
            }}
          />
          <Divider />
          {EXPENSE_CATEGORIES.map((cat) => (
            <Menu.Item
              key={cat}
              leadingIcon={EXPENSE_CATEGORY_ICONS[cat]}
              trailingIcon={categoryFilter === cat ? "check" : undefined}
              title={EXPENSE_CATEGORY_LABELS[cat]}
              onPress={() => {
                setCategoryFilter(cat)
                setCategoryMenu(false)
              }}
            />
          ))}
        </Menu>
        {clientFilter || categoryFilter ? (
          <Chip icon="close" onPress={clearAll} mode="outlined">
            Clear
          </Chip>
        ) : null}
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
          <View>
            {section.showMonthBanner ? (
              <View
                style={[
                  styles.monthBanner,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={{ flex: 1, color: theme.colors.onPrimaryContainer }}
                >
                  {section.monthLabel}
                </Text>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  {formatCents(section.monthTotalCents, currency)}
                </Text>
              </View>
            ) : null}
            <View
              style={[
                styles.dayHeader,
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
          </View>
        )}
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            currency={currency}
            selected={item.id === selectedId}
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
  selected: boolean
  onPress: () => void
}

function ExpenseRow({ expense, currency, selected, onPress }: ExpenseRowProps) {
  const theme = useTheme()
  const label = EXPENSE_CATEGORY_LABELS[expense.category]
  const attribution = [expense.clientName, expense.jobName]
    .filter(Boolean)
    .join(" · ")
  return (
    <TouchableRipple onPress={onPress}>
      <View
        style={[
          styles.expenseRow,
          selected && {
            backgroundColor: theme.colors.secondaryContainer,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            variant="titleSmall"
            style={selected ? { fontWeight: "700" } : undefined}
          >
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
    flexWrap: "wrap",
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
  monthBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dayHeader: {
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
