// One-time PWA icon generator (not part of the build). Run: node scripts/generate-pwa-icons.mjs
// Regenerate only if the brand icon changes. Uses sharp (installed ad hoc, not a
// committed dependency: `npm install -D --no-save sharp`).
import sharp from 'sharp'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, 'public')

// Brand navy per src/theme/tokens.ts (brand.600 #013c68), white Z monogram.
// The maskable variant keeps the glyph inside the inner safe zone (~80%).
const svg = (fontSize) =>
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#013c68"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="sans-serif" font-weight="800" font-size="${fontSize}"
    fill="#ffffff">Z</text>
</svg>`)

const targets = [
  { file: 'pwa-192.png', size: 192, fontSize: 300 },
  { file: 'pwa-512.png', size: 512, fontSize: 300 },
  { file: 'pwa-maskable-192.png', size: 192, fontSize: 240 },
  { file: 'pwa-maskable-512.png', size: 512, fontSize: 240 },
  { file: 'apple-touch-icon.png', size: 180, fontSize: 300 },
]

for (const t of targets) {
  await sharp(svg(t.fontSize)).resize(t.size, t.size).png().toFile(path.join(outDir, t.file))
  console.log('wrote', t.file)
}
