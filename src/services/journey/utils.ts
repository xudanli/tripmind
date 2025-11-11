export function ensureObject<T extends object>(value: unknown, factory: () => T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  return factory()
}

export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export async function processInBatches<T>(
  list: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<void>
) {
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize)
    await Promise.all(batch.map((item, j) => fn(item, i + j)))
  }
}

export const isEnglish = (language: string | undefined): boolean =>
  Boolean(language && language.toLowerCase().startsWith('en'))
