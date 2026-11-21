<script setup lang="ts">
import site from '~/content/site.json'

definePageMeta({ layout: 'hub' })
const devTools = !!useRuntimeConfig().public.devTools
const settings = useSettingsStore()
const purchases = usePurchases()
const version = useRuntimeConfig().public.appVersion

/** Opens Mail with the app and iOS version filled in, so bug reports say what they ran. */
const feedbackHref = computed(() => {
  const f = site.feedback
  const ios = /OS (\d+[_\d]*)/.exec(navigator.userAgent)?.[1]?.replaceAll('_', '.') ?? 'web'
  const body = `\n\n\n---\nDobie Dash ${version} · iOS ${ios}`
  return `mailto:${f.email}?subject=${encodeURIComponent(`${f.subject} (${version})`)}&body=${encodeURIComponent(body)}`
})

function restore() {
  void purchases.restore()
}
</script>

<template>
  <section class="settings">
    <h1>Settings</h1>
    <div class="group">
      <UiToggle v-model="settings.haptics" label="Haptics" hint="Taps and thuds as you play" />
    </div>
    <div class="group">
      <UiToggle
        v-model="settings.reduceMotion"
        label="Reduce motion"
        hint="No screen shake, flashes or bouncing"
      />
      <UiToggle
        v-model="settings.largeText"
        label="Larger text"
        hint="Bigger words and buttons outside a run"
      />
      <UiToggle
        v-model="settings.holdToJump"
        label="Hold to jump higher"
        hint="Keep your finger down for a bigger jump. A tap still works."
      />
    </div>
    <HubCurrencyGuide />
    <div class="group links">
      <NuxtLink to="/run?tutorial" class="row">
        <span><b>How to play</b><small>Replay the three-step tutorial</small></span>
        <span aria-hidden="true">›</span>
      </NuxtLink>
      <button type="button" class="row" :disabled="!!purchases.busy.value" @click="restore">
        <span
          ><b>Restore purchases</b
          ><small>{{
            purchases.message.value || 'Bought something on another phone? Get it back here.'
          }}</small></span
        >
        <span aria-hidden="true">{{ purchases.busy.value === 'restore' ? '…' : '↻' }}</span>
      </button>
      <a :href="feedbackHref" class="row">
        <span
          ><b>Send feedback</b
          ><small>{{ site.feedback.hint }} {{ site.feedback.email }}</small></span
        >
        <span aria-hidden="true">›</span>
      </a>
      <a :href="site.links.support" target="_blank" rel="noopener" class="row">
        <span><b>Help and support</b></span>
        <span aria-hidden="true">›</span>
      </a>
      <a :href="site.links.privacy" target="_blank" rel="noopener" class="row">
        <span><b>Privacy policy</b></span>
        <span aria-hidden="true">›</span>
      </a>
    </div>
    <div v-if="devTools" class="group">
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
