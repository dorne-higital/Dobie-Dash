/**
 * The save on the phone (localStorage in the web view) plus a copy in iCloud key-value
 * storage through ICloudSavePlugin, so progress follows the player to a new iPhone.
 * Which copy wins is decided in logic/save.ts (pickSave).
 */
import { registerPlugin } from '@capacitor/core'
import { createWebSave } from '../web/save'
import type { SaveService } from '../types'

interface ICloudSavePlugin {
  get(o: { key: string }): Promise<{ value?: string }>
  set(o: { key: string; value: string }): Promise<void>
  addListener(event: 'changed', fn: (d: { initial: boolean }) => void): Promise<unknown>
}

const ICloud = registerPlugin<ICloudSavePlugin>('ICloudSave')

export function createNativeSave(): SaveService {
  const local = createWebSave()
  return {
    ...local,
    async save(key, value) {
      await local.save(key, value)
      ICloud.set({ key, value: JSON.stringify(value) }).catch(() => {})
    },
    async loadCloud<T>(key: string) {
      try {
        const { value } = await ICloud.get({ key })
        return value ? (JSON.parse(value) as T) : null
      } catch {
        return null
      }
    },
    onCloudChange(fn) {
      void ICloud.addListener('changed', () => fn())
    },
  }
}
