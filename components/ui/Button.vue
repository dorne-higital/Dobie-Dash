<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'secondary' | 'ghost'; big?: boolean }>(), {
  variant: 'primary',
  big: false,
})
</script>

<template>
  <button type="button" class="btn" :class="[variant, { big }]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  border: 0;
  border-radius: 999px;
  padding: 12px 24px;
  font-family: var(--display);
  font-size: 20px;
  letter-spacing: 0.01em;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 0.08s;
}
.btn:active {
  transform: translateY(3px);
}
.btn:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
.big {
  font-size: 26px;
  padding: 14px 34px;
}
.primary {
  background: var(--pink);
  color: #fff;
  box-shadow: 0 5px 0 #c22a76;
}
.secondary {
  background: var(--surface);
  color: var(--plum);
  box-shadow: 0 5px 0 #d8cce4;
}
.ghost {
  background: transparent;
  color: var(--muted);
  font-family: var(--body);
  font-weight: 900;
  font-size: 15px;
}
</style>
