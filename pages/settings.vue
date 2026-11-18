<script setup lang="ts">
definePageMeta({ layout: 'hub' })
const settings = useSettingsStore()
const { iap } = useServices()
const restoring = ref(false)
const restoreMsg = ref('')
const version = useRuntimeConfig().public.appVersion

async function restore() {
  restoring.value = true
  const ids = await iap.restore().catch(() => null)
  restoring.value = false
  restoreMsg.value = !ids
    ? 'Restore works in the iPhone app.'
    : ids.length
      ? `Restored ${ids.length} purchase${ids.length === 1 ? '' : 's'}.`
      : 'Nothing to restore.'
}
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
    <div class="group links">
      <NuxtLink to="/run?tutorial" class="row">
        <span><b>How to play</b><small>Replay the three-step tutorial</small></span>
        <span aria-hidden="true">›</span>
      </NuxtLink>
      <button type="button" class="row" :disabled="restoring" @click="restore">
        <span
          ><b>Restore purchases</b
          ><small>{{
            restoreMsg || 'Bought something on another phone? Get it back here.'
          }}</small></span
        >
        <span aria-hidden="true">{{ restoring ? '…' : '↻' }}</span>
      </button>
    </div>
    <div class="group">
      <UiToggle
        v-model="settings.showFps"
        label="Frame-time overlay"
        hint="For performance testing. Also on with ?fps in the URL"
      />
    </div>
    <p class="ver">Dobie Dash {{ version }}</p>
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
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: 0;
  text-align: left;
  font: inherit;
  color: var(--fg);
  text-decoration: none;
  cursor: pointer;
}
.row b,
.row small {
  display: block;
}
.row small {
  color: var(--muted);
  font-size: 13px;
}
.ver {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  margin: 0;
}
.group > :deep(* + *) {
  border-top: 1px solid var(--line);
}
</style>
