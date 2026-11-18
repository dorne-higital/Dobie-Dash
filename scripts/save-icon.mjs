// Receives the icons from /appicon ("Save") and writes them:
//   iOS App Store icon 1024×1024 (no transparency, Apple rejects it),
//   public/apple-touch-icon.png 180 (no transparency), public/icon-512.png,
//   public/favicon.png 64 and public/favicon.ico 32 (rounded corners).
// Run `npm run icon`, open localhost:3000/appicon, press Save.
import { createServer } from 'node:http'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const tmp = mkdtempSync(join(tmpdir(), 'dobie-icon-'))
const png = (dataUrl) => Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')

/** Writes a PNG with its alpha channel removed (round trip through JPEG with macOS sips). */
function opaque(name, dataUrl, out) {
  writeFileSync(join(tmp, `${name}.png`), png(dataUrl))
  execFileSync('sips', [
    '-s',
    'format',
    'jpeg',
    '-s',
    'formatOptions',
    '100',
    join(tmp, `${name}.png`),
    '--out',
    join(tmp, `${name}.jpg`),
  ])
  execFileSync('sips', ['-s', 'format', 'png', join(tmp, `${name}.jpg`), '--out', out])
  console.log('saved', out)
}

const server = createServer((req, res) => {
  let body = ''
  req.on('data', (d) => (body += d))
  req.on('end', () => {
    const f = JSON.parse(body)
    opaque('ios', f.ios, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
    opaque('touch', f.touch, 'public/apple-touch-icon.png')
    writeFileSync('public/icon-512.png', png(f.icon512))
    writeFileSync('public/favicon.png', png(f.favicon))
    writeFileSync(join(tmp, 'fav32.png'), png(f.favicon32))
    execFileSync('sips', [
      '-s',
      'format',
      'ico',
      join(tmp, 'fav32.png'),
      '--out',
      'public/favicon.ico',
    ])
    console.log('saved public/icon-512.png, public/favicon.png, public/favicon.ico')
    res.end('ok')
    server.close()
  })
})
server.listen(8765, '127.0.0.1', () => console.log('Waiting for /appicon to send the icons…'))
