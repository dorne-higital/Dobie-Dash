<script setup lang="ts">
/**
 * One world drawn as a little island for the Worlds map, centred on (0,0), about 140 wide.
 * `kind` picks the scenery; the map greys out worlds you haven't reached.
 */
defineProps<{ kind: string }>()

const TOP: Record<string, string> = {
  park: '#7fd46a',
  city: '#b8a3c9',
  beach: '#f6dd9a',
  night: '#4a4790',
  snow: '#f4f8ff',
  site: '#d9a35f',
  haunted: '#7b5a9c',
  moon: '#b9bccb',
}
</script>

<template>
  <g stroke="#2a1530" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- shallows, sand, top -->
    <ellipse cx="0" cy="34" rx="74" ry="22" fill="#bfeaff" stroke="none" opacity="0.8" />
    <ellipse cx="0" cy="28" rx="64" ry="19" fill="#f3d58a" />
    <ellipse cx="0" cy="20" rx="56" ry="15" :fill="TOP[kind] ?? '#7fd46a'" />

    <template v-if="kind === 'park'">
      <rect x="-36" y="-8" width="6" height="26" fill="#9b6a3c" />
      <circle cx="-33" cy="-16" r="16" fill="#5fbf4a" />
      <circle cx="-26" cy="-22" r="7" fill="#8ee070" stroke="none" />
      <rect x="22" y="-2" width="5" height="20" fill="#9b6a3c" />
      <circle cx="24.5" cy="-8" r="12" fill="#5fbf4a" />
      <path d="M-12 14h22M-10 14v5M8 14v5M-12 9h22" fill="none" />
      <rect x="40" y="6" width="7" height="12" rx="2" fill="#e5484d" />
    </template>

    <template v-else-if="kind === 'city'">
      <rect x="-44" y="-26" width="22" height="46" fill="#a2648c" />
      <rect x="-20" y="-44" width="24" height="64" fill="#c27aa6" />
      <rect x="6" y="-18" width="20" height="38" fill="#8d5a8f" />
      <rect x="28" y="-6" width="16" height="26" fill="#b06b96" />
      <g fill="#ffd979" stroke="none">
        <rect x="-39" y="-18" width="5" height="6" /><rect x="-31" y="-18" width="5" height="6" />
        <rect x="-39" y="-6" width="5" height="6" /><rect x="-14" y="-36" width="5" height="6" />
        <rect x="-5" y="-36" width="5" height="6" /><rect x="-14" y="-22" width="5" height="6" />
        <rect x="-5" y="-8" width="5" height="6" /><rect x="11" y="-10" width="5" height="6" />
        <rect x="32" y="2" width="4" height="5" />
      </g>
    </template>

    <template v-else-if="kind === 'beach'">
      <path d="M-18 18c2-14 6-28 16-40" fill="none" stroke-width="6" />
      <path d="M-18 18c2-14 6-28 16-40" fill="none" stroke="#b07a45" stroke-width="2.5" />
      <path
        d="M-2-22c-8-8-22-6-26 2 9-3 17-3 26-2zM-2-22c4-10 18-12 24-4-9 0-17 1-24 4zM-2-22c8-2 18 4 18 14-6-6-12-10-18-14z"
        fill="#5fbf4a"
      />
      <path d="M14 18V-2" fill="none" />
      <path d="M-2 0a16 10 0 0 1 32 0z" fill="#ff4fa0" />
      <path d="M6 0a8 10 0 0 1 16 0" fill="#fff" stroke="none" opacity="0.8" />
      <ellipse cx="36" cy="16" rx="6" ry="4" fill="#e5484d" />
    </template>

    <template v-else-if="kind === 'night'">
      <path d="M30-46a12 12 0 1 0 10 18 10 10 0 0 1-10-18z" fill="#fff3b0" />
      <rect x="-46" y="-20" width="22" height="40" fill="#2f2b5c" />
      <rect x="-22" y="-36" width="22" height="56" fill="#3a3584" />
      <rect x="2" y="-12" width="18" height="32" fill="#2f2b5c" />
      <g fill="#ffd23f" stroke="none">
        <rect x="-41" y="-12" width="5" height="6" /><rect x="-33" y="-2" width="5" height="6" />
        <rect x="-16" y="-28" width="5" height="6" /><rect x="-8" y="-16" width="5" height="6" />
        <rect x="-16" y="-4" width="5" height="6" /><rect x="7" y="-4" width="5" height="6" />
      </g>
      <path d="M34 18V-8M34-8h8" fill="none" />
      <circle cx="42" cy="-5" r="4" fill="#ffd23f" />
    </template>

    <template v-else-if="kind === 'snow'">
      <path d="M-50 18L-20-40 10 18z" fill="#8fb8e8" />
      <path d="M-32-16L-20-40-8-16l-6 4-6-6-6 6z" fill="#fff" />
      <path d="M-6 18L18-24 42 18z" fill="#a8c8f0" />
      <path d="M8-6L18-24 28-6l-5 3-5-5-5 5z" fill="#fff" />
      <circle cx="40" cy="10" r="8" fill="#fff" />
      <circle cx="40" cy="-4" r="6" fill="#fff" />
      <path d="M40-4l5 1" stroke="#f2a516" />
    </template>

    <template v-else-if="kind === 'site'">
      <path d="M-30 18V-44M-30-44H30M-30-30l14-14M22-44v18" fill="none" stroke-width="3" />
      <path d="M-30 18V-44H30" fill="none" stroke="#f2a516" stroke-width="1.2" />
      <rect x="16" y="-26" width="12" height="7" fill="#f2a516" />
      <path d="M-6 18l6-18 6 18z" fill="#ff8a3d" />
      <rect x="20" y="0" width="26" height="16" rx="3" fill="#ffd23f" />
      <circle cx="26" cy="18" r="4" fill="#4a4a5a" /><circle cx="40" cy="18" r="4" fill="#4a4a5a" />
    </template>

    <template v-else-if="kind === 'haunted'">
      <path
        d="M-30 18c2-16 0-30-6-44M-34-8c-8-4-12-12-12-18M-32-16c6-6 14-8 18-14"
        fill="none"
        stroke-width="4"
      />
      <path d="M8-30c0-12 18-12 18 0v22l-4-4-5 4-5-4-4 4z" fill="#f4f0ff" />
      <circle cx="14" cy="-28" r="1.6" fill="#2a1530" stroke="none" />
      <circle cx="20" cy="-28" r="1.6" fill="#2a1530" stroke="none" />
      <ellipse cx="34" cy="10" rx="11" ry="9" fill="#f2a516" />
      <path d="M34 1v-5" fill="none" />
    </template>

    <template v-else-if="kind === 'moon'">
      <circle cx="-30" cy="12" r="7" fill="#9a9db0" />
      <circle cx="16" cy="14" r="5" fill="#9a9db0" />
      <path d="M-6 18v-36" fill="none" />
      <path d="M-6-18h18l-4 6 4 6h-18" fill="#ff4fa0" />
      <ellipse cx="30" cy="-34" rx="16" ry="5" fill="#2fd0c0" />
      <path d="M22-36a8 7 0 0 1 16 0" fill="#c8ecff" />
    </template>
  </g>
</template>
