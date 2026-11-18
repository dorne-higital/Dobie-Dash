<script setup lang="ts">
defineEmits<{ pause: [] }>()
</script>

<template>
  <button
    type="button"
    class="pause"
    aria-label="Pause"
    @pointerdown.stop
    @click.stop="$emit('pause')"
  >
    <span /><span />
  </button>
</template>

<style scoped>
.pause {
  position: absolute;
  top: max(var(--safe-top), 5.87vh);
  top: max(var(--safe-top), 5.87dvh);
  left: 14px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 0;
  background: rgba(20, 12, 30, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  z-index: 5;
  touch-action: manipulation;
}
.pause span {
  width: 5px;
  height: 16px;
  border-radius: 2px;
  background: #fff;
}
.pause:focus-visible {
  outline: 3px solid var(--gold);
}
</style>
