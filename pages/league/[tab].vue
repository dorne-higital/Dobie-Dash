<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const tabs = ['league', 'friends', 'world', 'dash']
const route = useRoute()
const current = computed(() => String(route.params.tab ?? tabs[0]))
</script>

<template>
  <UiPlaceholder
    title="League"
    base="/league"
    :tabs="tabs"
    :current="current"
    milestone="M4 / v1.1"
  />
</template>
