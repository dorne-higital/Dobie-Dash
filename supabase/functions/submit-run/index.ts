// submit-run: the only way a score reaches the boards. The app sends the run's record
// (seed, view width, options and every input); this replays it with the game's own code
// and records the replayed score. Anything that doesn't replay to the claimed score is
// refused, so a forged score can't get on the boards.
import { boardRules, configFingerprint, loadGameConfig, replay } from '../_shared/game.js'
import { admin, caller, cors, ensurePlayer, json } from '../_shared/http.ts'

/** Seed, view width, options and every input of a run (see game/replay.ts). */
interface RunRecord {
  seed: number
  viewW: number
  opts: {
    holdToJump?: boolean
    coachFight?: boolean
    powerLevels?: Record<string, number>
    bigBarks?: number
    event?: string
  }
  inputs: [number, string][]
  ticks: number
}

const cfg = loadGameConfig()
const FINGERPRINT = configFingerprint(cfg)
/** Daily Dash: the free attempt plus the ones from ads; Weekend Cup attempts. */
const DAILY_ATTEMPTS = boardRules.dailyAttempts.free + boardRules.dailyAttempts.ads
const CUP_ATTEMPTS = boardRules.cup.attempts
const MAX_TICKS = 60 * 60 * 40 // 40 minutes of play

interface Body {
  record: RunRecord
  claimed: { score: number }
  fingerprint: string
  kind?: 'normal' | 'daily' | 'cup'
}

function valid(r: RunRecord | undefined): r is RunRecord {
  return (
    !!r &&
    Number.isInteger(r.seed) &&
    typeof r.viewW === 'number' &&
    r.viewW >= 300 &&
    r.viewW <= 1000 &&
    Number.isInteger(r.ticks) &&
    r.ticks > 0 &&
    r.ticks <= MAX_TICKS &&
    Array.isArray(r.inputs) &&
    r.inputs.length < 40000 &&
    r.inputs.every(
      (i) =>
        Array.isArray(i) && Number.isInteger(i[0]) && ['p', 'h', 'u', 'r', 'd', 'b'].includes(i[1]),
    )
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = admin()
  const user = await caller(req, db)
  if (!user) return json({ ok: false, reason: 'auth' }, 401)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, reason: 'bad' }, 400)
  }
  if (!valid(body.record)) return json({ ok: false, reason: 'bad' }, 400)
  // Played with different gameplay numbers (an older or newer app): can't check it here.
  if (body.fingerprint !== FINGERPRINT) return json({ ok: false, reason: 'version' }, 409)

  const kind = body.kind === 'daily' || body.kind === 'cup' ? body.kind : 'normal'
  const today = new Date().toISOString().slice(0, 10)
  if (kind === 'daily') {
    const { data: dash } = await db.from('daily_dash').select('seed').eq('day', today).maybeSingle()
    if (!dash || dash.seed !== body.record.seed) return json({ ok: false, reason: 'daily' }, 409)
  }
  let cupFriday: string | null = null
  if (kind === 'cup') {
    const { data: f } = await db.rpc('current_cup')
    const { data: cup } = f
      ? await db.from('cups').select('friday, seed, closed').eq('friday', f).maybeSingle()
      : { data: null }
    if (!cup || cup.closed || cup.seed !== body.record.seed)
      return json({ ok: false, reason: 'cup' }, 409)
    cupFriday = cup.friday
  }

  // Only the options that change the simulation, nothing else from the client.
  const rec: RunRecord = {
    seed: body.record.seed,
    viewW: body.record.viewW,
    ticks: body.record.ticks,
    inputs: body.record.inputs,
    opts: {
      holdToJump: !!body.record.opts?.holdToJump,
      coachFight: !!body.record.opts?.coachFight,
      powerLevels: body.record.opts?.powerLevels ?? {},
      // Big Barks: never more than the per-run limit, whatever the app claims.
      bigBarks: Math.max(0, Math.min(cfg.bigBark.perRun, Number(body.record.opts?.bigBarks) || 0)),
      // A known event only (presents score like biscuits, so it can't change the score).
      event: cfg.events.some((e: { id: string }) => e.id === body.record.opts?.event)
        ? body.record.opts?.event
        : undefined,
    },
  }
  const run = replay(cfg, rec, rec.ticks + 600)
  if (run.state !== 'ended') return json({ ok: false, reason: 'unfinished' }, 422)
  const s = run.summary()
  if (s.score !== Math.round(body.claimed?.score)) {
    console.log('mismatch', user.id, s.score, body.claimed?.score)
    return json({ ok: false, reason: 'mismatch', score: s.score }, 422)
  }

  await ensurePlayer(db, user.id)
  if (kind === 'normal') {
    const { error } = await db.rpc('record_run', {
      pid: user.id,
      s: s.score,
      w: s.world,
      secs: s.seconds,
      rec,
    })
    if (error) return json({ ok: false, reason: 'db', detail: error.message }, 500)
  } else if (kind === 'cup') {
    const { data: entry } = await db
      .from('cup_entries')
      .select('*')
      .eq('friday', cupFriday)
      .eq('player_id', user.id)
      .maybeSingle()
    if (entry && entry.attempts >= CUP_ATTEMPTS) return json({ ok: false, reason: 'attempts' }, 429)
    const better = !entry || s.score > entry.score
    const { error } = await db.from('cup_entries').upsert({
      friday: cupFriday,
      player_id: user.id,
      attempts: (entry?.attempts ?? 0) + 1,
      score: better ? s.score : entry!.score,
      record: better ? rec : entry!.record,
    })
    if (error) return json({ ok: false, reason: 'db', detail: error.message }, 500)
  } else {
    const { data: entry } = await db
      .from('daily_entries')
      .select('*')
      .eq('day', today)
      .eq('player_id', user.id)
      .maybeSingle()
    if (entry && entry.attempts >= DAILY_ATTEMPTS)
      return json({ ok: false, reason: 'attempts' }, 429)
    const better = !entry || s.score > entry.score
    const { error } = await db.from('daily_entries').upsert({
      day: today,
      player_id: user.id,
      attempts: (entry?.attempts ?? 0) + 1,
      score: better ? s.score : entry!.score,
      record: better ? rec : entry!.record,
    })
    if (error) return json({ ok: false, reason: 'db', detail: error.message }, 500)
  }

  const { data: me } = await db.from('players').select('best').eq('id', user.id).single()
  return json({ ok: true, score: s.score, best: me?.best ?? s.score })
})
