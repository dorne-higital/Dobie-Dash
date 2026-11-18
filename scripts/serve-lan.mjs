// Serves the static build (.output/public) on your Wi-Fi so you can open it on your phone.
// Usage: npm run generate && npm run serve:lan   (or just: npm run phone)
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), '.output/public')
const port = Number(process.env.PORT) || 4173

if (!existsSync(root)) {
  console.error('No build found. Run `npm run generate` first.')
  process.exit(1)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  let file = normalize(join(root, decodeURIComponent(url.pathname)))
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  // SPA fallback for client-side routes such as /closet/outfits.
  if (!existsSync(file)) file = join(root, '200.html')
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  const immutable = file.includes(`${join(root, '_nuxt')}`)
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(file).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`\n  Dobie Dash build served on port ${port}\n`)
  console.log(`  This computer:  http://localhost:${port}/`)
  for (const list of Object.values(networkInterfaces()))
    for (const n of list ?? [])
      if (n.family === 'IPv4' && !n.internal)
        console.log(`  Your phone:     http://${n.address}:${port}/`)
  console.log(`\n  Add ?fps to any URL to show the frame-time overlay.\n`)
})
