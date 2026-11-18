<script setup lang="ts">
defineProps<{ score: number; worldName: string; progress: number | null }>()
defineEmits<{ resume: []; restart: []; quit: [] }>()
</script>

<template>
  <div class="backdrop" @pointerdown.stop>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title">Paused</h2>
      <p class="sub">
        {{ score.toLocaleString() }} points · {{ worldName }}
        <template v-if="progress !== null">
          · {{ Math.round(progress * 100) }}% to the next world</template
        >
      </p>
      <UiButton big @click="$emit('resume')">Resume</UiButton>
      <UiButton variant="secondary" @click="$emit('restart')">Restart</UiButton>
      <UiButton variant="ghost" @click="$emit('quit')">Quit to home</UiButton>
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
  padding: 26px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
}
h2 {
  margin: 0;
  font-size: 40px;
  color: var(--plum);
}
.sub {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 14px;
}
</style>
