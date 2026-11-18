<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <label class="row">
    <span class="text">
      <b>{{ label }}</b>
      <small v-if="hint">{{ hint }}</small>
    </span>
    <input v-model="model" type="checkbox" role="switch" class="sw" />
  </label>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
}
.text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
small {
  color: var(--muted);
  font-size: 12.5px;
}
.sw {
  appearance: none;
  width: 50px;
  height: 30px;
  border-radius: 999px;
  background: var(--line);
  position: relative;
  cursor: pointer;
  transition: background 0.15s;
  flex: none;
}
.sw::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s;
}
.sw:checked {
  background: var(--pink);
}
.sw:checked::after {
  transform: translateX(20px);
}
.sw:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
</style>
