/**
 * Web Audio sound effects and placeholder music, all synthesised (no files), so it works
 * the same in Safari and in the iOS app's WebView. Swap in a licensed pack later behind
 * the same AudioService.
 */
import type { AudioService, SoundCue } from '../types'

type Wave = OscillatorType

interface WorldTune {
  bpm: number
  /** Root note (MIDI) and the scale steps the arpeggio walks. */
  root: number
  scale: number[]
  /** Bass pattern: scale degrees per 8th note (null = rest), 16 steps. */
  bass: (number | null)[]
  /** Arp pattern: scale degrees per 16th, 16 steps. */
  arp: (number | null)[]
  lead: Wave
  swing: number
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]
const PENTA = [0, 2, 4, 7, 9]

/** One loop per world: bouncy park, funky city, breezy beach, moody night. */
const TUNES: WorldTune[] = [
  {
    bpm: 112,
    root: 48,
    scale: MAJOR,
    bass: [0, null, 0, null, 4, null, 4, null, 5, null, 5, null, 4, null, 3, null],
    arp: [0, 2, 4, 7, 4, 2, 0, 2, 4, 6, 8, 6, 4, 2, 4, 6],
    lead: 'square',
    swing: 0,
  },
  {
    bpm: 118,
    root: 45,
    scale: MINOR,
    bass: [0, 0, null, 0, 3, null, 4, null, 0, 0, null, 0, 6, null, 4, 3],
    arp: [7, null, 4, null, 7, 9, null, 7, 4, null, 2, null, 4, 7, null, 4],
    lead: 'sawtooth',
    swing: 0,
  },
  {
    bpm: 108,
    root: 50,
    scale: PENTA,
    bass: [0, null, null, 2, null, null, 3, null, 0, null, null, 2, null, 4, 3, null],
    arp: [5, 6, 7, null, 6, 5, null, 3, 5, 6, 7, null, 8, 7, 6, 5],
    lead: 'triangle',
    swing: 0.12,
  },
  {
    bpm: 124,
    root: 43,
    scale: MINOR,
    bass: [0, null, 0, 0, null, 0, 5, null, 3, null, 3, 3, null, 3, 4, null],
    arp: [7, 9, 10, 9, 7, null, 5, null, 7, 9, 11, 9, 7, null, 4, null],
    lead: 'square',
    swing: 0,
  },
]

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

export function createWebAudio(): AudioService {
  let ctx: AudioContext | null = null
  let master: GainNode
  let sfxBus: GainNode
  let musicBus: GainNode
  let noiseBuf: AudioBuffer
  let sfxOn = true
  let musicOn = true

  // Music state.
  let world: number | null = null
  let tempo = 1
  let step = 0
  let nextTime = 0
  let timer: ReturnType<typeof setInterval> | undefined

  function ensure(): AudioContext | null {
    if (ctx) return ctx
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(ctx.destination)
    sfxBus = ctx.createGain()
    sfxBus.gain.value = sfxOn ? 0.7 : 0
    sfxBus.connect(master)
    musicBus = ctx.createGain()
    musicBus.gain.value = 0
    musicBus.connect(master)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return ctx
  }

  /** A pitched blip with an optional slide and a quick attack/decay envelope. */
  function tone(
    out: AudioNode,
    t: number,
    f0: number,
    dur: number,
    o: { type?: Wave; f1?: number; vol?: number; attack?: number } = {},
  ) {
    const c = ctx!
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = o.type ?? 'square'
    osc.frequency.setValueAtTime(f0, t)
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur)
    const v = o.vol ?? 0.3
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack ?? 0.005))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  function noise(
    out: AudioNode,
    t: number,
    dur: number,
    o: { freq?: number; q?: number; vol?: number; type?: BiquadFilterType; f1?: number } = {},
  ) {
    const c = ctx!
    const src = c.createBufferSource()
    src.buffer = noiseBuf
    const f = c.createBiquadFilter()
    f.type = o.type ?? 'bandpass'
    f.frequency.setValueAtTime(o.freq ?? 1200, t)
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur)
    f.Q.value = o.q ?? 1
    const g = c.createGain()
    g.gain.setValueAtTime(o.vol ?? 0.3, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(out)
    src.start(t, Math.random() * 0.5)
    src.stop(t + dur + 0.02)
  }

  const SFX: Record<SoundCue, (t: number, o: AudioNode) => void> = {
    jump: (t, o) => tone(o, t, 300, 0.14, { f1: 620, vol: 0.18 }),
    double: (t, o) => {
      tone(o, t, 480, 0.12, { f1: 900, vol: 0.16 })
      tone(o, t + 0.05, 720, 0.1, { f1: 1200, vol: 0.1, type: 'triangle' })
    },
    land: (t, o) => noise(o, t, 0.08, { freq: 220, q: 0.7, vol: 0.25, type: 'lowpass' }),
    biscuit: (t, o) => {
      tone(o, t, 988, 0.07, { vol: 0.12, type: 'triangle' })
      tone(o, t + 0.05, 1319, 0.09, { vol: 0.12, type: 'triangle' })
    },
    golden: (t, o) => {
      ;[1047, 1319, 1568, 2093].forEach((f, i) =>
        tone(o, t + i * 0.05, f, 0.16, { vol: 0.12, type: 'triangle' }),
      )
    },
    powerOn: (t, o) => {
      tone(o, t, 220, 0.35, { f1: 880, vol: 0.16, type: 'sawtooth' })
      ;[523, 659, 784].forEach((f, i) => tone(o, t + 0.1 + i * 0.06, f, 0.14, { vol: 0.1 }))
    },
    powerOff: (t, o) => tone(o, t, 660, 0.3, { f1: 180, vol: 0.12, type: 'triangle' }),
    smash: (t, o) => {
      noise(o, t, 0.25, { freq: 900, q: 0.6, vol: 0.4, f1: 200 })
      tone(o, t, 140, 0.18, { f1: 60, vol: 0.3, type: 'sine' })
    },
    shieldPop: (t, o) => {
      tone(o, t, 1400, 0.12, { f1: 300, vol: 0.2, type: 'sine' })
      noise(o, t, 0.12, { freq: 3000, q: 2, vol: 0.2 })
    },
    crash: (t, o) => {
      // A cartoon "ruff!": two barks with a growly formant.
      for (const [dt, f] of [
        [0, 330],
        [0.16, 280],
      ] as const) {
        tone(o, t + dt, f, 0.13, { f1: f * 0.55, vol: 0.32, type: 'sawtooth', attack: 0.01 })
        noise(o, t + dt, 0.12, { freq: 900, q: 3, vol: 0.18 })
      }
      noise(o, t, 0.4, { freq: 120, q: 0.5, vol: 0.4, type: 'lowpass' })
    },
    bark: (t, o) => {
      // Big Bark: one huge, deep WOOF and a whoosh.
      tone(o, t, 240, 0.32, { f1: 110, vol: 0.45, type: 'sawtooth', attack: 0.01 })
      tone(o, t, 120, 0.4, { f1: 60, vol: 0.4, type: 'sine' })
      noise(o, t, 0.25, { freq: 800, q: 2.5, vol: 0.3 })
      noise(o, t + 0.05, 0.6, { freq: 400, f1: 3000, q: 1, vol: 0.2 })
    },
    nearMiss: (t, o) => noise(o, t, 0.3, { freq: 600, f1: 3500, q: 4, vol: 0.18 }),
    world: (t, o) => {
      ;[523, 659, 784, 1047].forEach((f, i) => tone(o, t + i * 0.09, f, 0.22, { vol: 0.14 }))
      tone(o, t + 0.36, 1319, 0.5, { vol: 0.12, type: 'triangle' })
    },
    bossGrowl: (t, o) => {
      tone(o, t, 90, 0.7, { f1: 55, vol: 0.4, type: 'sawtooth', attack: 0.05 })
      noise(o, t, 0.7, { freq: 300, q: 1.5, vol: 0.3, f1: 120 })
    },
    escape: (t, o) => {
      ;[784, 988, 1175, 1568].forEach((f, i) =>
        tone(o, t + i * 0.07, f, 0.18, { vol: 0.13, type: 'triangle' }),
      )
    },
    splash: (t, o) => noise(o, t, 0.45, { freq: 2500, f1: 400, q: 0.8, vol: 0.35 }),
    revive: (t, o) => {
      ;[392, 523, 659, 784, 1047].forEach((f, i) =>
        tone(o, t + i * 0.06, f, 0.2, { vol: 0.12, type: 'triangle' }),
      )
    },
    button: (t, o) => tone(o, t, 660, 0.05, { vol: 0.1, type: 'triangle' }),
  }

  // ---- music ---------------------------------------------------------------------------

  function scheduleStep(t: number, tune: WorldTune, s: number) {
    const m = musicBus
    const deg = (d: number) => {
      const n = tune.scale.length
      const oct = Math.floor(d / n)
      return tune.root + tune.scale[((d % n) + n) % n]! + oct * 12
    }
    const sixteenth = 60 / (tune.bpm * tempo) / 4
    const i = s % 16
    if (i % 2 === 0) {
      const b = tune.bass[i]
      if (b != null) tone(m, t, midi(deg(b)), sixteenth * 1.8, { vol: 0.22, type: 'triangle' })
    }
    const a = tune.arp[i]
    if (a != null) tone(m, t, midi(deg(a) + 24), sixteenth * 0.9, { vol: 0.05, type: tune.lead })
    // Drums: kick on beats, snare on 2 and 4, hats on 8ths.
    if (i % 4 === 0) tone(m, t, 120, 0.12, { f1: 45, vol: 0.35, type: 'sine' })
    if (i === 4 || i === 12) noise(m, t, 0.12, { freq: 1800, q: 0.7, vol: 0.14 })
    if (i % 2 === 0) noise(m, t, 0.03, { freq: 8000, q: 1, vol: 0.05, type: 'highpass' })
  }

  function tick() {
    const c = ctx
    if (!c || world === null) return
    const tune = TUNES[world % TUNES.length]!
    while (nextTime < c.currentTime + 0.12) {
      const swing = step % 2 ? tune.swing : 0
      scheduleStep(nextTime + swing * (60 / tune.bpm / 4), tune, step)
      nextTime += 60 / (tune.bpm * tempo) / 4
      step++
    }
  }

  function fadeMusic(to: number) {
    if (!ctx) return
    const t = ctx.currentTime
    musicBus.gain.cancelScheduledValues(t)
    musicBus.gain.setTargetAtTime(to, t, 0.15)
  }

  return {
    unlock() {
      const c = ensure()
      if (c && c.state !== 'running') c.resume().catch(() => {})
    },
    play(cue) {
      if (!sfxOn) return
      const c = ctx
      if (!c || c.state !== 'running') return
      SFX[cue](c.currentTime + 0.005, sfxBus)
    },
    music(w, t) {
      tempo = Math.max(0.5, Math.min(2, t))
      if (w === world) return
      const c = ensure()
      if (!c) return
      if (w === null) {
        fadeMusic(0)
        clearInterval(timer)
        timer = undefined
        world = null
        return
      }
      world = w
      step = 0
      nextTime = c.currentTime + 0.05
      if (musicOn) fadeMusic(0.5)
      if (!timer) timer = setInterval(tick, 25)
    },
    setSfx(on) {
      sfxOn = on
      if (ctx) sfxBus.gain.value = on ? 0.7 : 0
    },
    setMusic(on) {
      musicOn = on
      if (ctx) fadeMusic(on && world !== null ? 0.5 : 0)
    },
  }
}
