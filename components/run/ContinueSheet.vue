<script setup lang="ts">
/**
 * "Keep running?" after a crash: a countdown ring, a rewarded ad, or biscuits.
 * The countdown stops while the ad plays. Running out of time is the same as "No thanks".
 */
const props = defineProps<{
  price: number
  countdown: number
  /** Biscuits the player can spend: banked plus this run's. */
  available: number
  caughtBy: string | null
}>()
const emit = defineEmits<{ ad: []; spend: []; decline: [] }>()

const left = ref(props.countdown)
const busy = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let last = 0

onMounted(() => {
  last = performance.now()
  timer = setInterval(() => {
    const now = performance.now()
    if (!busy.value) left.value = Math.max(0, left.value - (now - last) / 1000)
    last = now
    if (left.value <= 0) {
      clearInterval(timer)
      emit('decline')
    }
  }, 50)
})
onBeforeUnmount(() => clearInterval(timer))

const canAfford = computed(() => props.available >= props.price)
const ring = computed(() => left.value / props.countdown)

function watchAd() {
  busy.value = true
  emit('ad')
}
defineExpose({ adFinished: () => (busy.value = false) })
</script>

<template>
  <div class="backdrop" @pointerdown.stop>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="keep-title">
      <h2 id="keep-title">Keep running?</h2>
      <p v-if="caughtBy" class="sub">{{ caughtBy }} nearly had you!</p>
      <div class="ring" :style="{ '--p': ring }" aria-hidden="true">
        <span>{{ Math.ceil(left) }}</span>
      </div>
      <UiButton big :disabled="busy" @click="watchAd">
        {{ busy ? 'Ad playing…' : 'Watch an ad' }}
      </UiButton>
      <UiButton variant="secondary" :disabled="busy || !canAfford" @click="emit('spend')">
        Spend {{ price }} biscuits
      </UiButton>
      <p v-if="!canAfford" class="note">You have {{ available.toLocaleString() }} biscuits</p>
      <UiButton variant="ghost" :disabled="busy" @click="emit('decline')">No thanks</UiButton>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(20, 10, 30, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
}
.sheet {
  width: min(340px, 100%);
  background: var(--cream);
  border-radius: 28px;
  padding: 24px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
}
h2 {
  margin: 0;
  font-size: 36px;
  color: var(--plum);
}
.sub,
.note {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.ring {
  --p: 1;
  width: 84px;
  height: 84px;
  margin: 4px auto 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(closest-side, var(--cream) 78%, transparent 80%),
    conic-gradient(var(--pink) calc(var(--p) * 360deg), rgba(42, 21, 48, 0.12) 0);
}
.ring span {
  font-family: var(--display);
  font-size: 34px;
  color: var(--plum);
}
</style>
