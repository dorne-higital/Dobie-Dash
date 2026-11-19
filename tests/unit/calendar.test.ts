import { describe, expect, it } from 'vitest'
import eventsFile from '~/content/events.json'
import items from '~/content/items.json'
import store from '~/content/store.json'
import worlds from '~/content/worlds.json'
import { loadGameConfig, type GameEvent } from '~/game/config'
import { recordOf, replay } from '~/game/replay'
import { Run } from '~/game/run'
import { configFingerprint } from '~/game/server'
import {
  activeEvent,
  EVENTS,
  eventDaysLeft,
  isOn,
  nextReward,
  recordPresents,
} from '~/logic/calendar'
import { item } from '~/logic/items'
import { applyOverrides, type ContentFiles } from '~/logic/remote'
import { defaultSave } from '~/logic/save'

const winter = () => structuredClone(EVENTS.find((e) => e.id === 'winter')!) as GameEvent
const at = (iso: string) => new Date(iso)

describe('Winter Walkies dates', () => {
  it('is on from its start date until (not including) its end date, UTC', () => {
    const w = winter()
    expect(isOn(w, at(`${w.start}T00:00:00Z`))).toBe(true)
    expect(isOn(w, new Date(Date.parse(`${w.start}T00:00:00Z`) - 1))).toBe(false)
    expect(isOn(w, new Date(Date.parse(`${w.end}T00:00:00Z`) - 1))).toBe(true)
    expect(isOn(w, at(`${w.end}T00:00:00Z`))).toBe(false)
    expect(activeEvent(at('2026-12-15T12:00:00Z'))?.id).toBe('winter')
    expect(activeEvent(at('2026-11-19T12:00:00Z'))).toBeNull()
    expect(eventDaysLeft(w, at(`${w.start}T00:00:00Z`))).toBeGreaterThan(30)
  })
  it('can be switched off', () => {
    const w = { ...winter(), off: true }
    expect(isOn(w, at('2026-12-15T12:00:00Z'))).toBe(false)
  })
  it('only rewards items that exist', () => {
    for (const r of winter().rewards) expect(item(r.item), r.item).toBeTruthy()
    expect(winter().rewards.map((r) => r.item)).toEqual(['hat:santa', 'hat:antlers', 'trail:snow'])
  })
})

describe('remote config: event dates', () => {
  const files = () =>
    structuredClone({ worlds, items, store, events: eventsFile }) as unknown as ContentFiles & {
      events: { events: GameEvent[] }
    }
  it('moves an event, or switches it off', () => {
    const f = files()
    expect(
      applyOverrides(f, { events: { winter: { start: '2026-11-20', end: '2026-11-27' } } }),
    ).toEqual([])
    const w = f.events.events[0]!
    expect(isOn(w, at('2026-11-22T10:00:00Z'))).toBe(true)
    expect(applyOverrides(f, { events: { winter: { off: true } } })).toEqual([])
    expect(isOn(f.events.events[0]!, at('2026-11-22T10:00:00Z'))).toBe(false)
  })
  it('refuses unknown events, bad dates and an end before the start', () => {
    const f = files()
    const before = structuredClone(f.events)
    expect(applyOverrides(f, { events: { easter: { start: '2027-04-01' } } })).toEqual([
      'events.easter: no such event',
    ])
    expect(applyOverrides(f, { events: { winter: { start: 'soon' } } })).toEqual(['events.winter'])
    expect(
      applyOverrides(f, { events: { winter: { start: '2027-01-10', end: '2027-01-01' } } }),
    ).toEqual(['events.winter'])
    expect(f.events).toEqual(before)
  })
  it('moving the dates does not change the gameplay fingerprint (scores still check)', () => {
    const cfg = loadGameConfig()
    const moved = {
      ...cfg,
      events: cfg.events.map((e) => ({ ...e, start: '2030-01-01', end: '2030-02-01' })),
    }
    expect(configFingerprint(moved)).toBe(configFingerprint(cfg))
    const richer = { ...cfg, events: cfg.events.map((e) => ({ ...e, presents: { chance: 0.5 } })) }
    expect(configFingerprint(richer)).not.toBe(configFingerprint(cfg))
  })
})

describe('presents', () => {
  it('rewards come at 10, 30 and 60 presents, once each', () => {
    const s = defaultSave()
    const w = winter()
    expect(recordPresents(s, w, 9)).toEqual([])
    expect(nextReward(s, w)?.item).toBe('hat:santa')
    expect(recordPresents(s, w, 1)).toEqual(['hat:santa'])
    expect(recordPresents(s, w, 50)).toEqual(['hat:antlers', 'trail:snow'])
    expect(nextReward(s, w)).toBeNull()
    expect(recordPresents(s, w, 100)).toEqual([])
    expect(s.owned).toEqual(expect.arrayContaining(['hat:santa', 'hat:antlers', 'trail:snow']))
  })
  it('progress from another event starts again', () => {
    const s = defaultSave()
    s.event = { id: 'halloween', presents: 99, claimed: ['x'] }
    recordPresents(s, winter(), 3)
    expect(s.event).toEqual({ id: 'winter', presents: 3, claimed: [] })
  })
})

describe('presents in a run', () => {
  const cfg = loadGameConfig()
  function play(event?: string) {
    const run = new Run(cfg, 21, 420, { autoplay: true, event })
    for (let i = 0; i < 60 * 120 && run.state === 'running'; i++) run.update()
    return run
  }
  it('only appear during an event, and the course is the same either way', () => {
    const off = play()
    const on = play('winter')
    expect(off.presents).toBe(0)
    expect(on.presents).toBeGreaterThan(3)
    // Same obstacles, same score: a present scores exactly like a biscuit.
    expect(on.summary().score).toBe(off.summary().score)
    expect(on.summary().biscuits).toBe(off.summary().biscuits)
  })
  it('a run with presents replays exactly', () => {
    const run = play('winter')
    run.opts.autoplay = false
    for (let i = 0; i < 60 * 600 && run.state !== 'ended'; i++) {
      if (run.state === 'offer') run.decline()
      run.update()
    }
    const rec = recordOf(run, 420)
    expect(rec.opts.event).toBe('winter')
    expect(replay(cfg, rec).summary()).toEqual(run.summary())
  })
})
