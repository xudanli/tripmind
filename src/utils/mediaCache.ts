interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const DEFAULT_TTL = 1000 * 60 * 60 * 24 // 24 小时
const STORE_KEY = 'media_cache_v1'

type CacheRecord = Record<string, CacheEntry<any>>

let memoryStore: CacheRecord = {}

function loadFromStorage(): CacheRecord {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CacheRecord
    memoryStore = parsed
    return parsed
  } catch {
    return {}
  }
}

function persistToStorage(store: CacheRecord) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // ignore storage quota errors
  }
}

function ensureStore(): CacheRecord {
  if (Object.keys(memoryStore).length === 0) {
    memoryStore = loadFromStorage()
  }
  return memoryStore
}

export function getCachedMedia<T>(key: string): T | null {
  const store = ensureStore()
  const entry = store[key]
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    delete store[key]
    persistToStorage(store)
    return null
  }
  return entry.data as T
}

export function setCachedMedia<T>(key: string, data: T, ttl = DEFAULT_TTL) {
  const store = ensureStore()
  store[key] = {
    data,
    expiresAt: Date.now() + ttl
  }
  persistToStorage(store)
}

export function clearExpiredMedia() {
  const store = ensureStore()
  const now = Date.now()
  let changed = false
  Object.entries(store).forEach(([key, entry]) => {
    if (entry.expiresAt <= now) {
      delete store[key]
      changed = true
    }
  })
  if (changed) {
    persistToStorage(store)
  }
}

