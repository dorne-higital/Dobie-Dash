<script setup lang="ts">
/** One-time Starter Pack offer, after the 10th run. */
import { product } from '~/logic/store'

const emit = defineEmits<{ close: [] }>()
const { price, busy, message, buy, loadPrices } = usePurchases()
onMounted(loadPrices)
const p = product('starter')!

async function take() {
  if (await buy('starter', 'starter-offer')) emit('close')
}
</script>

<template>
  <div class="backdrop" @pointerdown.stop>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="starter-title">
      <span class="tag">One-time offer</span>
      <div class="ic" aria-hidden="true">🎒</div>
      <h2 id="starter-title">{{ p.title }}</h2>
      <p>🍪 {{ p.grants.biscuits?.toLocaleString() }} biscuits and the Bandana</p>
      <UiButton big :disabled="!!busy" @click="take">{{ busy ? '…' : price('starter') }}</UiButton>
      <small v-if="message">{{ message }}</small>
      <UiButton variant="ghost" @click="emit('close')">No thanks</UiButton>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(20, 10, 30, 0.6);
  display: grid;
  place-items: center;
  padding: 16px;
}
.sheet {
  width: min(320px, 100%);
  background: var(--cream);
  border-radius: 28px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}
.tag {
  align-self: center;
  background: var(--pink);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 3px 10px;
}
.ic {
  font-size: 48px;
}
h2 {
  margin: 0;
  font-size: 30px;
  color: var(--plum);
}
p,
small {
  margin: 0;
  color: var(--muted);
}
</style>
