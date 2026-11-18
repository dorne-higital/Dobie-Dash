/**
 * The game's own icon set, drawn in code like the rest of the art: a thick plum outline
 * with the palette's pinks, golds and creams. 32×32 viewBox. Used through <UiIcon name>.
 * `outlined()` draws shapes twice (fat plum, then the fill on top) so overlapping shapes
 * get one clean outer outline, like the sprites.
 */
const PLUM = '#2a1530'
const GOLD = '#ffd23f'
const PINK = '#ff4fa0'
const CREAM = '#fff8ee'
const TAN = '#e9b062'
const TEAL = '#2fd0c0'
const WOOD = '#c98a4c'

const outlined = (shapes: string, fill: string) =>
  `<g fill="${PLUM}" stroke="${PLUM}" stroke-width="4.4">${shapes}</g><g fill="${fill}" stroke="none">${shapes}</g>`

const chips = (pts: [number, number, number][]) =>
  pts
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b3b1f" stroke="none"/>`)
    .join('')

const biscuit = (cx = 16, cy = 16, r = 12) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TAN}"/>` +
  chips([
    [cx - 4 * (r / 12), cy - 3 * (r / 12), 1.8 * (r / 12)],
    [cx + 3 * (r / 12), cy - 5 * (r / 12), 1.6 * (r / 12)],
    [cx + 4 * (r / 12), cy + 3 * (r / 12), 1.9 * (r / 12)],
    [cx - 3 * (r / 12), cy + 4 * (r / 12), 1.7 * (r / 12)],
  ])

const boneShapes =
  '<circle cx="8" cy="12.5" r="4"/><circle cx="8" cy="19.5" r="4"/><circle cx="24" cy="12.5" r="4"/><circle cx="24" cy="19.5" r="4"/><rect x="8" y="13" width="16" height="6"/>'

const star = (fill = GOLD) =>
  `<path d="M16 4l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L16 22.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" fill="${fill}"/>`

const pawIn = (fill: string) =>
  `<ellipse cx="16" cy="21" rx="6.5" ry="5.5" fill="${fill}"/>` +
  [
    [8.5, 13],
    [13, 8.5],
    [19, 8.5],
    [23.5, 13],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${fill}"/>`)
    .join('')
const paw = pawIn(PINK)

const dogHead = (coat = '#332e3d', tan = '#e8965a') =>
  `<path d="M8 10c-3.5 1-4.5 7-2 10l3.5-2.5zM24 10c3.5 1 4.5 7 2 10l-3.5-2.5z" fill="${coat}"/>` +
  `<ellipse cx="16" cy="17" rx="9" ry="8.5" fill="${coat}"/>` +
  `<ellipse cx="16" cy="21.5" rx="5" ry="3.6" fill="${tan}"/>` +
  `<ellipse cx="16" cy="19.6" rx="1.9" ry="1.3" fill="${PLUM}" stroke="none"/>` +
  `<circle cx="12.3" cy="15" r="1.7" fill="#fff" stroke="none"/><circle cx="19.7" cy="15" r="1.7" fill="#fff" stroke="none"/>` +
  `<circle cx="12.6" cy="15.3" r="0.9" fill="${PLUM}" stroke="none"/><circle cx="20" cy="15.3" r="0.9" fill="${PLUM}" stroke="none"/>`

const medal = (fill: string) =>
  `<path d="M9.5 3h5l3.5 9h-5zM22.5 3h-5L14 12h5z" fill="${PINK}"/>` +
  `<circle cx="16" cy="20" r="8.5" fill="${fill}"/><circle cx="16" cy="20" r="4.5" fill="none" stroke="${PLUM}" stroke-opacity=".35"/>`

export const ICONS: Record<string, string> = {
  biscuit: biscuit(),
  bone: `<g transform="rotate(-30 16 16)">${outlined(boneShapes, GOLD)}</g><path d="M11 12.6l7-4" stroke="#fff6c2" stroke-width="1.6"/>`,
  gear:
    outlined(
      '<circle cx="16" cy="16" r="9"/>' +
        [0, 45, 90, 135, 180, 225, 270, 315]
          .map(
            (a) =>
              `<rect x="13.5" y="3.5" width="5" height="6" rx="1" transform="rotate(${a} 16 16)"/>`,
          )
          .join(''),
      '#d9d0e6',
    ) + `<circle cx="16" cy="16" r="3.8" fill="${CREAM}"/>`,
  wardrobe: `<path d="M11.5 5L5 9l3 5.5 3-2V27h10V12.5l3 2L27 9l-6.5-4c-1 2.3-2.6 3.5-4.5 3.5S12.5 7.3 11.5 5z" fill="${PINK}"/><path d="M13 15h6" stroke="#fff" stroke-opacity=".7"/>`,
  worlds:
    `<ellipse cx="16" cy="24.5" rx="13" ry="4.5" fill="#7cc8f0"/>` +
    `<path d="M6.5 24c2-5.5 17-5.5 19 0z" fill="#f3d58a"/>` +
    `<path d="M15 21.5c0-5 1.5-9.5 4-12.5" fill="none" stroke-width="2.4"/>` +
    `<path d="M19 9c-3-3.5-8.5-2.5-9.5 1 3-1 6.5-1 9.5-1zM19 9c2-4 7.5-4.5 9.5-1-3.5 0-6.5 0-9.5 1zM19 9c1.5 3.5-.5 6.5-3 7.5-.3-3 .7-5.5 3-7.5z" fill="#5fbf4a"/>`,
  paw,
  'paw-light': pawIn(CREAM),
  trophy:
    `<path d="M10 8H6.5c0 4.5 2 6.5 4.5 6.5M22 8h3.5c0 4.5-2 6.5-4.5 6.5" fill="none"/>` +
    `<path d="M10 5h12v7a6 6 0 0 1-12 0z" fill="${GOLD}"/><rect x="14" y="18" width="4" height="4" fill="${GOLD}"/><rect x="9.5" y="22" width="13" height="5" rx="1.5" fill="${GOLD}"/>`,
  missions:
    `<rect x="7" y="6" width="18" height="22" rx="3" fill="${CREAM}"/><rect x="11.5" y="3.5" width="9" height="5" rx="1.5" fill="${PINK}"/>` +
    `<path d="M11.5 17.5l3.5 3.5 6.5-7.5" stroke="#18a597" stroke-width="2.8" fill="none"/>`,
  gift:
    `<rect x="6" y="14" width="20" height="13" rx="2" fill="${PINK}"/><rect x="4.5" y="9.5" width="23" height="5" rx="1.5" fill="${PINK}"/>` +
    `<rect x="14" y="9.5" width="4" height="17.5" fill="${GOLD}"/>` +
    `<path d="M16 9.5c-2-4-7.5-5-7.5-2s4.5 2 7.5 2zM16 9.5c2-4 7.5-5 7.5-2s-4.5 2-7.5 2z" fill="${GOLD}"/>`,
  'gift-empty':
    `<rect x="6" y="14" width="20" height="13" rx="2" fill="#e7d9f3"/><path d="M6 14l3-6h18l-1 6" fill="#f3ecfa"/>` +
    `<path d="M11 20h10" stroke-opacity=".4"/>`,
  lock:
    `<path d="M11 14v-3a5 5 0 0 1 10 0v3" fill="none" stroke-width="2.8"/><rect x="8" y="14" width="16" height="13" rx="3" fill="${GOLD}"/>` +
    `<circle cx="16" cy="19.5" r="1.9" fill="${PLUM}" stroke="none"/><rect x="15.1" y="20" width="1.8" height="4" fill="${PLUM}" stroke="none"/>`,
  check: `<circle cx="16" cy="16" r="12" fill="${TEAL}"/><path d="M10 16.5l4 4 8-9" stroke="#fff" stroke-width="3.2" fill="none"/>`,
  star: star(),
  'medal-0': `<circle cx="16" cy="20" r="8.5" fill="#f1eaf8" stroke="#c9bcd6" stroke-dasharray="3 2.5"/>`,
  'medal-1': medal('#d48a4c'),
  'medal-2': medal('#d9dde3'),
  'medal-3': medal(GOLD),
  bell: `<path d="M16 5a7 7 0 0 0-7 7v5l-2.5 4h19L23 17v-5a7 7 0 0 0-7-7z" fill="${GOLD}"/><circle cx="16" cy="24.5" r="2.6" fill="${GOLD}"/>`,
  flag:
    '<path d="M8 4v24" stroke-width="2.6"/><rect x="8" y="5" width="17" height="12" fill="#fff"/>' +
    '<g fill="#2a1530" stroke="none"><rect x="9" y="6" width="3.6" height="4.5"/><rect x="16.2" y="6" width="3.6" height="4.5"/>' +
    '<rect x="12.6" y="11.5" width="3.6" height="4.5"/><rect x="19.8" y="11.5" width="3.6" height="4.5"/></g>',
  ticket:
    `<path d="M5 10a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6z" fill="${PINK}"/>` +
    `<path d="M20 9v14" stroke="#fff" stroke-dasharray="2 2"/><path d="M12.5 12l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="${GOLD}" stroke-width="1.2"/>`,
  dog: dogHead(),
  breeds: `<g transform="translate(-6 3) scale(.8)">${dogHead('#e8b264', '#fff3d6')}</g><g transform="translate(9.5 1) scale(.8)">${dogHead()}</g>`,
  sparkle:
    `<path d="M14 3c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z" fill="${GOLD}"/>` +
    `<path d="M25 20c.5 3 1.5 4 4 4.5-2.5.5-3.5 1.5-4 4.5-.5-3-1.5-4-4-4.5 2.5-.5 3.5-1.5 4-4.5z" fill="${PINK}" stroke-width="1.6"/>`,
  party:
    `<path d="M5 28l5.5-15.5 9.5 9.5z" fill="${GOLD}"/><path d="M8.5 18.5l4.5 4.5" stroke-opacity=".5"/>` +
    `<path d="M15 9c1-3 4-3 4-6M21 13c3-1 5 1 8-1" fill="none" stroke="${PINK}" stroke-width="2.2"/>` +
    `<circle cx="22" cy="6" r="1.7" fill="${TEAL}" stroke="none"/><circle cx="27" cy="18" r="1.7" fill="#3a86f0" stroke="none"/><rect x="24" y="8.5" width="3" height="3" fill="${PINK}" stroke="none" transform="rotate(25 25.5 10)"/>`,
  backpack:
    `<path d="M13 9V7a3 3 0 0 1 6 0v2" fill="none"/><rect x="7.5" y="9" width="17" height="18.5" rx="5" fill="${PINK}"/>` +
    `<rect x="11" y="18.5" width="10" height="6.5" rx="2" fill="#ff9ccb"/><path d="M8 15h16"/>`,
  noads:
    `<circle cx="16" cy="16" r="12" fill="#fff"/><rect x="9" y="11" width="14" height="10" rx="2" fill="#c8ecff"/>` +
    `<circle cx="16" cy="16" r="12" fill="none" stroke="#e5484d" stroke-width="3"/><path d="M7.5 7.5l17 17" stroke="#e5484d" stroke-width="3"/>`,
  collar:
    `<ellipse cx="16" cy="13" rx="11" ry="6.5" fill="none" stroke-width="6.5"/><ellipse cx="16" cy="13" rx="11" ry="6.5" fill="none" stroke="${GOLD}" stroke-width="3.2"/>` +
    `<circle cx="16" cy="22.5" r="4" fill="${GOLD}"/>`,
  bag:
    `<path d="M8 11h16l2 16H6z" fill="#fff3d6"/><path d="M8 11l2-4.5h12L24 11" fill="#f3e2b8"/>` +
    biscuit(16, 19.5, 4.8),
  barrel:
    `<path d="M9 4.5h14c2.5 4.5 2.5 18.5 0 23H9c-2.5-4.5-2.5-18.5 0-23z" fill="${WOOD}"/>` +
    `<path d="M7.6 10.5h16.8M7.6 21.5h16.8" stroke-width="2.4"/>` +
    biscuit(16, 4.5, 3.4),
  pouch:
    `<path d="M10 12c-4.5 4-4.5 15.5 6 15.5s10.5-11.5 6-15.5z" fill="${WOOD}"/><path d="M11 12c2.5-2.2 7.5-2.2 10 0" fill="none"/>` +
    `<path d="M12 9.5l4 2.5 4-2.5" fill="none"/><g transform="translate(9 15) scale(.45)">${outlined(boneShapes, GOLD)}</g>`,
  box:
    `<rect x="5" y="12" width="22" height="15" rx="2" fill="${TAN}"/><path d="M5 12l3.5-5h15L27 12" fill="#f3c97f"/><path d="M5 17h22" stroke-opacity=".5"/>` +
    `<g transform="translate(9.5 18.5) scale(.4)">${outlined(boneShapes, GOLD)}</g>`,
  crate:
    `<path d="M4 15a12 7 0 0 1 24 0z" fill="#d79a5b"/><rect x="4" y="15" width="24" height="12" rx="2" fill="${WOOD}"/>` +
    `<rect x="14" y="10" width="4" height="17" fill="${GOLD}"/><rect x="13.5" y="16" width="5" height="5" rx="1" fill="${GOLD}"/>`,
  dust: `<circle cx="11" cy="19" r="6" fill="#ece4f4"/><circle cx="19" cy="15" r="7" fill="#ece4f4"/><circle cx="23" cy="21" r="5" fill="#ece4f4"/>`,
  hearts: `<path d="M16 27S5 20 5 12.5A5.5 5.5 0 0 1 16 10a5.5 5.5 0 0 1 11 2.5C27 20 16 27 16 27z" fill="${PINK}"/><path d="M9.5 12a3 3 0 0 1 3-3" stroke="#fff" stroke-opacity=".7" fill="none"/>`,
  bubbles: `<circle cx="12" cy="18" r="7.5" fill="#c8ecff"/><circle cx="22.5" cy="10" r="5" fill="#c8ecff"/><circle cx="23.5" cy="23.5" r="3.5" fill="#c8ecff"/><path d="M8 15a4.5 4.5 0 0 1 3-3" stroke="#fff" fill="none"/>`,
  rainbow:
    '<path d="M8 25a8 8 0 0 1 16 0" fill="none" stroke-width="11.5"/>' +
    '<path d="M8 25a8 8 0 0 1 16 0" fill="none" stroke="#fff8ee" stroke-width="8"/>' +
    '<path d="M5.5 25a10.5 10.5 0 0 1 21 0" fill="none" stroke="#e5484d" stroke-width="2.4"/>' +
    '<path d="M8 25a8 8 0 0 1 16 0" fill="none" stroke="#ffd23f" stroke-width="2.4"/>' +
    '<path d="M10.5 25a5.5 5.5 0 0 1 11 0" fill="none" stroke="#2fd0c0" stroke-width="2.4"/>',
  play: `<path d="M11 6.5l14.5 9.5L11 25.5z" fill="${PINK}"/>`,
  todo: `<circle cx="16" cy="16" r="10" fill="#fff" stroke="#c9bcd6" stroke-width="2.6"/>`,
  dot: `<circle cx="16" cy="16" r="4" fill="#c9bcd6" stroke="none"/>`,
}

export type IconName = keyof typeof ICONS
