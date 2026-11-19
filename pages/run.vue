<script setup lang="ts">
/**
 * Mounts the canvas engine full screen. Vue only listens to engine events and shows the
 * pause sheet and results card on top.
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Engine, type FeedbackCue, type FeedbackPort } from '~/game/engine'
import type { HapticKind } from '~/services/types'
import { item, STICKERS } from '~/logic/items'
import { lookFor } from '~/logic/look'
import { shouldOfferStarter } from '~/logic/store'
import { MEDALS } from '~/logic/trophies'
import type { RunSummary } from '~/game/run'
import type { RunRecord } from '~/game/replay'
import { POWER_KINDS, type PowerKind } from '~/game/config'
import { runCause } from '~/logic/events'

definePageMeta({ layout: 'run' })

const route = useRoute()
const router = useRouter()
const { config, haptics, audio, analytics } = useServices()
const player = usePlayerStore()
const settings = useSettingsStore()

const canvas = ref<HTMLCanvasElement | null>(null)
const safeProbe = ref<HTMLDivElement | null>(null)
const phase = ref<'loading' | 'running' | 'paused' | 'continue' | 'results'>('loading')
const result = ref<RunSummary | null>(null)
const newBest = ref(false)
const earned = ref<string[]>([])
const showStarter = ref(false)
const tutorial = 'tutorial' in route.query
const coach = ref<{ title: string; text: string; step: number; oops: boolean } | null>(null)
let coachTimer: ReturnType<typeof setTimeout> | undefined
let coachStep: { title: string; text: string; step: number; oops: boolean } | null = null
const sticker = (id: string) =>
  STICKERS.find((s) => s.id === id.replace('sticker-gold:', 'sticker:'))?.name ?? id
const fightTip = ref<string | null>(null)
/** The finished run's record (for a share clip after a new best). */
const lastRecord = shallowRef<RunRecord | null>(null)
const pauseInfo = ref({
  score: 0,
  worldName: '',
  progress: null as number | null,
  nextWorld: null as string | null,
  summary: null as RunSummary | null,
})
const offer = ref({ price: 0, countdown: 5, caughtBy: null as string | null })
const runBiscuits = ref(0)
const continueSheet = ref<{ adFinished: () => void } | null>(null)

const bot = 'bot' in route.query
// Testing: `?world=3` starts in Sunny Beach. Such runs don't count towards best or stats.
const startWorld = Number(route.query.world) > 1 ? Number(route.query.world) - 1 : undefined
// Testing: `?power=frisbee` starts with that power on (also not recorded).
const startPower = (POWER_KINDS as readonly string[]).includes(String(route.query.power))
  ? (String(route.query.power) as PowerKind)
  : undefined
// Daily Dash: today's shared course (its seed from the server), on the Daily Dash board.
const daily = 'daily' in route.query
let dailySeed: number | null = null
const boards = useBoards()
const online = useOnline()
/** A normal run that counts (not a test world, test power or the bot). */
const counts = startWorld === undefined && !startPower && !bot
const showFps = import.meta.dev || 'fps' in route.query || settings.showFps

let engine: Engine | null = null
/** This run's number for the player (1 = their first ever run). */
const runNumber = () => player.stats.runs + 1
/** The tutorial step being coached, so leaving early can be counted as skipped. */
let tutorialStep: string | null = tutorial ? 'jump' : null

/** Haptic for each sound cue (none for the small stuff). */
const HAPTIC: Partial<Record<FeedbackCue, HapticKind>> = {
  jump: 'jump',
  double: 'jump',
  splash: 'jump',
  nearMiss: 'jump',
  biscuit: 'biscuit',
  golden: 'power',
  powerOn: 'power',
  smash: 'power',
  bossGrowl: 'power',
  shieldPop: 'crash',
  crash: 'crash',
  world: 'success',
  escape: 'success',
  revive: 'success',
}

const feedback: FeedbackPort = {
  play(cue) {
    audio.play(cue)
    const h = HAPTIC[cue]
    if (h) haptics.play(h)
  },
  music: (world, tempo) => audio.music(world, tempo),
}
let botTimer: ReturnType<typeof setTimeout> | undefined

function start() {
  runBiscuits.value = 0
  coach.value = null
  result.value = null
  newBest.value = false
  phase.value = 'running'
  engine?.start(daily && dailySeed !== null ? dailySeed : undefined)
  // Only the first run from ?tutorial is a tutorial; "Play again" is a normal run.
  engine?.setTutorial(false)
  analytics.track('run_start', { run: runNumber(), world: startWorld ?? 0 })
}

function pause() {
  if (!engine || phase.value !== 'running' || !engine.isRunning) return
  engine.pause()
  const st = engine.status()
  if (st) pauseInfo.value = st
  phase.value = 'paused'
}

function resume() {
  phase.value = 'running'
  engine?.resume()
}

const adRules = useAds()
const gameCenter = useGameCenter()
async function continueWithAd() {
  const rewarded = await adRules.rewarded('continue')
  if (phase.value !== 'continue') return
  if (rewarded) keepRunning('ad')
  else continueSheet.value?.adFinished()
}

function continueWithBiscuits() {
  if (!player.spendBiscuits(offer.value.price, runBiscuits.value)) return
  keepRunning('biscuits')
}

/** What "Keep running?" offered: both ways, or the ad only when biscuits fall short. */
function offerType() {
  return player.biscuits + runBiscuits.value >= offer.value.price ? 'ad_or_biscuits' : 'ad_only'
}

function keepRunning(paidWith: 'ad' | 'biscuits') {
  analytics.track('continue_offer', {
    type: offerType(),
    choice: paidWith,
    price: offer.value.price,
  })
  phase.value = 'running'
  engine?.revive()
}

function declineContinue() {
  if (phase.value !== 'continue') return
  analytics.track('continue_offer', {
    type: offerType(),
    choice: 'declined',
    price: offer.value.price,
  })
  engine?.decline() // ends the run: run:end shows the results card
}

function goHome() {
  // Quitting from the pause sheet ends the run without a results card: count it.
  const s = phase.value === 'paused' ? pauseInfo.value.summary : null
  if (s && counts)
    analytics.track('run_end', {
      score: s.score,
      world: s.world,
      cause: runCause(s, true),
      seconds: Math.round(s.seconds),
      continues: s.continues,
    })
  if (tutorialStep) analytics.track('tutorial_step', { step: tutorialStep, skipped: true })
  router.push('/')
}

/** Auto-pause whenever the app is hidden (home button, call, notification centre). */
function onHidden() {
  if (document.visibilityState === 'hidden') pause()
}

/**
 * In the iPhone app, also pause when iOS says the app stopped being active: Control
 * Centre, a full-screen call, Siri, locking the phone. These don't always reach the page.
 */
const appListeners: PluginListenerHandle[] = []
async function listenToApp() {
  if (!Capacitor.isNativePlatform()) return
  const { App } = await import('@capacitor/app')
  appListeners.push(
    await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) pause()
    }),
    await App.addListener('pause', pause),
  )
}

onMounted(async () => {
  // Canvas text needs the fonts loaded before the first frame.
  try {
    await Promise.all([
      document.fonts.load('32px "Lilita One"'),
      document.fonts.load('900 12px "Nunito"'),
    ])
  } catch {
    /* fall back to system fonts */
  }
  if (!canvas.value) return
  if (daily) dailySeed = (await boards.dailyToday())?.seed ?? null
  // Bot runs race rivals too (for testing); they are never submitted.
  const rivals = (counts || bot) && online.value ? await boards.rivals(daily) : null
  engine = new Engine(canvas.value, config.game(), {
    best: player.best,
    feedback,
    showFps,
    reduceMotion: settings.reduceMotion,
    holdToJump: settings.holdToJump,
    coachFight: !player.flags.fightCoached,
    powerLevels: { ...player.upgrades },
    autoplay: bot,
    invincible: bot,
    startWorld,
    startPower,
    tutorial,
    look: lookFor(player.dog, player),
    safeTop: safeProbe.value?.offsetHeight ?? 0,
    hudInsetLeft: 52,
  })
  engine.on('run:end', async (r) => {
    earned.value = []
    newBest.value = false
    fightTip.value = r.fightTip ? config.game().fight.coach.tip : null
    if (startWorld === undefined && !startPower) {
      const got = player.recordRun(r)
      // Off to the boards to be checked (queued if offline).
      const rec = engine?.record() ?? null
      lastRecord.value = rec
      if (rec && counts && r.score > 0)
        void boards.submit(rec, r.score, daily && dailySeed !== null ? 'daily' : 'normal')
      newBest.value = got.newBest
      earned.value = [
        ...got.unlocked.map((id) =>
          id.startsWith('sticker-gold:')
            ? `Gold ${sticker(id)} sticker`
            : id.startsWith('sticker:')
              ? `${sticker(id)} sticker`
              : `${item(id)?.name} unlocked`,
        ),
        ...(got.bones ? [`+${got.bones} Golden Bones for the knock-out`] : []),
        ...(got.passTiers.length
          ? [`Pup Pass tier ${got.passTiers[got.passTiers.length - 1]! + 1} reached`]
          : []),
        ...got.medals.map((m) => `${MEDALS[m.medal]} medal: ${m.trophy.name}`),
      ]
      void gameCenter.afterRun(r.score)
      if (!bot) await adRules.betweenRuns({ newBest: got.newBest })
      if (!bot && shouldOfferStarter(player)) {
        player.flags.starterSeen = true
        showStarter.value = true
      }
    }
    result.value = r
    phase.value = 'results'
    if (counts)
      analytics.track('run_end', {
        score: r.score,
        world: r.world,
        cause: runCause(r),
        seconds: Math.round(r.seconds),
        continues: r.continues,
      })
    if (bot) botTimer = setTimeout(start, 1500)
  })
  engine.on('biscuit', (b) => (runBiscuits.value = b.count))
  // Boss fights: coach the first one, and count how fights go.
  engine.on('fight', (f) => {
    if (f.coach) {
      const C = config.game().fight.coach
      const words =
        f.step === 'hit'
          ? {
              title: `Hit ${f.hits}/${f.need}!`,
              text: f.need - f.hits === 1 ? 'One more!' : C.hit.text,
            }
          : f.step === 'start' || f.step === 'leave'
            ? null
            : C[f.step]
      clearTimeout(coachTimer)
      coach.value = words ? { ...words, step: 0, oops: false } : null
      if (words)
        coachTimer = setTimeout(() => (coach.value = null), f.step === 'stomp' ? 4000 : 2600)
    }
    if (f.step === 'win' || f.step === 'leave') {
      if (f.coach) player.flags.fightCoached = true
      if (counts)
        analytics.track('boss_fight', {
          boss: f.boss,
          result: f.step === 'win' ? 'beaten' : 'escaped',
          hits: f.hits,
        })
    }
  })
  engine.on('tutorial', (t) => {
    const C = config.game().tutorial.coach
    clearTimeout(coachTimer)
    if (!t.oops) {
      analytics.track('tutorial_step', { step: t.step, skipped: false })
      tutorialStep = t.step === 'done' ? null : t.step
    }
    if (t.step === 'done') {
      player.flags.tutorialDone = true
      coach.value = { ...C.done, step: 0, oops: false }
      coachTimer = setTimeout(() => (coach.value = null), 3500)
      return
    }
    const n = ['jump', 'double', 'biscuits'].indexOf(t.step) + 1
    coachStep = { ...C[t.step], step: n, oops: false }
    if (t.oops) {
      coach.value = { ...C.oops, step: n, oops: true }
      coachTimer = setTimeout(() => (coach.value = coachStep), 1500)
    } else coach.value = coachStep
  })
  engine.on('continue', (c) => {
    if (bot) return engine?.decline()
    offer.value = {
      price: c.price,
      countdown: c.countdown,
      caughtBy: engine?.status()?.caughtBy ?? null,
    }
    phase.value = 'continue'
  })
  engine.on('world', (w) => {
    if (counts) analytics.track('world_reached', { world: w.index, run: runNumber() })
  })
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('pagehide', pause)
  window.addEventListener('blur', pause)
  void listenToApp()
  if (rivals) engine.setRivals(rivals)
  start()
})

onBeforeUnmount(() => {
  clearTimeout(botTimer)
  clearTimeout(coachTimer)
  document.removeEventListener('visibilitychange', onHidden)
  window.removeEventListener('pagehide', pause)
  window.removeEventListener('blur', pause)
  for (const l of appListeners.splice(0)) void l.remove()
  engine?.destroy()
  engine = null
})
</script>

<template>
  <div class="run">
    <div ref="safeProbe" class="safe-probe" aria-hidden="true" />
    <canvas ref="canvas" class="game" aria-label="Dobie Dash. Tap anywhere to jump." />
    <RunCoach v-if="coach && phase === 'running'" v-bind="coach" />
    <RunPauseButton v-if="phase === 'running'" @pause="pause" />
    <RunPauseSheet
      v-if="phase === 'paused'"
      v-bind="pauseInfo"
      @resume="resume"
      @restart="start"
      @quit="goHome"
    />
    <RunContinueSheet
      v-if="phase === 'continue'"
      ref="continueSheet"
      v-bind="offer"
      :available="player.biscuits + runBiscuits"
      @ad="continueWithAd"
      @spend="continueWithBiscuits"
      @decline="declineContinue"
    />
    <RunResultsCard
      v-if="phase === 'results' && result"
      :result="result"
      :best="player.best"
      :new-best="newBest"
      :earned="earned"
      :tip="fightTip"
      :record="lastRecord"
      :dog-name="player.dog?.name"
      :can-double="counts"
      @again="start"
      @home="goHome"
    />
    <RunStarterOffer v-if="showStarter && phase === 'results'" @close="showStarter = false" />
  </div>
</template>

<style scoped>
.run {
  position: absolute;
  inset: 0;
}
.game {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.safe-probe {
  position: absolute;
  top: 0;
  height: 0;
  padding-top: env(safe-area-inset-top, 0px);
  visibility: hidden;
}
</style>
