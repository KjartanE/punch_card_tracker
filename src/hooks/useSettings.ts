import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getSettings } from '@/domain/settings';
import { useInvalidation } from '@/stores/invalidation';
import type { Settings } from '@/types';

export function useSettings(): Settings | null {
  const db = useSQLiteContext();
  const version = useInvalidation((s) => s.versions.settings);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSettings(db).then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [db, version]);

  return settings;
}
