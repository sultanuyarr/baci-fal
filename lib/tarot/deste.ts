/**
 * 78 kartlık desteyi kurar.
 *
 * İki katman birleşir:
 *  1. Kaynak veri — Mark McElroy, "A Guide to Tarot Card Meanings"
 *     (dariusk/corpora üzerinden, data/tarot_interpretations.json).
 *     Her kartın anahtar kelimeleri, aydınlık/gölge anlamları ve fal cümleleri.
 *  2. Türkçe okuma katmanı — data/tr/*.json: kart adı, düz/ters yorum,
 *     aşk/kariyer/para başlıkları ve evet-hayır değeri.
 *
 * Görseller Rider-Waite-Smith (1909) destesinden, kamu malı.
 */
import kaynak from '@/data/tarot_interpretations.json'
import majorTr from '@/data/tr/major.json'
import wandsTr from '@/data/tr/wands.json'
import cupsTr from '@/data/tr/cups.json'
import swordsTr from '@/data/tr/swords.json'
import coinsTr from '@/data/tr/coins.json'

export type Takim = 'major' | 'wands' | 'cups' | 'swords' | 'coins'

export type EvetHayir = 'evet' | 'hayir' | 'belki'

export type TurkceKart = {
  ad: string
  anahtar: string[]
  duz: string
  ters: string
  ask: string
  kariyer: string
  para: string
  evetHayir: EvetHayir
}

export type Kart = TurkceKart & {
  id: string
  takim: Takim
  /** Majörlerde 0-21, minörlerde 1-14 (11 prens, 12 şövalye, 13 kraliçe, 14 kral) */
  sira: number
  gorsel: string
  /** Kaynak veri setinden — İngilizce özgün anlamlar */
  kaynak: {
    ad: string
    anahtarKelimeler: string[]
    falCumleleri: string[]
    aydinlik: string[]
    golge: string[]
  }
}

export const TAKIM_ADI: Record<Takim, string> = {
  major: 'Majör Arkana',
  wands: 'Asalar',
  cups: 'Kupalar',
  swords: 'Kılıçlar',
  coins: 'Tılsımlar',
}

/** Her takımın ilgi alanı; açılım özetinde baskın temayı adlandırmak için. */
export const TAKIM_TEMASI: Record<Takim, string> = {
  major: 'kaderin büyük dönemeçleri ve ders niteliğindeki olaylar',
  wands: 'hareket, tutku, girişim ve yaratıcı enerji',
  cups: 'duygular, ilişkiler ve sezgi',
  swords: 'zihin, iletişim, gerçekler ve çatışma',
  coins: 'para, iş, sağlık ve somut olan her şey',
}

const MERTEBE_SAYISI: Record<string, number> = { page: 11, knight: 12, queen: 13, king: 14 }

const TR_KATMAN: Record<string, TurkceKart> = {
  ...(majorTr as Record<string, TurkceKart>),
  ...(wandsTr as Record<string, TurkceKart>),
  ...(cupsTr as Record<string, TurkceKart>),
  ...(swordsTr as Record<string, TurkceKart>),
  ...(coinsTr as Record<string, TurkceKart>),
}

type KaynakKart = {
  name: string
  rank: number | string
  suit: string
  keywords: string[]
  fortune_telling: string[]
  meanings: { light: string[]; shadow: string[] }
}

function kimlik(kart: KaynakKart): string {
  const sira = typeof kart.rank === 'number' ? kart.rank : MERTEBE_SAYISI[kart.rank]
  return `${kart.suit}-${String(sira).padStart(2, '0')}`
}

export const DESTE: Kart[] = (kaynak.tarot_interpretations as KaynakKart[]).map((k) => {
  const id = kimlik(k)
  const tr = TR_KATMAN[id]
  if (!tr) throw new Error(`Türkçe karşılığı eksik kart: ${id} (${k.name})`)
  return {
    ...tr,
    id,
    takim: k.suit as Takim,
    sira: typeof k.rank === 'number' ? k.rank : MERTEBE_SAYISI[k.rank],
    gorsel: `/tarot/${id}.jpg`,
    kaynak: {
      ad: k.name,
      anahtarKelimeler: k.keywords,
      falCumleleri: k.fortune_telling,
      aydinlik: k.meanings.light,
      golge: k.meanings.shadow,
    },
  }
})

export function karti(id: string): Kart | undefined {
  return DESTE.find((k) => k.id === id)
}
