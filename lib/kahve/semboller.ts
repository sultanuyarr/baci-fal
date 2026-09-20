/**
 * Telve lekelerini geleneksel kahve falı sembolleriyle eşleştirir.
 *
 * Eşleşme rastgele değil: her sembolün ölçülebilir bir geometrik imzası var
 * (dairesellik, uzama, doluluk, kıvrım, delik, alan). Bir lekenin ölçüleri
 * hangi imzaya ne kadar uyuyorsa o kadar puan alır. Aynı fotoğraf her zaman
 * aynı sembolleri verir.
 */
import sozluk from '@/data/kahve_semboller.json'
import type { Bolge, Leke } from './goruntu'

type Aralik = [number, number]

export type Sembol = {
  id: string
  ad: string
  emoji: string
  imza: Partial<Record<Olcut, Aralik>>
  bolge: Bolge[]
  anlam: string
}

type Olcut =
  | 'dairesellik'
  | 'uzama'
  | 'doluluk'
  | 'alanOrani'
  | 'kivrim'
  | 'dikeylik'
  | 'delik'
  | 'delikOrani'

export const SEMBOLLER = sozluk.semboller as Sembol[]

/** Ölçütlerin eşleşmedeki ağırlığı; ayırt ediciliği yüksek olanlar daha değerli. */
const AGIRLIK: Record<Olcut, number> = {
  dairesellik: 1.0,
  uzama: 1.0,
  kivrim: 1.0,
  delik: 1.2,
  delikOrani: 1.2,
  alanOrani: 0.9,
  doluluk: 0.7,
  dikeylik: 0.6,
}

/**
 * Bir değerin aralığa uyumu: içindeyse 1, dışındaysa uzaklıkla yumuşak düşer.
 * Böylece sınıra çok yakın ölçümler tamamen elenmez, sadece puan kaybeder.
 */
function uyum(deger: number, [alt, ust]: Aralik): number {
  if (deger >= alt && deger <= ust) return 1
  const genislik = Math.max(ust - alt, 1e-6)
  const uzaklik = deger < alt ? alt - deger : deger - ust
  const tolerans = genislik * 0.45 + genislik * 0.05
  return Math.exp(-((uzaklik / tolerans) ** 2))
}

/** Uzama ölçeği logaritmiktir; 2 ile 4 arasındaki fark 20 ile 22 arasındakinden büyüktür. */
function uzamaUyumu(deger: number, aralik: Aralik): number {
  const log = (v: number) => Math.log(Math.max(v, 1))
  return uyum(log(deger), [log(aralik[0]), log(aralik[1])])
}

export type SembolEslesmesi = {
  sembol: Sembol
  leke: Leke
  /** 0-1 arası eşleşme gücü */
  guven: number
}

function lekeyiPuanla(leke: Leke, sembol: Sembol): number {
  let agirlikToplam = 0
  let puanToplam = 0

  for (const [anahtar, aralik] of Object.entries(sembol.imza) as [Olcut, Aralik][]) {
    // Yuvarlağa yakın şekillerde eksen yönü anlamsızdır, dikeyliği atla.
    if (anahtar === 'dikeylik' && leke.uzama < 1.3) continue

    const deger = leke[anahtar] as number

    const u = anahtar === 'uzama' ? uzamaUyumu(deger, aralik) : uyum(deger, aralik)
    const a = AGIRLIK[anahtar]
    agirlikToplam += a
    puanToplam += a * u
  }

  if (agirlikToplam === 0) return 0
  let puan = puanToplam / agirlikToplam

  // Delik örtük bir ölçüttür: imzasında delik aralığı belirtmeyen bir sembol,
  // aslında "içi dolu" demektir. Delikli bir lekeyi ona atamak yanlış olur,
  // bu yüzden delik sayısıyla orantılı ceza uygulanır.
  if (sembol.imza.delik === undefined && leke.delik > 0) {
    puan /= 1 + 0.6 * leke.delik
  }

  // Sembolün geleneksel olarak okunduğu bölgede çıkması eşleşmeyi güçlendirir.
  // Puan burada tavanlanmaz: iki sembol de ölçütleri tam tutturduğunda
  // sıralamayı bölge uyumu belirlesin diye ham değer döner.
  return puan * (sembol.bolge.includes(leke.bolge) ? 1.12 : 0.9)
}

/**
 * Lekeleri büyükten küçüğe gezerek her birine en uygun sembolü atar.
 * Bir sembol iki kez kullanılmaz; böylece okuma tekrara düşmez.
 */
export function sembolleriEsle(lekeler: Leke[], enFazla = 5): SembolEslesmesi[] {
  const kullanilan = new Set<string>()
  const sonuc: SembolEslesmesi[] = []

  // Çok küçük lekeler tek başına anlam taşımaz; sadece belirgin olanlar okunur.
  const adaylar = lekeler.filter((l) => l.alanOrani >= 0.0009).slice(0, 14)

  for (const leke of adaylar) {
    if (sonuc.length >= enFazla) break

    let enIyi: { sembol: Sembol; puan: number } | null = null
    for (const sembol of SEMBOLLER) {
      if (kullanilan.has(sembol.id)) continue
      const puan = lekeyiPuanla(leke, sembol)
      // Eşitlikte daha çok ölçüt tanımlayan sembol kazanır: daha ayrıntılı
      // bir tarif, aynı puanı alan genel bir tariften daha bilgilendiricidir.
      const dahaIyi =
        !enIyi ||
        puan > enIyi.puan + 1e-9 ||
        (Math.abs(puan - enIyi.puan) <= 1e-9 &&
          Object.keys(sembol.imza).length > Object.keys(enIyi.sembol.imza).length)
      if (dahaIyi) enIyi = { sembol, puan }
    }

    // Hiçbir imzaya yeterince yaklaşamayan leke okunmaz, "şekilsiz telve"
    // sayılır. Eşik gerçek fincan fotoğraflarıyla kalibre edildi.
    if (!enIyi || enIyi.puan < 0.7) continue

    kullanilan.add(enIyi.sembol.id)
    sonuc.push({ sembol: enIyi.sembol, leke, guven: Math.min(1, enIyi.puan) })
  }

  return sonuc
}
