<script setup lang="ts">
/** "What are biscuits and bones for?" Words in content/site.json (currencies). */
import site from '~/content/site.json'

defineProps<{ open?: boolean }>()
const guide = site.currencies
</script>

<template>
  <details class="guide" :open="open">
    <summary>{{ guide.title }}</summary>
    <ul>
      <li v-for="c in guide.items" :key="c.name">
        <span class="ic" aria-hidden="true">{{ c.icon }}</span>
        <span
          ><b>{{ c.name }}</b
          >{{ c.text }}</span
        >
      </li>
    </ul>
  </details>
</template>

<style scoped>
.guide {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 14px;
}
summary {
  font-weight: 900;
  cursor: pointer;
  color: var(--plum);
}
ul {
  list-style: none;
  margin: 10px 0 2px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
li {
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: var(--muted);
}
li b {
  display: block;
  color: var(--fg);
}
.ic {
  font-size: 22px;
}
</style>
