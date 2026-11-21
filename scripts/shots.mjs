// Captures the five App Store screenshots (M8) at the 6.9-inch iPhone size, 1320×2868:
// the Chrome on this Mac (via puppeteer-core), a 440×956 viewport at 3× scale, loading
// /shots?n=1…5 from a running dev server. Writes store/screenshots/01-….png.
//   npm run dev   (in another terminal)
//   npm run shots            (all five)   npm run shots -- 5   (just one)
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'
import shots from '../content/shots.json' with { type: 'json' }

const base = process.env.SHOTS_URL ?? 'http://localhost:3000'
const only = process.argv.slice(2).map(Number)
const out = 'store/screenshots'
mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  for (const c of shots.captions.filter((c) => !only.length || only.includes(c.n))) {
    const slug = c.title
      .toLowerCase()
      .replace(/[^a-z]+/g, '-')
      .replace(/-$/, '')
    const file = join(out, `0${c.n}-${slug}.png`)
    // A fresh browser context each time, so no save carries over between shots.
    const ctx = await browser.createBrowserContext()
    const page = await ctx.newPage()
    await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3, isMobile: true })
    await page.goto(`${base}/shots?n=${c.n}`, { waitUntil: 'load' })
    // Let the app load in its frame, play to its moment and freeze.
    await new Promise((r) => setTimeout(r, 7000))
    await page.screenshot({ path: file })
    await ctx.close()
    console.log('wrote', file)
  }
} finally {
  await browser.close()
}
