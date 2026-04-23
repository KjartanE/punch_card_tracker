import { useSQLiteContext } from "expo-sqlite"
import { useEffect, useState } from "react"

import { getClient, listClients } from "@/domain/clients"
import { useInvalidation } from "@/stores/invalidation"
import type { Client } from "@/types"

export function useClients(
  opts: { includeArchived?: boolean } = {},
): Client[] | null {
  const db = useSQLiteContext()
  const version = useInvalidation((s) => s.versions.clients)
  const [clients, setClients] = useState<Client[] | null>(null)
  const includeArchived = opts.includeArchived ?? false

  useEffect(() => {
    let cancelled = false
    void listClients(db, { includeArchived }).then((list) => {
      if (!cancelled) setClients(list)
    })
    return () => {
      cancelled = true
    }
  }, [db, version, includeArchived])

  return clients
}

export function useClient(
  id: string | null | undefined,
): Client | null | undefined {
  const db = useSQLiteContext()
  const version = useInvalidation((s) => s.versions.clients)
  const [client, setClient] = useState<Client | null | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setClient(null)
      return
    }
    let cancelled = false
    void getClient(db, id).then((c) => {
      if (!cancelled) setClient(c)
    })
    return () => {
      cancelled = true
    }
  }, [db, version, id])

  return client
}
