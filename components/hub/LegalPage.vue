<script setup lang="ts">
/**
 * The in-app privacy policy and help page (M8), built from store/*.md by `npm run legal`
 * (the same text as danhorne.co.uk/dobie-dash). Works offline. The HTML is our own,
 * generated at build time, never user content.
 */
import legal from '~/content/legal.json'

const props = defineProps<{ page: 'privacy' | 'support' }>()
const doc = computed(() => legal[props.page])
const router = useRouter()
</script>

<template>
  <section class="legal">
    <button type="button" class="back" @click="router.back()">‹ Back</button>
    <h1>{{ doc.title }}</h1>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="body" v-html="doc.html" />
  </section>
</template>

<style scoped>
.legal {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.back {
  align-self: flex-start;
  appearance: none;
  border: 0;
  background: none;
  color: var(--pink);
  font: inherit;
  font-weight: 900;
  padding: 4px 0;
  cursor: pointer;
}
h1 {
  margin: 0;
  font-size: 30px;
}
.body {
  font-size: 15px;
  line-height: 1.55;
}
.body :deep(h2) {
  font-size: 19px;
  margin: 20px 0 4px;
}
.body :deep(p) {
  margin: 8px 0;
}
.body :deep(ul) {
  padding-left: 20px;
  margin: 6px 0;
}
.body :deep(a) {
  color: var(--pink);
  font-weight: 800;
  overflow-wrap: anywhere;
}
</style>
