<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const tabs = ['daily', 'weekly', 'pass']
const route = useRoute()
const current = computed(() => String(route.params.tab ?? tabs[0]))
</script>

<template>
  <UiPlaceholder title="Missions" base="/missions" :tabs="tabs" :current="current" milestone="M3" />
</template>
