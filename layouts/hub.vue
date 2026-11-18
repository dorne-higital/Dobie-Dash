<template>
  <div class="hub">
    <HubTopBar />
    <main class="hub-main">
      <slot />
    </main>
    <HubTabBar />
  </div>
</template>

<style scoped>
.hub {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}
.hub-main {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
}
</style>
