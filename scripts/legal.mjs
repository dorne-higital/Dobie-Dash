// Privacy policy and support pages (M8), from store/privacy-policy.md and store/support.md
// (the part below the first `---`). Writes:
//   content/legal.json                         the in-app /privacy and /support pages
//   ../danhorne/public/dobie-dash/…/index.html  static pages on danhorne.co.uk (Netlify),
//                                               live when the danhorne repo is pushed
//   npm run legal
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s)<]+[^\s)<.,])/g, '<a href="$1">$1</a>')
    .replace(/(?<![\w/.])((?:www\.)?danhorne\.co\.uk\/[\w/-]+)/g, '<a href="https://$1">$1</a>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+\w)/g, '<a href="mailto:$1">$1</a>')

/** A small Markdown subset: ## headings, paragraphs, - / • lists, **bold**, links. */
function html(md) {
  const body = md
    .split(/\n---\n/)
    .slice(1)
    .join('\n---\n')
    .trim()
  return body
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n')
      if (lines[0].startsWith('## ')) return `<h2>${inline(lines[0].slice(3))}</h2>`
      if (/^[-•] /.test(lines[0])) {
        const items = []
        for (const l of lines)
          if (/^[-•] /.test(l)) items.push(l.slice(2))
          else items[items.length - 1] += ' ' + l.trim()
        return `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
      }
      return `<p>${inline(lines.join(' '))}</p>`
    })
    .join('\n')
}

const pages = {
  privacy: { title: 'Privacy policy', html: html(readFileSync('store/privacy-policy.md', 'utf8')) },
  support: { title: 'Help and support', html: html(readFileSync('store/support.md', 'utf8')) },
}
writeFileSync('content/legal.json', JSON.stringify(pages, null, 2) + '\n')
console.log('wrote content/legal.json')

const site = '../danhorne/public/dobie-dash'
if (!existsSync('../danhorne/public')) {
  console.log('No ../danhorne repo here: skipped the website pages.')
  process.exit(0)
}
const page = (title, inner) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="/dobie-dash/icon.png">
<style>
:root{--bg:#f6f1fb;--fg:#22142c;--muted:#6c5d78;--pink:#e0338a;--card:#fff;--line:#e4daee}
@media (prefers-color-scheme:dark){:root{--bg:#1d1024;--fg:#f6eefa;--muted:#bfaecb;--pink:#ff6fb4;--card:#2a1530;--line:#3d2547}}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:680px;margin:0 auto;padding:32px max(18px,env(safe-area-inset-left)) 64px}
header{display:flex;align-items:center;gap:14px;margin-bottom:8px}
header img{width:64px;height:64px;border-radius:15px}
header a{color:inherit;text-decoration:none;font-weight:800;font-size:20px}
h1{font-size:32px;line-height:1.15;margin:22px 0 10px}
h2{font-size:21px;margin:30px 0 6px}
a{color:var(--pink)}
ul{padding-left:22px}
li{margin:4px 0}
code{font-size:.9em}
nav{display:flex;gap:16px;flex-wrap:wrap;margin-top:40px;padding-top:18px;border-top:1px solid var(--line);font-size:15px}
.badge{display:inline-block;margin-top:12px;background:var(--fg);color:var(--bg);padding:10px 18px;border-radius:12px;font-weight:700;text-decoration:none}
</style>
</head>
<body><main>
<header><img src="/dobie-dash/icon.png" alt=""><a href="/dobie-dash/">Dobie Dash</a></header>
${inner}
<nav><a href="/dobie-dash/">Dobie Dash</a><a href="/dobie-dash/support/">Help and support</a><a href="/dobie-dash/privacy/">Privacy policy</a><a href="/">danhorne.co.uk</a></nav>
</main></body>
</html>
`
const home = `<h1>Dobie Dash</h1>
<p>A one-tap endless runner starring your own dog. Run through eight worlds, eat biscuits, dress up your dog and stomp the bosses. Free on iPhone.</p>
<p><a class="badge" href="https://apps.apple.com/app/id6836275397">Get it on the App Store</a></p>`
for (const [dir, title, inner] of [
  ['', 'Dobie Dash', home],
  ['support', 'Dobie Dash · Help and support', pages.support.html],
  ['privacy', 'Dobie Dash · Privacy policy', `<h1>Privacy policy</h1>\n${pages.privacy.html}`],
]) {
  mkdirSync(`${site}/${dir}`, { recursive: true })
  writeFileSync(`${site}/${dir}/index.html`.replace('//', '/'), page(title, inner))
}
writeFileSync(`${site}/icon.png`, readFileSync('public/icon-512.png'))
console.log('wrote', site)
