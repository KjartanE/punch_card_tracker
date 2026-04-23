import { useSQLiteContext } from "expo-sqlite"
import { useEffect, useState } from "react"

import {
  getExpense,
  listExpenses,
  type ExpenseView,
  type ListExpensesOpts,
} from "@/domain/expenses"
import { useInvalidation } from "@/stores/invalidation"

export function useExpenses(opts: ListExpensesOpts = {}): ExpenseView[] | null {
  const db = useSQLiteContext()
  const versionExpenses = useInvalidation((s) => s.versions.expenses)
  const versionClients = useInvalidation((s) => s.versions.clients)
  const versionJobs = useInvalidation((s) => s.versions.jobs)
  const [expenses, setExpenses] = useState<ExpenseView[] | null>(null)

  const { clientId, jobId, category, occurredAtFrom, occurredAtTo, limit } =
    opts

  useEffect(() => {
    let cancelled = false
    void listExpenses(db, {
      clientId,
      jobId,
      category,
      occurredAtFrom,
      occurredAtTo,
      limit,
    }).then((list) => {
      if (!cancelled) setExpenses(list)
    })
    return () => {
      cancelled = true
    }
  }, [
    db,
    versionExpenses,
    versionClients,
    versionJobs,
    clientId,
    jobId,
    category,
    occurredAtFrom,
    occurredAtTo,
    limit,
  ])

  return expenses
}

export function useExpense(
  id: string | null | undefined,
): ExpenseView | null | undefined {
  const db = useSQLiteContext()
  const version = useInvalidation((s) => s.versions.expenses)
  const [expense, setExpense] = useState<ExpenseView | null | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!id) {
      setExpense(null)
      return
    }
    let cancelled = false
    void getExpense(db, id).then((e) => {
      if (!cancelled) setExpense(e)
    })
    return () => {
      cancelled = true
    }
  }, [db, version, id])

  return expense
}
