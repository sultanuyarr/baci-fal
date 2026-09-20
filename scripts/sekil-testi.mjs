/**
 * Şekil betimleyicilerinin doğruluğunu sentetik fincanlarla sınar.
 * Beklenti: daire → dairesellik ~1, çizgi → uzama yüksek, halka → delik=1.
 */
import sharp from 'sharp'
import { fincaniAnalizEt } from '../lib/kahve/goruntu.ts'

const N = 600
const R = 280
const C = N / 2

/** Beyaz fincan diski üzerine siyah şekiller çizen basit tuval. */
function tuval() {
  const px = new Uint8Array(N * N).fill(30) // dış arka plan koyu
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++)
      if (Math.hypot(i - C, j - C) <= R) px[j * N + i] = 235 // porselen
  return px
}
const koy = (px, x, y) => {
  x = Math.round(x); y = Math.round(y)
  if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = 20
}
const daire = (px, cx, cy, r) => {
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) if (Math.hypot(i - cx, j - cy) <= r) koy(px, i, j)
}
const halka = (px, cx, cy, r, kalinlik) => {
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      const d = Math.hypot(i - cx, j - cy)
      if (d <= r && d >= r - kalinlik) koy(px, i, j)
    }
}
const cizgi = (px, x1, y1, x2, y2, kalinlik) => {
  const ad = Math.round(Math.hypot(x2 - x1, y2 - y1) * 2)
  for (let s = 0; s <= ad; s++) {
    const t = s / ad
    daire(px, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), kalinlik)
  }
}
const yay = (px, cx, cy, r, a1, a2, kalinlik) => {
  for (let s = 0; s <= 400; s++) {
    const a = a1 + ((a2 - a1) * s) / 400
    daire(px, cx + r * Math.cos(a), cy + r * Math.sin(a), kalinlik)
  }
}
const ucgen = (px, cx, cy, r) => {
  const p = [0, 1, 2].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
  const alan = (a, b, c) => Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))
  const A = alan(p[0], p[1], p[2])
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      const q = [i, j]
      if (Math.abs(alan(q,p[1],p[2])+alan(p[0],q,p[2])+alan(p[0],p[1],q) - A) < 1) koy(px, i, j)
    }
}

const senaryolar = {
  'dolu daire': (px) => daire(px, C, C, 55),
  'yatay çizgi': (px) => cizgi(px, C - 150, C, C + 150, C, 4),
  'dikey çizgi': (px) => cizgi(px, C, C - 150, C, C + 150, 4),
  'halka (yüzük)': (px) => halka(px, C, C, 60, 14),
  'üçgen': (px) => ucgen(px, C, C, 80),
  'kıvrımlı yay (yılan)': (px) => { yay(px, C - 50, C, 60, -1.2, 1.6, 5); yay(px, C + 55, C, 60, 1.9, 4.6, 5) },
  'hilal': (px) => yay(px, C, C, 70, -1.9, 1.9, 11),
  'küçük noktalar': (px) => { for (const [dx,dy] of [[-90,-60],[40,-80],[100,30],[-60,90],[10,10]]) daire(px, C+dx, C+dy, 9) },
}

for (const [ad, ciz] of Object.entries(senaryolar)) {
  const px = tuval()
  ciz(px)
  const jpg = await sharp(Buffer.from(px), { raw: { width: N, height: N, channels: 1 } }).png().toBuffer()
  const a = await fincaniAnalizEt(jpg)
  const l = a.lekeler[0]
  const f = (v) => v.toFixed(2)
  console.log(
    ad.padEnd(22),
    'leke:', String(a.lekeSayisi).padStart(2),
    '| dairesellik', f(l.dairesellik),
    '| uzama', f(l.uzama).padStart(5),
    '| doluluk', f(l.doluluk),
    '| konveks', f(l.konveksDoluluk),
    '| dikeylik', f(l.dikeylik),
    '| delik', l.delik,
    '| alanOranı', l.alanOrani.toFixed(4),
  )
}
