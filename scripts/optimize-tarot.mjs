/** Indirilen kart gorsellerini web icin kucultur (420px genislik, progressive jpeg). */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const IMGDIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'tarot')
const TARGET_WIDTH = 420

const files = (await readdir(IMGDIR)).filter((f) => f.endsWith('.jpg'))
let before = 0
let after = 0
for (const f of files) {
  const p = join(IMGDIR, f)
  before += (await stat(p)).size
  const meta = await sharp(p).metadata()
  if (meta.width <= TARGET_WIDTH && meta.density === undefined) {
    // yine de yeniden sikistir
  }
  const out = await sharp(await readFile(p))
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer()
  await writeFile(p, out)
  after += out.length
}
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB'
console.log(`✓ ${files.length} gorsel optimize edildi: ${mb(before)} → ${mb(after)}`)
