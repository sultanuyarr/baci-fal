/**
 * Kahve falı görüntü analizini gözle denetlemek için.
 * Tespit edilen fincan dairesini kırmızı, telve maskesini yeşil boyar.
 *
 * Kullanım: node scripts/kahve-denetim.mjs <fotograf.jpg> [...] [--cikti yol.png]
 * Varsayılan çıktı: /tmp/fincan-denetim.png
 */
import sharp from 'sharp'
import { basename } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { tamponuAnalizEt } from '../lib/kahve/cozucu-node.ts'

const argumanlar = process.argv.slice(2)
const ciktiIndeksi = argumanlar.indexOf('--cikti')
const ciktiYolu = ciktiIndeksi >= 0 ? argumanlar[ciktiIndeksi + 1] : '/tmp/fincan-denetim.png'
const yollar = ciktiIndeksi >= 0 ? argumanlar.filter((_, i) => i !== ciktiIndeksi && i !== ciktiIndeksi + 1) : argumanlar
if (!yollar.length) {
  console.error('En az bir fotoğraf yolu ver.')
  process.exit(1)
}

const GENISLIK = 300
const kareler = []

for (const yol of yollar) {
  const girdi = readFileSync(yol)
  const a = await tamponuAnalizEt(girdi)

  // Analizin gerçekten üzerinde çalıştığı görüntüyü kullan; böylece bindirme
  // ölçümlerle birebir aynı koordinatlarda olur.
  const { gri, maske } = a.gorsel
  const g = a.genislik
  const y = a.yukseklik
  const rgb = Buffer.alloc(g * y * 3)
  for (let p = 0; p < g * y; p++) rgb[p * 3] = rgb[p * 3 + 1] = rgb[p * 3 + 2] = gri[p]

  const { merkez, yaricap } = a.fincan
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < g; i++) {
      const d = Math.hypot(i - merkez.x, j - merkez.y)
      const p = (j * g + i) * 3
      if (Math.abs(d - yaricap) < 1.4) {
        rgb[p] = 255
        rgb[p + 1] = 40
        rgb[p + 2] = 40
      } else if (d > yaricap) {
        rgb[p + 2] = Math.min(255, rgb[p + 2] + 70)
      } else if (maske[j * g + i]) {
        rgb[p + 1] = Math.min(255, rgb[p + 1] + 90)
      }
    }
  }

  kareler.push(
    await sharp(rgb, { raw: { width: g, height: y, channels: 3 } })
      .resize({ width: GENISLIK })
      .png()
      .toBuffer(),
  )

  console.log(
    basename(yol).padEnd(14),
    'yarıçap', yaricap.toFixed(0).padStart(3),
    '/ yarı-boy', (Math.min(g, y) / 2).toFixed(0),
    '| eşik', String(a.esik).padStart(3),
    '| doluluk %' + (a.doluluk * 100).toFixed(0).padStart(2),
    '| en büyük leke %' + ((a.lekeler[0]?.alanOrani ?? 0) * 100).toFixed(1),
    '| leke', a.lekeSayisi,
  )
}

const yukseklikler = await Promise.all(kareler.map(async (k) => (await sharp(k).metadata()).height))
const yukseklik = Math.max(...yukseklikler)
const birlesik = await sharp({
  create: { width: GENISLIK * kareler.length, height: yukseklik, channels: 3, background: '#000' },
})
  .composite(kareler.map((input, i) => ({ input, top: 0, left: i * GENISLIK })))
  .png()
  .toBuffer()

writeFileSync(ciktiYolu, birlesik)
console.log('→', ciktiYolu)
