import type { SaveService } from '../types'

const PREFIX = 'dobiedash:'

/** localStorage save. iCloud key-value sync comes with the iOS container. */
export function createWebSave(): SaveService {
  return {
    async load<T>(key: string) {
      try {
        const raw = localStorage.getItem(PREFIX + key)
        return raw ? (JSON.parse(raw) as T) : null
      } catch {
        return null
      }
    },
    async save<T>(key: string, value: T) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
      } catch {
        /* private mode / quota: ignore */
      }
    },
    async remove(key: string) {
      try {
        localStorage.removeItem(PREFIX + key)
      } catch {
        /* ignore */
      }
    },
  }
}
