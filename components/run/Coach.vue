<script setup lang="ts">
/** Tutorial coach: what to do in this step, a quick "oops", and "You're ready!". */
defineProps<{ title: string; text: string; step: number; oops: boolean }>()
</script>

<template>
  <div class="coach" :class="{ oops }" role="status" aria-live="polite">
    <span v-if="step > 0" class="step">Step {{ step }} of 3</span>
    <b>{{ title }}</b>
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
.coach {
  position: absolute;
  left: 50%;
  top: calc(var(--safe-top) + 26%);
  transform: translateX(-50%);
  width: min(320px, calc(100% - 32px));
  background: rgba(255, 248, 238, 0.95);
  border: 3px solid var(--pink);
  border-radius: 20px;
  padding: 10px 14px;
  text-align: center;
  pointer-events: none;
  z-index: 5;
  box-shadow: 0 16px 30px -18px rgba(40, 10, 60, 0.7);
}
.coach.oops {
  border-color: var(--gold);
}
.step {
  display: block;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pink);
  font-weight: 900;
}
b {
  display: block;
  font-family: var(--display);
  font-weight: 400;
  font-size: 24px;
  color: var(--plum);
}
p {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--muted);
}
</style>
