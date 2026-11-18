/** A clock that ticks every few seconds, for timers and day/week rollovers on hub screens. */
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
let users = 0

export function useNow(): Ref<Date> {
  onMounted(() => {
    if (users++ === 0) {
      now.value = new Date()
      timer = setInterval(() => (now.value = new Date()), 5000)
    }
  })
  onBeforeUnmount(() => {
    if (--users === 0) clearInterval(timer)
  })
  return now
}
