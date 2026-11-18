import { defineStore } from 'pinia'

export interface SettingsSave {
  v: 1
  music: boolean
  sfx: boolean
  haptics: boolean
  reduceMotion: boolean
  /** Frame-time overlay during runs (also on with `?fps`). */
  showFps: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsSave => ({
    v: 1,
    music: true,
    sfx: true,
    haptics: true,
    reduceMotion: false,
    showFps: false,
  }),
})
