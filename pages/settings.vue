<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const settings = useSettingsStore()
</script>

<template>
  <section class="settings">
    <h1>Settings</h1>
    <div class="group">
      <UiToggle v-model="settings.haptics" label="Haptics" hint="Taps and thuds as you play" />
      <UiToggle v-model="settings.sfx" label="Sound effects" hint="Jumps, biscuits, barks" />
      <UiToggle v-model="settings.music" label="Music" hint="A tune for each world" />
    </div>
    <div class="group">
      <UiToggle
        v-model="settings.reduceMotion"
        label="Reduce motion"
        hint="No screen shake or flashes"
      />
    </div>
    <div class="group">
      <UiToggle
        v-model="settings.showFps"
        label="Frame-time overlay"
        hint="For performance testing. Also on with ?fps in the URL"
      />
    </div>
  </section>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.group {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
}
.group > :deep(* + *) {
  border-top: 1px solid var(--line);
}
</style>
