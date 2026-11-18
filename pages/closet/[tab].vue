<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const tabs = ['looks', 'outfits', 'trails', 'collars', 'store']
const route = useRoute()
const current = computed(() => String(route.params.tab ?? tabs[0]))
</script>

<template>
  <UiPlaceholder title="Closet" base="/closet" :tabs="tabs" :current="current" milestone="M3" />
</template>
