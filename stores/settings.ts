import { defineStore } from 'pinia'
import { defaultSave, type SettingsSave } from '~/logic/save'

export type { SettingsSave }

/** Settings live in the save file's `settings` section (see plugins/02.persist.client.ts). */
export const useSettingsStore = defineStore('settings', {
  state: (): SettingsSave => defaultSave().settings,
})
