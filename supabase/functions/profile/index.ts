// profile: everything about the caller's place on the boards that isn't a run.
//   get                    → their player (made on first call), with a friend code
//   set {name, dog}        → board name (word filter) and how their dog looks
//   friend {code}          → add a friend by code (both ways)
//   unfriend {id}
//   report {id}            → report a name; enough reports hide it until reviewed
//   claim                  → collect Golden Bones won on the server (Daily Dash)
import { nameProblem } from '../_shared/game.js'
import { admin, caller, cors, ensurePlayer, json } from '../_shared/http.ts'

const REPORTS_TO_HIDE = 3
const DOG_KEYS = ['breed', 'coat', 'ears', 'tail', 'eyes', 'hat', 'collar']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = admin()
  const user = await caller(req, db)
  if (!user) return json({ ok: false, reason: 'auth' }, 401)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, reason: 'bad' }, 400)
  }
  const me = await ensurePlayer(db, user.id)

  switch (body.action) {
    case 'get':
      return json({ ok: true, player: me })

    case 'set': {
      const patch: Record<string, unknown> = {}
      if (typeof body.name === 'string') {
        const problem = nameProblem(body.name)
        if (problem) return json({ ok: false, reason: problem }, 422)
        patch.name = body.name.trim()
        patch.name_hidden = false
      }
      if (body.dog && typeof body.dog === 'object') {
        // Only how the dog looks, nothing else.
        const d = body.dog as Record<string, unknown>
        patch.dog = Object.fromEntries(
          DOG_KEYS.filter((k) => ['string', 'number'].includes(typeof d[k])).map((k) => [
            k,
            typeof d[k] === 'string' ? String(d[k]).slice(0, 40) : d[k],
          ]),
        )
      }
      const { data, error } = await db
        .from('players')
        .update(patch)
        .eq('id', user.id)
        .select('*')
        .single()
      if (error) return json({ ok: false, reason: 'db' }, 500)
      return json({ ok: true, player: data })
    }

    case 'friend': {
      const code = String(body.code ?? '')
        .trim()
        .toUpperCase()
      const { data: them } = await db
        .from('players')
        .select('id, name')
        .eq('friend_code', code)
        .maybeSingle()
      if (!them) return json({ ok: false, reason: 'code' }, 404)
      if (them.id === user.id) return json({ ok: false, reason: 'self' }, 422)
      await db.from('friends').upsert([
        { player_id: user.id, friend_id: them.id },
        { player_id: them.id, friend_id: user.id },
      ])
      return json({ ok: true, friend: them })
    }

    case 'unfriend': {
      const id = String(body.id ?? '')
      await db
        .from('friends')
        .delete()
        .or(
          `and(player_id.eq.${user.id},friend_id.eq.${id}),and(player_id.eq.${id},friend_id.eq.${user.id})`,
        )
      return json({ ok: true })
    }

    case 'report': {
      const id = String(body.id ?? '')
      if (id === user.id) return json({ ok: false, reason: 'self' }, 422)
      const { data: them } = await db.from('players').select('id, name').eq('id', id).maybeSingle()
      if (!them) return json({ ok: false, reason: 'missing' }, 404)
      await db.from('reports').upsert({ reporter: user.id, player_id: id, name: them.name })
      const { count } = await db
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', id)
        .eq('name', them.name)
      if ((count ?? 0) >= REPORTS_TO_HIDE)
        await db.from('players').update({ name_hidden: true }).eq('id', id)
      return json({ ok: true })
    }

    case 'claim': {
      const { data: open } = await db
        .from('rewards')
        .select('id, bones, reason')
        .eq('player_id', user.id)
        .is('claimed_at', null)
      if (!open?.length) return json({ ok: true, bones: 0, rewards: [] })
      await db
        .from('rewards')
        .update({ claimed_at: new Date().toISOString() })
        .in(
          'id',
          open.map((r) => r.id),
        )
      return json({ ok: true, bones: open.reduce((n, r) => n + r.bones, 0), rewards: open })
    }
  }
  return json({ ok: false, reason: 'action' }, 400)
})
