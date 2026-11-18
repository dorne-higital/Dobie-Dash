<script setup lang="ts">
/** First screen for a new player: make your dog, then learn to play. */
definePageMeta({ layout: 'bare' })
const router = useRouter()
const player = usePlayerStore()

function done() {
  router.replace(player.flags.tutorialDone ? '/' : '/run?tutorial')
}
</script>

<template>
  <section class="make">
    <h1>Make your dog</h1>
    <p class="sub">Make one like yours at home. You can change it any time in the Wardrobe.</p>
    <DogMaker cta="Let's go!" @saved="done" />
  </section>
</template>

<style scoped>
.make {
  padding: calc(var(--safe-top) + 16px) 16px calc(var(--safe-bottom) + 16px);
  max-width: 560px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 34px;
}
.sub {
  margin: 4px 0 14px;
  color: var(--muted);
}
</style>
