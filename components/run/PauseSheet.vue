<script setup lang="ts">
/** Pause: resume, restart, quick settings and quit, plus progress to the next world and
 * how this run is going on today's missions. */
import type { RunSummary } from '~/game/run'
import { previewProgress, refresh } from '~/logic/missions'

const props = defineProps<{
  score: number
  worldName: string
  progress: number | null
  nextWorld: string | null
  summary: RunSummary | null
}>()
defineEmits<{ resume: []; restart: []; quit: [] }>()

const player = usePlayerStore()
const settings = useSettingsStore()
// Deal today's missions if no hub screen has yet (e.g. straight into a run after midnight).
refresh(player, new Date())
const missions = computed(() => (props.summary ? previewProgress(player, props.summary) : []))
const showSettings = ref(false)
</script>

<template>
  <div class="backdrop" @pointerdown.stop>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title">Paused</h2>
      <p class="sub">{{ score.toLocaleString() }} points · {{ worldName }}</p>
      <div v-if="progress !== null && nextWorld" class="next">
        <div class="bar"><i :style="{ width: `${progress * 100}%` }" /></div>
        <small>{{ Math.round(progress * 100) }}% of the way to {{ nextWorld }}</small>
      </div>

      <ul v-if="missions.length" class="missions">
        <li v-for="m in missions" :key="m.id" :class="{ done: m.done, claimed: m.claimed }">
          <UiIcon class="tick" :name="m.done ? 'check' : 'todo'" />
          <span class="t">{{ m.def.text }}</span>
          <span class="p"
            >{{ Math.min(m.p, m.def.goal).toLocaleString() }}/{{
              m.def.goal.toLocaleString()
            }}</span
          >
        </li>
      </ul>

      <UiButton big @click="$emit('resume')">Resume</UiButton>
      <UiButton variant="secondary" @click="$emit('restart')">Restart</UiButton>
      <UiButton variant="ghost" @click="showSettings = !showSettings">
        {{ showSettings ? 'Hide settings' : 'Settings' }}
      </UiButton>
      <div v-if="showSettings" class="settings">
        <UiToggle v-model="settings.music" label="Music" />
        <UiToggle v-model="settings.sfx" label="Sound effects" />
        <UiToggle v-model="settings.haptics" label="Haptics" />
      </div>
      <UiButton variant="ghost" @click="$emit('quit')">Quit to home</UiButton>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(20, 10, 30, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
}
.sheet {
  width: min(340px, 100%);
  background: var(--cream);
  border-radius: 28px;
  padding: 22px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
}
h2 {
  margin: 0;
  font-size: 40px;
  color: var(--plum);
}
.sub {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.next small {
  color: var(--muted);
  font-size: 12px;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
  margin-bottom: 4px;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--gold);
}
.missions {
  list-style: none;
  margin: 0;
  padding: 8px 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  font-size: 13px;
}
.missions li {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.missions .t {
  flex: 1;
}
.missions .p {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.missions li.done .tick {
  color: #18a597;
}
.missions li.claimed {
  opacity: 0.5;
}
.settings {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 4px 12px;
}
</style>
