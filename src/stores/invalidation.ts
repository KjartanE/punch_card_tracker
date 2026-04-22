import { create } from 'zustand';

export type InvalidationKey = 'clients' | 'jobs' | 'timeEntries' | 'expenses' | 'settings';

interface InvalidationState {
  versions: Record<InvalidationKey, number>;
  bump: (key: InvalidationKey) => void;
}

export const useInvalidation = create<InvalidationState>((set) => ({
  versions: { clients: 0, jobs: 0, timeEntries: 0, expenses: 0, settings: 0 },
  bump: (key) =>
    set((s) => ({
      versions: { ...s.versions, [key]: s.versions[key] + 1 },
    })),
}));

export const bump = (key: InvalidationKey): void => useInvalidation.getState().bump(key);
