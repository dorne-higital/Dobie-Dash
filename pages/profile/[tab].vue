<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const tabs = ['stats', 'trophies', 'collection']
const route = useRoute()
const current = computed(() => String(route.params.tab ?? tabs[0]))
</script>

<template>
  <UiPlaceholder title="Profile" base="/profile" :tabs="tabs" :current="current" milestone="M3" />
</template>
