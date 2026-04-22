import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
  getOpenEntry,
  getTimeEntry,
  listTimeEntries,
  type ListTimeEntriesOpts,
  type TimeEntryView,
} from '@/domain/timeEntries';
import { useInvalidation } from '@/stores/invalidation';

export function useTimeEntries(opts: ListTimeEntriesOpts = {}): TimeEntryView[] | null {
  const db = useSQLiteContext();
  const versionEntries = useInvalidation((s) => s.versions.timeEntries);
  const versionJobs = useInvalidation((s) => s.versions.jobs);
  const versionClients = useInvalidation((s) => s.versions.clients);
  const [entries, setEntries] = useState<TimeEntryView[] | null>(null);

  const { jobId, clientId, startedAtFrom, startedAtTo, includeOpen, limit } = opts;

  useEffect(() => {
    let cancelled = false;
    void listTimeEntries(db, {
      jobId,
      clientId,
      startedAtFrom,
      startedAtTo,
      includeOpen,
      limit,
    }).then((list) => {
      if (!cancelled) setEntries(list);
    });
    return () => {
      cancelled = true;
    };
  }, [
    db,
    versionEntries,
    versionJobs,
    versionClients,
    jobId,
    clientId,
    startedAtFrom,
    startedAtTo,
    includeOpen,
    limit,
  ]);

  return entries;
}

export function useOpenEntry(): TimeEntryView | null | undefined {
  const db = useSQLiteContext();
  const versionEntries = useInvalidation((s) => s.versions.timeEntries);
  const versionJobs = useInvalidation((s) => s.versions.jobs);
  const [entry, setEntry] = useState<TimeEntryView | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void getOpenEntry(db).then((e) => {
      if (!cancelled) setEntry(e);
    });
    return () => {
      cancelled = true;
    };
  }, [db, versionEntries, versionJobs]);

  return entry;
}

export function useTimeEntry(id: string | null | undefined): TimeEntryView | null | undefined {
  const db = useSQLiteContext();
  const version = useInvalidation((s) => s.versions.timeEntries);
  const [entry, setEntry] = useState<TimeEntryView | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setEntry(null);
      return;
    }
    let cancelled = false;
    void getTimeEntry(db, id).then((e) => {
      if (!cancelled) setEntry(e);
    });
    return () => {
      cancelled = true;
    };
  }, [db, version, id]);

  return entry;
}

export function useElapsedMs(startedAt: number | null | undefined, tickMs: number = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt == null) return;
    const interval = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(interval);
  }, [startedAt, tickMs]);
  if (startedAt == null) return 0;
  return Math.max(0, now - startedAt);
}
