/**
 * The boards on Supabase (M6): anonymous sign-in on first use, the player's board profile
 * (name, dog, friend code), checked score submission with an offline queue, and reads for
 * the League tab. Writes only ever go through the Edge Functions (submit-run, profile).
 */
import { Capacitor } from '@capacitor/core'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import sb from '~/content/supabase.json'
import { configFingerprint } from '~/game/server'
import type { RunRecord } from '~/game/replay'

export interface BoardRow {
  rank: number
  player_id: string
  name: string
  dog: Record<string, unknown>
  score: number
  best_world?: number
  me: boolean
  friend_code?: string
  tier?: number
  size?: number
}

export interface BoardPlayer {
  id: string
  name: string
  friend_code: string
  best: number
  tier: number
  name_hidden: boolean
}

interface Pending {
  record: RunRecord
  score: number
  kind: 'normal' | 'daily'
  at: number
}

const PENDING_KEY = 'dobiedash:pending-runs'
let client: SupabaseClient | null = null
let ready: Promise<boolean> | null = null
const me = ref<BoardPlayer | null>(null)
/** Is the board player linked to an Apple ID ("Keep your place")? */
const linked = ref(false)

function db() {
  client ??= createClient(sb.url, sb.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dobiedash:auth' },
  })
  return client
}

function readPending(): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]') as Pending[]
  } catch {
    return []
  }
}
function writePending(p: Pending[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p.slice(-5)))
  } catch {
    /* storage full or blocked: the run just won't be retried */
  }
}

export function useBoards() {
  const player = usePlayerStore()

  /** Signs in (anonymously the first time) and keeps the board name and dog in step. */
  function signIn(): Promise<boolean> {
    ready ??= (async () => {
      try {
        const auth = db().auth
        const { data } = await auth.getSession()
        if (!data.session) {
          const { error } = await auth.signInAnonymously()
          if (error) throw error
        }
        const { data: u } = await auth.getUser()
        linked.value = !!u.user && !u.user.is_anonymous
        await syncProfile()
        await flush()
        return true
      } catch (e) {
        console.warn('[boards] sign-in failed', e)
        ready = null // try again next time
        return false
      }
    })()
    return ready
  }

  async function call<T>(fn: 'profile' | 'submit-run', body: Record<string, unknown>): Promise<T> {
    const { data, error } = await db().functions.invoke(fn, { body })
    if (error) {
      // The function's JSON reply (with its reason) is on the error's response.
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') return (await ctx.json()) as T
      throw error
    }
    return data as T
  }

  /** Board name = the dog's name; the look comes from the dog maker and the Wardrobe. */
  async function syncProfile() {
    const dog = player.dog
    const res = await call<{ ok: boolean; player: BoardPlayer; reason?: string }>('profile', {
      action: 'get',
    })
    if (res.ok) me.value = res.player
    if (!dog) return
    const look = { ...dog, hat: player.equipped.hat, collar: player.equipped.collar }
    const set = await call<{ ok: boolean; player?: BoardPlayer; reason?: string }>('profile', {
      action: 'set',
      name: dog.name,
      dog: look,
    })
    if (set.ok && set.player) me.value = set.player
    nameRejected.value = set.ok ? null : (set.reason ?? null)
  }
  const nameRejected = useState<string | null>('boards-name-rejected', () => null)

  /** Sends a finished run to be checked; kept and retried later if it can't be sent. */
  async function submit(record: RunRecord, score: number, kind: 'normal' | 'daily' = 'normal') {
    const p = readPending()
    p.push({ record, score, kind, at: Date.now() })
    writePending(p)
    await flush()
  }

  /** Sends any runs waiting from before (offline, or the app closed). */
  async function flush() {
    if (!(await db().auth.getSession()).data.session) return
    const left: Pending[] = []
    for (const r of readPending()) {
      try {
        const res = await call<{ ok: boolean; reason?: string }>('submit-run', {
          record: r.record,
          claimed: { score: r.score },
          fingerprint: configFingerprint(),
          kind: r.kind,
        })
        // Keep only runs that failed to send; refused ones (checked and wrong) are dropped.
        if (!res.ok && !res.reason) left.push(r)
        else if (!res.ok) console.warn('[boards] run refused:', res.reason)
      } catch {
        left.push(r)
      }
    }
    writePending(left)
  }

  async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T[]> {
    if (!(await signIn())) return []
    const { data, error } = await db().rpc(name, args)
    if (error) {
      console.warn(`[boards] ${name}`, error.message)
      return []
    }
    return (data ?? []) as T[]
  }

  const board = (kind: 'all' | 'week') => rpc<BoardRow>('board', { kind, lim: 50 })
  const myRank = async (kind: 'all' | 'week') =>
    (await rpc<{ rank: number; score: number; total: number }>('my_rank', { kind }))[0] ?? null
  const league = () => rpc<BoardRow>('my_league')
  const friends = () => rpc<BoardRow>('friends_board')
  const daily = () => rpc<BoardRow>('daily_board')

  /** Today's Daily Dash: its seed, and how many attempts the player has used. */
  async function dailyToday() {
    if (!(await signIn())) return null
    const day = new Date().toISOString().slice(0, 10)
    const { data: dash } = await db()
      .from('daily_dash')
      .select('day, seed')
      .eq('day', day)
      .maybeSingle()
    const rows = await daily()
    return dash ? { day, seed: dash.seed as number, rows } : null
  }

  async function addFriend(code: string) {
    await signIn()
    return call<{ ok: boolean; reason?: string; friend?: { name: string } }>('profile', {
      action: 'friend',
      code,
    })
  }
  async function report(id: string) {
    await signIn()
    return call<{ ok: boolean }>('profile', { action: 'report', id })
  }
  /** Golden Bones won on the server (Daily Dash top 10%), added to the wallet once. */
  async function claimRewards() {
    if (!(await signIn())) return 0
    const res = await call<{ ok: boolean; bones: number }>('profile', { action: 'claim' })
    if (res.ok && res.bones) player.wallet.bones += res.bones
    return res.ok ? res.bones : 0
  }

  /**
   * Friends to race in a run: flags at their bests (the top 5 friends), and in the Daily
   * Dash the best friend's run today as a ghost. Gives up quickly so a run never waits.
   */
  async function rivals(daily: boolean) {
    const work = (async () => {
      const fr = (await friends()).filter((r) => !r.me && r.score > 0)
      const flags = fr
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((r) => ({ name: r.name, score: r.score }))
      if (!daily) return { flags, ghost: null }
      const ids = new Set(fr.map((r) => r.player_id))
      const top = (await boards_daily()).find((r) => ids.has(r.player_id))
      if (!top) return { flags, ghost: null }
      const record = (await rpcOne<RunRecord>('daily_ghost', { friend: top.player_id })) ?? null
      return { flags, ghost: record ? { record, name: top.name } : null }
    })()
    const timeout = new Promise<{ flags: []; ghost: null }>((r) =>
      setTimeout(() => r({ flags: [], ghost: null }), 2500),
    )
    try {
      return await Promise.race([work, timeout])
    } catch {
      return { flags: [], ghost: null }
    }
  }
  const boards_daily = () => rpc<BoardRow>('daily_board')
  async function rpcOne<T>(name: string, args: Record<string, unknown>): Promise<T | null> {
    if (!(await signIn())) return null
    const { data, error } = await db().rpc(name, args)
    return error ? null : (data as T)
  }

  async function sha256(text: string) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * "Keep your place": links the board player to the player's Apple ID, so their scores,
   * league and friends follow them to a new iPhone. If that Apple ID already has a
   * place (from another phone), switch to it instead.
   */
  /** Why the last "Keep your place" failed (shown in small print, and sent to Crashlytics). */
  const keepError = ref('')

  async function keepPlace(): Promise<'linked' | 'restored' | 'cancelled' | 'failed'> {
    keepError.value = ''
    const fail = (step: string, e: unknown) => {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e && 'message' in e
            ? String(e.message)
            : String(e)
      keepError.value = `${step}: ${msg}`.slice(0, 160)
      console.warn('[boards] keep your place', keepError.value)
      useServices().crash.recordError(
        e instanceof Error ? e : new Error(keepError.value),
        'keep-place',
      )
      return 'failed' as const
    }
    if (!Capacitor.isNativePlatform()) return fail('setup', 'only on iPhone')
    if (!(await signIn())) return fail('boards', 'could not sign in to the leaderboards')
    const raw = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    let token: string
    try {
      const { AppleSignIn } = await import('~/services/native/apple')
      token = (await AppleSignIn.signIn({ nonce: await sha256(raw) })).identityToken
    } catch (e) {
      if (String((e as Error)?.message ?? e).includes('cancelled')) return 'cancelled'
      return fail('apple', e)
    }
    const auth = db().auth
    const { error } = await auth.linkIdentity({ provider: 'apple', token, nonce: raw })
    if (!error) {
      linked.value = true
      return 'linked'
    }
    // Already linked to another player (the one from their old phone): become that one.
    if (/already|exists|linked/i.test(error.message)) {
      const { error: e2 } = await auth.signInWithIdToken({ provider: 'apple', token, nonce: raw })
      if (e2) return fail('restore', e2)
      linked.value = true
      await syncProfile()
      return 'restored'
    }
    return fail('link', error)
  }

  return {
    me,
    linked,
    keepPlace,
    keepError,
    rivals,
    nameRejected,
    signIn,
    syncProfile,
    submit,
    flush,
    board,
    myRank,
    league,
    friends,
    daily,
    dailyToday,
    addFriend,
    report,
    claimRewards,
  }
}
