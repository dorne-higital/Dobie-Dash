/** Whether the phone has a connection right now (updates when it drops or comes back). */
export function useOnline() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const update = () => (online.value = navigator.onLine)
  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return online
}
