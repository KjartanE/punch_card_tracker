import { useSQLiteContext } from "expo-sqlite"
import { useEffect, useState } from "react"

import { getJob, listJobs } from "@/domain/jobs"
import { useInvalidation } from "@/stores/invalidation"
import type { Job } from "@/types"

export function useJobs(
  opts: { clientId?: string; includeArchived?: boolean } = {},
): Job[] | null {
  const db = useSQLiteContext()
  const version = useInvalidation((s) => s.versions.jobs)
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const { clientId } = opts
  const includeArchived = opts.includeArchived ?? false

  useEffect(() => {
    let cancelled = false
    void listJobs(db, { clientId, includeArchived }).then((list) => {
      if (!cancelled) setJobs(list)
    })
    return () => {
      cancelled = true
    }
  }, [db, version, clientId, includeArchived])

  return jobs
}

export function useJob(id: string | null | undefined): Job | null | undefined {
  const db = useSQLiteContext()
  const version = useInvalidation((s) => s.versions.jobs)
  const [job, setJob] = useState<Job | null | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setJob(null)
      return
    }
    let cancelled = false
    void getJob(db, id).then((j) => {
      if (!cancelled) setJob(j)
    })
    return () => {
      cancelled = true
    }
  }, [db, version, id])

  return job
}
