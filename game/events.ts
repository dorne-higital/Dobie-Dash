/** Tiny typed event emitter: the engine's only channel out to Vue. */
export class Emitter<E extends object> {
  private map = new Map<keyof E, Set<(d: never) => void>>()

  on<K extends keyof E>(type: K, fn: (data: E[K]) => void): () => void {
    let set = this.map.get(type)
    if (!set) this.map.set(type, (set = new Set()))
    set.add(fn as (d: never) => void)
    return () => set!.delete(fn as (d: never) => void)
  }

  emit<K extends keyof E>(type: K, data: E[K]) {
    this.map.get(type)?.forEach((fn) => (fn as (d: E[K]) => void)(data))
  }

  clear() {
    this.map.clear()
  }
}
