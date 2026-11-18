<template>
  <div class="bare"><slot /></div>
</template>

<style scoped>
.bare {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--bg);
}
</style>
