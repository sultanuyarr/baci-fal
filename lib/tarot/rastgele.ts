/**
 * Tohumlanmış sayı üreteci.
 *
 * Tarot açılımı rastgele görünür ama keyfî değildir: aynı isim, aynı doğum
 * tarihi, aynı soru ve aynı gün için deste hep aynı şekilde karılır. Böylece
 * kullanıcı sayfayı yenilediğinde falı değişmez; yeni bir açılım istemesi için
 * bilinçli olarak "yeniden karıştır" demesi gerekir.
 */

/** xmur3 — metinden 32 bitlik tohum üretir. */
export function tohumla(metin: string): number {
  let h = 1779033703 ^ metin.length
  for (let i = 0; i < metin.length; i++) {
    h = Math.imul(h ^ metin.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

/** mulberry32 — hızlı, tekrarlanabilir sözde rastgele üreteç. */
export function uretec(tohum: number): () => number {
  let a = tohum >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates — her dizilimin eşit olasılıkla çıktığı karıştırma. */
export function karistir<T>(dizi: T[], rast: () => number): T[] {
  const sonuc = [...dizi]
  for (let i = sonuc.length - 1; i > 0; i--) {
    const j = Math.floor(rast() * (i + 1))
    ;[sonuc[i], sonuc[j]] = [sonuc[j], sonuc[i]]
  }
  return sonuc
}
