import { AppCatalog as AppCatalogAPI } from 'metanet-apps'
import type { PublishedApp } from 'metanet-apps/src/types'

// Cache settings aligned with App Catalog page
export const CACHE_KEY = 'app_catalog_cache_v1'
export const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

let memoryCache: { ts: number; apps: PublishedApp[] } | null = null
let inflight: Promise<PublishedApp[]> | null = null

const readLocal = (): { ts: number; apps: PublishedApp[] } | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.apps)) return null
    return { ts: parsed.ts || 0, apps: parsed.apps as PublishedApp[] }
  } catch {
    return null
  }
}

const writeLocal = (apps: PublishedApp[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), apps }))
  } catch {
    // ignore quota errors
  }
}

const isStale = (ts: number) => Date.now() - ts > CACHE_TTL_MS

export const invalidateAppCatalogCache = () => {
  memoryCache = null
  inflight = null
}

export async function getAppCatalogApps(options?: { revalidate?: boolean }): Promise<PublishedApp[]> {
  const revalidate = options?.revalidate === true

  // 1) In-memory cache for current app session
  if (memoryCache && !revalidate) {
    return memoryCache.apps
  }

  // 2) If a network request is in-flight, await it
  if (inflight) {
    return inflight
  }

  // 3) Try localStorage (stale-while-revalidate behavior)
  const local = readLocal()
  if (local && !revalidate && !isStale(local.ts)) {
    memoryCache = local
    return local.apps
  }

  // 4) Fetch from network (once), cache in-memory and localStorage
  inflight = (async () => {
    const catalog = new AppCatalogAPI({})
    const apps = await catalog.findApps()
    memoryCache = { ts: Date.now(), apps }
    writeLocal(apps)
    inflight = null
    return apps
  })()

  return inflight
}

export type { PublishedApp }
