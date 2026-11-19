<script setup lang="ts">
/** Big Bark (M7): a button in the bottom corner during a run, with how many are left. */
defineProps<{ left: number }>()
defineEmits<{ bark: [] }>()
</script>

<template>
  <button
    type="button"
    class="bark"
    :aria-label="`Big Bark: clear the screen (${left} left)`"
    @pointerdown.stop="$emit('bark')"
    @click.stop
  >
    <UiIcon name="bark" class="ic" />
    <span class="n">{{ left }}</span>
  </button>
</template>

<style scoped>
.bark {
  position: absolute;
  left: 14px;
  bottom: calc(var(--safe-bottom) + 18px);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: radial-gradient(circle at 35% 30%, #ff8fc4, var(--pink) 65%);
  box-shadow:
    0 5px 0 #c92a78,
    0 0 0 6px rgba(255, 79, 160, 0.25);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 5;
  touch-action: manipulation;
  animation: glow 1.4s ease-in-out infinite;
}
.ic {
  width: 36px;
  height: 36px;
}
.n {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  background: var(--gold);
  color: var(--plum);
  font: 900 14px/24px var(--body);
  border: 2px solid #fff;
}
.bark:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #c92a78;
}
.bark:focus-visible {
  outline: 3px solid var(--gold);
}
@keyframes glow {
  50% {
    box-shadow:
      0 5px 0 #c92a78,
      0 0 0 12px rgba(255, 79, 160, 0.12);
  }
}
</style>
