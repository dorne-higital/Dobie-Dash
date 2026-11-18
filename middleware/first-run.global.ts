/** A new player makes their dog before anything else. */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const player = usePlayerStore()
  if (!player.dog && to.path !== '/make') return navigateTo('/make', { replace: true })
})
