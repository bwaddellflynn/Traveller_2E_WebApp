export type BuilderDraftCache<T> = {
  version: number
  updatedAt: string
  payload: T
}

export const loadBuilderDraft = <T>(key: string, version: number): T | null => {
  if (!import.meta.client) return null

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '') as Partial<BuilderDraftCache<T>>
    if (parsed.version !== version || !parsed.payload) return null
    return parsed.payload
  } catch {
    return null
  }
}

export const saveBuilderDraft = <T>(key: string, version: number, payload: T) => {
  if (!import.meta.client) return

  try {
    window.localStorage.setItem(key, JSON.stringify({
      version,
      updatedAt: new Date().toISOString(),
      payload,
    } satisfies BuilderDraftCache<T>))
  } catch {
    // Draft persistence should never block the builder workflow.
  }
}

export const clearBuilderDraft = (key: string) => {
  if (!import.meta.client) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Draft persistence should never block the builder workflow.
  }
}
