<template>
  <div class="run-layout">
    <slot />
  </div>
</template>

<style scoped>
/* Full screen, no chrome: the whole screen is the jump button. */
.run-layout {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #000;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>
