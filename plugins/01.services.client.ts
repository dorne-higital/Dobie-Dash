import { createWebServices } from '~/services'

/** Registers the service implementations. The iOS container will swap in native ones here. */
export default defineNuxtPlugin(() => {
  const services = createWebServices({ debug: import.meta.dev })
  return { provide: { services } }
})
