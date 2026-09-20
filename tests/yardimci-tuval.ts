/** Testler için sentetik fincan fotoğrafı üreten küçük bir tuval. */
import sharp from 'sharp'

export const N = 600
export const R = 280
export const C = N / 2

export function tuval(): Uint8Array {
  const px = new Uint8Array(N * N).fill(30)
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) if (Math.hypot(i - C, j - C) <= R) px[j * N + i] = 235
  return px
}

export function koy(px: Uint8Array, x: number, y: number) {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (xi >= 0 && yi >= 0 && xi < N && yi < N) px[yi * N + xi] = 20
}

export function daire(px: Uint8Array, cx: number, cy: number, r: number) {
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) if (Math.hypot(i - cx, j - cy) <= r) koy(px, i, j)
}

export function halka(px: Uint8Array, cx: number, cy: number, r: number, kalinlik: number) {
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      const d = Math.hypot(i - cx, j - cy)
      if (d <= r && d >= r - kalinlik) koy(px, i, j)
    }
}

export function cizgi(px: Uint8Array, x1: number, y1: number, x2: number, y2: number, k: number) {
  const adim = Math.round(Math.hypot(x2 - x1, y2 - y1) * 2)
  for (let s = 0; s <= adim; s++) {
    const t = s / adim
    daire(px, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), k)
  }
}

export function yay(px: Uint8Array, cx: number, cy: number, r: number, a1: number, a2: number, k: number) {
  for (let s = 0; s <= 400; s++) {
    const a = a1 + ((a2 - a1) * s) / 400
    daire(px, Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), k)
  }
}

export function ucgen(px: Uint8Array, cx: number, cy: number, r: number) {
  const p = [0, 1, 2].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  })
  const alan = (a: readonly number[], b: readonly number[], c: readonly number[]) =>
    Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]))
  const A = alan(p[0], p[1], p[2])
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      const q = [i, j] as const
      if (Math.abs(alan(q, p[1], p[2]) + alan(p[0], q, p[2]) + alan(p[0], p[1], q) - A) < 1) koy(px, i, j)
    }
}

export async function pngYap(px: Uint8Array): Promise<Buffer> {
  return sharp(Buffer.from(px), { raw: { width: N, height: N, channels: 1 } }).png().toBuffer()
}
