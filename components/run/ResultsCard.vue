<script setup lang="ts">
import type { RunSummary } from '~/game/run'

const props = withDefaults(
  defineProps<{
    result: RunSummary
    best: number
    newBest: boolean
    /** Things this run unlocked or earned (item names, medals). */
    earned?: string[]
    dogName?: string
  }>(),
  { earned: () => [], dogName: 'Dobie' },
)
const emit = defineEmits<{ again: []; home: [] }>()

const shared = ref('')
async function share() {
  const r = props.result
  const text = `${props.dogName} just scored ${r.score.toLocaleString()} in Dobie Dash and reached ${r.worldName}! 🐾`
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return
    }
    await navigator.clipboard.writeText(text)
    shared.value = 'Copied to share!'
  } catch {
    /* share sheet closed */
  }
}

// Ignore taps for a moment so a panicked jump-tap doesn't skip the card.
const ready = ref(false)
onMounted(() => setTimeout(() => (ready.value = true), 600))
function tapAnywhere() {
  if (ready.value) emit('again')
}
</script>

<template>
  <div class="backdrop" @pointerdown.stop @click="tapAnywhere">
    <div class="card" role="dialog" aria-modal="true" aria-labelledby="ruff" @click.stop>
      <h2 id="ruff">RUFF!</h2>
      <p v-if="result.caughtBy" class="caught">{{ result.caughtBy }} got you!</p>
      <div class="score">{{ result.score.toLocaleString() }}</div>
      <div v-if="newBest" class="badge">New best!</div>
      <div v-else class="best">Best {{ best.toLocaleString() }}</div>
      <dl class="stats">
        <div>
          <dt>Distance</dt>
          <dd>{{ result.metres.toLocaleString() }} m</dd>
        </div>
        <div>
          <dt>Biscuits</dt>
          <dd>{{ result.biscuits }}</dd>
        </div>
        <div>
          <dt>World</dt>
          <dd>{{ result.world + 1 }} · {{ result.worldName }}</dd>
        </div>
        <div v-if="result.nearMisses">
          <dt>Near misses</dt>
          <dd>{{ result.nearMisses }}</dd>
        </div>
        <div v-if="result.escapes">
          <dt>Escaped</dt>
          <dd>{{ result.escapes }} {{ result.escapes === 1 ? 'chase' : 'chases' }}</dd>
        </div>
      </dl>
      <ul v-if="earned.length" class="earned">
        <li v-for="e in earned" :key="e">🎉 {{ e }}</li>
      </ul>
      <UiButton big :disabled="!ready" @click="emit('again')">Play again</UiButton>
      <div class="row">
        <UiButton variant="ghost" @click="emit('home')">Home</UiButton>
        <UiButton variant="secondary" @click="share">{{ shared || 'Share' }}</UiButton>
      </div>
    </div>
    <p class="hint">Tap anywhere to go again</p>
  </div>
</template>

<style scoped>
.earned {
  list-style: none;
  margin: 0 0 4px;
  padding: 8px 12px;
  border-radius: 14px;
  background: #fff4c4;
  font-weight: 900;
  font-size: 14px;
}
.row {
  display: flex;
  gap: 8px;
}
.row > * {
  flex: 1;
}
.caught {
  margin: -4px 0 6px;
  font-weight: 900;
  color: var(--collar, #e5484d);
}
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(20, 10, 30, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px;
}
.card {
  width: min(340px, 100%);
  background: var(--cream);
  border-radius: 28px;
  padding: 22px 22px 14px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  text-align: center;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
  animation: pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1);
}
@keyframes pop {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
  }
}
h2 {
  margin: 0;
  font-size: 44px;
  color: var(--collar);
  -webkit-text-stroke: 2px var(--plum);
}
.score {
  font-family: var(--display);
  font-size: 56px;
  line-height: 1;
  color: var(--plum);
  font-variant-numeric: tabular-nums;
}
.badge {
  align-self: center;
  background: var(--gold);
  color: var(--plum);
  font-weight: 900;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 999px;
  padding: 4px 12px;
}
.best {
  color: var(--muted);
  font-size: 14px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 6px 0 8px;
}
.stats div {
  background: #fff;
  border-radius: 14px;
  padding: 8px 4px;
}
dt {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 900;
}
dd {
  margin: 2px 0 0;
  font-weight: 900;
  font-size: 14px;
  color: var(--plum);
}
.hint {
  margin: 0;
  color: #fff;
  font-weight: 900;
  font-size: 14px;
  opacity: 0.85;
}
</style>
