/**
 * Sign in with Apple (iPhone only), through the app's own AppleSignInPlugin.swift. Used by
 * "Keep your place" on the League tab to link the board player to the player's Apple ID.
 */
import { registerPlugin } from '@capacitor/core'

interface AppleSignInPlugin {
  /** `nonce` is the SHA-256 (hex) of a random string; Supabase is given the raw one. */
  signIn(o: { nonce: string }): Promise<{ identityToken: string; user: string }>
}

export const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignIn')
