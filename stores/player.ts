import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    best: 0,
    bestWorld: 0,
    biscuits: 0,
  }),
})
