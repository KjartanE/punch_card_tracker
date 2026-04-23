import * as SecureStore from "expo-secure-store"
import { create } from "zustand"

import type { TimeEntryType } from "@/types"
import { newId } from "@/utils/ids"

export interface ActivityChip {
  id: string
  label: string
  clientId: string | null
  jobId: string | null
  type: TimeEntryType
}

interface State {
  chips: ActivityChip[]
  loaded: boolean
  add: (chip: Omit<ActivityChip, "id">) => string
  update: (id: string, patch: Partial<Omit<ActivityChip, "id">>) => void
  remove: (id: string) => void
  setAll: (chips: ActivityChip[]) => void
}

const KEY = "activity_chips_v1"

async function persist(chips: ActivityChip[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(chips))
  } catch {
    // best-effort
  }
}

export const useActivitiesStore = create<State>((set, get) => ({
  chips: [],
  loaded: false,
  add: (chip) => {
    const id = newId()
    const next = [...get().chips, { ...chip, id }]
    void persist(next)
    set({ chips: next })
    return id
  },
  update: (id, patch) => {
    const next = get().chips.map((c) => (c.id === id ? { ...c, ...patch } : c))
    void persist(next)
    set({ chips: next })
  },
  remove: (id) => {
    const next = get().chips.filter((c) => c.id !== id)
    void persist(next)
    set({ chips: next })
  },
  setAll: (chips) => {
    void persist(chips)
    set({ chips })
  },
}))

export async function hydrateActivities(): Promise<void> {
  if (useActivitiesStore.getState().loaded) return
  try {
    const raw = await SecureStore.getItemAsync(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityChip[]
      useActivitiesStore.setState({ chips: parsed, loaded: true })
      return
    }
  } catch {
    // best-effort
  }
  useActivitiesStore.setState({ loaded: true })
}

/**
 * Does this chip match the open time entry's client/job/type? Used to highlight
 * the active chip on the Now screen.
 */
export function chipMatchesEntry(
  chip: ActivityChip,
  entry: {
    clientId: string | null
    jobId: string | null
    type: TimeEntryType
  },
): boolean {
  return (
    chip.type === entry.type &&
    chip.clientId === entry.clientId &&
    chip.jobId === entry.jobId
  )
}
