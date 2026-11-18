<script setup lang="ts">
definePageMeta({ layout: 'hub' })
</script>

<template>
  <section class="home">
    <h1 class="logo">Dobie <span>Dash</span></h1>
    <NuxtLink to="/run" class="play">Tap to run</NuxtLink>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
}
.logo {
  margin: 0;
  font-size: 56px;
  line-height: 1;
}
.logo span {
  color: var(--pink);
}
.play {
  background: var(--pink);
  color: #fff;
  text-decoration: none;
  font-family: var(--display);
  font-size: 26px;
  padding: 14px 36px;
  border-radius: 999px;
  box-shadow: 0 6px 0 #c22a76;
}
</style>
