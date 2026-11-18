<script setup lang="ts">
/**
 * Mounts the canvas engine full screen. Vue only listens to engine events and shows the
 * pause sheet and results card on top.
 */
import { Engine } from '~/game/engine'
import type { RunSummary } from '~/game/run'

definePageMeta({ layout: 'run' })

const route = useRoute()
const router = useRouter()
const { config, haptics, analytics } = useServices()
const player = usePlayerStore()
const settings = useSettingsStore()

const canvas = ref<HTMLCanvasElement | null>(null)
const safeProbe = ref<HTMLDivElement | null>(null)
const phase = ref<'loading' | 'running' | 'paused' | 'results'>('loading')
const result = ref<RunSummary | null>(null)
const newBest = ref(false)
const pauseInfo = ref({ score: 0, worldName: '', progress: null as number | null })

const bot = 'bot' in route.query
// Testing: `?world=3` starts in Sunny Beach. Such runs don't count towards best or stats.
const startWorld = Number(route.query.world) > 1 ? Number(route.query.world) - 1 : undefined
const showFps = import.meta.dev || 'fps' in route.query || settings.showFps

let engine: Engine | null = null
let botTimer: ReturnType<typeof setTimeout> | undefined

function start() {
  result.value = null
  newBest.value = false
  phase.value = 'running'
  engine?.start()
  analytics.track('run_start', {})
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

function goHome() {
  router.push('/')
}

/** Auto-pause whenever the app is hidden (home button, call, notification centre). */
function onHidden() {
  if (document.visibilityState === 'hidden') pause()
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
  engine = new Engine(canvas.value, config.game(), {
    best: player.best,
    feedback: haptics,
    showFps,
    reduceMotion: settings.reduceMotion,
    autoplay: bot,
    invincible: bot,
    startWorld,
    safeTop: safeProbe.value?.offsetHeight ?? 0,
    hudInsetLeft: 52,
  })
  engine.on('run:end', (r) => {
    newBest.value = startWorld === undefined && player.recordRun(r)
    result.value = r
    phase.value = 'results'
    analytics.track('run_end', { score: r.score, world: r.world, seconds: r.seconds })
    if (bot) botTimer = setTimeout(start, 1500)
  })
  engine.on('world', (w) => analytics.track('world_reached', { world: w.index }))
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('pagehide', pause)
  window.addEventListener('blur', pause)
  start()
})

onBeforeUnmount(() => {
  clearTimeout(botTimer)
  document.removeEventListener('visibilitychange', onHidden)
  window.removeEventListener('pagehide', pause)
  window.removeEventListener('blur', pause)
  engine?.destroy()
  engine = null
})
</script>

<template>
  <div class="run">
    <div ref="safeProbe" class="safe-probe" aria-hidden="true" />
    <canvas ref="canvas" class="game" aria-label="Dobie Dash. Tap anywhere to jump." />
    <RunPauseButton v-if="phase === 'running'" @pause="pause" />
    <RunPauseSheet
      v-if="phase === 'paused'"
      v-bind="pauseInfo"
      @resume="resume"
      @restart="start"
      @quit="goHome"
    />
    <RunResultsCard
      v-if="phase === 'results' && result"
      :result="result"
      :best="player.best"
      :new-best="newBest"
      @again="start"
      @home="goHome"
    />
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
