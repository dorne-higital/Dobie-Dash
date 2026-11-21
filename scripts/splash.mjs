// The iOS launch image (M8): renders /loader?still (the loader's first frame) at 2732×2732
// and writes the three Splash.imageset files. Xcode shows it aspect-fill, so on a phone it
// fits the screen height, which is why the loader sizes everything in % of height.
//   npm run dev   (in another terminal)
//   npm run splash
import puppeteer from 'puppeteer-core'

const base = process.env.SHOTS_URL ?? 'http://localhost:3000'
const dir = 'ios/App/App/Assets.xcassets/Splash.imageset'
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 2732, height: 2732, deviceScaleFactor: 1 })
  await page.goto(`${base}/loader?still`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 2500))
  for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
    await page.screenshot({ path: `${dir}/${f}` })
  console.log('wrote', dir)
} finally {
  await browser.close()
}
