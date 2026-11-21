// App Review screenshots for the in-app purchases (M8): the real Shop and dog maker at
// iPhone size (1320×2868), from a running dev server, into store/iap-review/.
//   shop-top.png     Remove Ads, Starter Pack, Pup Pass, Gold Collar, Every Breed, Party Pack
//   shop-packs.png   biscuit and Golden Bone packs
//   breed.png        a locked breed in My dog with its £0.99 / Every breed buttons
//   npm run dev   (in another terminal)
//   node scripts/iap-review-shots.mjs
import { mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.SHOTS_URL ?? 'http://localhost:3000'
const out = 'store/iap-review'
mkdirSync(out, { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3, isMobile: true })

  await page.goto(`${base}/closet/store?shot=iap`, { waitUntil: 'load' })
  await wait(6000)
  await page.screenshot({ path: `${out}/shop-top.png` })
  // Scroll every scrolling box to the bottom for the packs.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*'))
      if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight
    window.scrollTo(0, document.body.scrollHeight)
  })
  await wait(800)
  await page.screenshot({ path: `${out}/shop-packs.png` })

  await page.goto(`${base}/closet/dog?shot=iap`, { waitUntil: 'load' })
  await wait(5000)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent?.includes('Labrador'),
    )
    b?.click()
  })
  await wait(1200)
  await page.screenshot({ path: `${out}/breed.png` })
  console.log('wrote', out)
} finally {
  await browser.close()
}
