<script setup lang="ts">
defineProps<{
  title: string
  milestone?: string
  tabs?: string[]
  base?: string
  current?: string
}>()
</script>

<template>
  <section class="ph">
    <h1>{{ title }}</h1>
    <nav v-if="tabs && base" class="seg" aria-label="Sections">
      <NuxtLink
        v-for="t in tabs"
        :key="t"
        :to="`${base}/${t}`"
        class="seg-item"
        :class="{ on: t === current }"
        >{{ t }}</NuxtLink
      >
    </nav>
    <div class="card">
      <slot>
        <p>
          Coming in <b>{{ milestone ?? 'M3' }}</b>.
        </p>
      </slot>
    </div>
  </section>
</template>

<style scoped>
.ph {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.seg {
  display: flex;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-radius: 999px;
  color: var(--muted);
  text-decoration: none;
  text-transform: capitalize;
  font-weight: 900;
  font-size: 13px;
}
.seg-item.on {
  background: var(--pink);
  color: #fff;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  color: var(--muted);
}
.card :deep(p) {
  margin: 0;
}
</style>
