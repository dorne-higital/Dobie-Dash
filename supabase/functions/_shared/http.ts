// Shared bits for the Edge Functions: CORS (the app runs from capacitor://localhost and,
// in development, from localhost), JSON replies and the caller's user from their token.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Service-role client: these functions are the only way anything is written. */
export function admin(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

/** The signed-in caller (anonymous or Apple), or null. */
export async function caller(req: Request, db: SupabaseClient) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
  if (!token) return null
  const { data } = await db.auth.getUser(token)
  return data.user ?? null
}

const CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Makes sure the caller has a player row (first run or first visit to the League tab). */
export async function ensurePlayer(db: SupabaseClient, id: string) {
  const { data } = await db.from('players').select('*').eq('id', id).maybeSingle()
  if (data) return data
  for (let tries = 0; tries < 5; tries++) {
    let code = ''
    for (let i = 0; i < 6; i++) code += CODE[Math.floor(Math.random() * CODE.length)]
    const { data: made, error } = await db
      .from('players')
      .insert({ id, friend_code: code })
      .select('*')
      .single()
    if (!error) return made
  }
  throw new Error('could not make a player')
}
