/**
 * Açılımdan somut olay tahminleri çıkarır.
 *
 * Bir kartın "ne söylediği" üç şeyin bileşimidir:
 *  1. Takımı — hangi hayat alanına bakıyor (asalar iş, kupalar duygu,
 *     kılıçlar söz ve karar, tılsımlar para).
 *  2. Mertebesi — as bir başlangıç, ortalar süreç, onlar sonuç, saray
 *     kartları ise bir kişi anlatır. Majörler kendi başlarına bir olaydır.
 *  3. Düştüğü pozisyon — "Gelecek"te duran kart, "Geçmiş"te durandan daha
 *     yüksek ihtimalle yaşanacak bir şeyi anlatır.
 *
 * Bunların üstüne kartın evet/hayır tabiatı ve ters olup olmadığı çarpan
 * olarak biner. Aynı açılım her zaman aynı yüzdeleri verir.
 */
import {
  harmanla,
  kirp,
  type Ihtimal,
  type IhtimalAlani,
  ihtimalleriDuzenle,
} from '@/lib/ihtimal'
import type { CekilenKart } from './acilim'
import { TAKIM_ADI, type Takim } from './deste'

/** Her takımın baktığı hayat alanı. */
const TAKIM_ALANI: Record<Takim, IhtimalAlani> = {
  major: 'kendin',
  wands: 'iş',
  cups: 'aşk',
  swords: 'haber',
  coins: 'para',
}

type Mertebe = 'as' | 'baslangic' | 'surec' | 'sonuc' | 'saray'

function mertebe(sira: number): Mertebe {
  if (sira === 1) return 'as'
  if (sira <= 3) return 'baslangic'
  if (sira <= 7) return 'surec'
  if (sira <= 10) return 'sonuc'
  return 'saray'
}

/** Minör kartların mertebe × takım olay tablosu. */
const MINOR_OLAYI: Record<Mertebe, Record<Exclude<Takim, 'major'>, string>> = {
  as: {
    wands: 'sıfırdan bir işe ya da girişime başlaman',
    cups: 'yeni bir duygusal bağın başlaması',
    swords: 'kafanda uzun süredir dönen bir konunun netleşmesi',
    coins: 'yeni bir gelir kapısının açılması',
  },
  baslangic: {
    wands: 'bir planın ilk somut adımını atman',
    cups: 'bir yakınlaşmanın karşılık bulması',
    swords: 'zor bir konuşmayı yapmak zorunda kalman',
    coins: 'bir ortaklık ya da ek iş teklifiyle karşılaşman',
  },
  surec: {
    wands: 'bir rekabetin ya da çekişmenin içine girmen',
    cups: 'bir ilişkide geçmişin yeniden gündeme gelmesi',
    swords: 'bir anlaşmazlığın büyümeden çözülmesi için araya girmen',
    coins: 'bütçeni yeniden düzenlemek zorunda kalman',
  },
  sonuc: {
    wands: 'yüklendiğin işin sonuna gelmen ve yükü bırakman',
    cups: 'duygusal bir konunun mutlu ya da net bir sonuca bağlanması',
    swords: 'seni yoran bir düşünce döngüsünün kırılması',
    coins: 'uzun vadeli bir yatırımın ya da emeğin karşılığını görmen',
  },
  saray: {
    wands: 'girişken, hareketli birinin hayatına dahil olması',
    cups: 'duygusal, sana iyi gelen birinin devreye girmesi',
    swords: 'açık sözlü, keskin birinin seninle karşı karşıya gelmesi',
    coins: 'maddi konuda sana yol gösterecek biriyle tanışman',
  },
}

/** Mertebenin kendi ağırlığı: as ve saray kartları daha belirgin olay anlatır. */
const MERTEBE_TABANI: Record<Mertebe, number> = {
  as: 0.58,
  baslangic: 0.52,
  surec: 0.48,
  sonuc: 0.55,
  saray: 0.5,
}

/** Majör Arkana kartlarının her biri kendi başına bir olaydır. */
const MAJOR_OLAYI: Record<number, { alan: IhtimalAlani; olay: string; taban: number }> = {
  0: { alan: 'kendin', olay: 'hiç denemediğin bir şeye sıfırdan başlaman', taban: 0.58 },
  1: { alan: 'iş', olay: 'elindeki imkânları birleştirip somut bir iş çıkarman', taban: 0.62 },
  2: { alan: 'kendin', olay: 'içine doğan bir şeyin doğru çıkması', taban: 0.55 },
  3: { alan: 'aile', olay: 'bir bolluk haberi: aileye katılım, ev ya da beklenmedik bir bereket', taban: 0.58 },
  4: { alan: 'iş', olay: 'bir otoriteyle — patron, kurum ya da aile büyüğü — yüz yüze gelmen', taban: 0.6 },
  5: { alan: 'aile', olay: 'resmî bir adım: nikâh, kurumsal bir karar ya da bir hocayla yol alman', taban: 0.55 },
  6: { alan: 'aşk', olay: 'iki seçenek arasında kalıp kalbinin dediğini seçmen', taban: 0.63 },
  7: { alan: 'iş', olay: 'iradeyle kazanacağın bir rekabet ya da sınav', taban: 0.6 },
  8: { alan: 'kendin', olay: 'öfkeni ya da bir alışkanlığını sabırla yenmen', taban: 0.55 },
  9: { alan: 'kendin', olay: 'bir süre geri çekilip kararı kendi başına vermen', taban: 0.52 },
  10: { alan: 'kendin', olay: 'kontrolün dışında gelişen ani bir dönüş', taban: 0.6 },
  11: { alan: 'iş', olay: 'hukukî ya da resmî bir meselenin sonuçlanması', taban: 0.57 },
  12: { alan: 'kendin', olay: 'bir konuda beklemek zorunda kalman', taban: 0.58 },
  13: { alan: 'kendin', olay: 'bir dönemin kesin olarak kapanması', taban: 0.62 },
  14: { alan: 'sağlık', olay: 'bir dengenin kurulması: sağlık, düzen ya da bir uzlaşma', taban: 0.55 },
  15: { alan: 'kendin', olay: 'bağımlı olduğun bir alışkanlığın ya da ilişkinin yüzüne bakman', taban: 0.55 },
  16: { alan: 'kendin', olay: 'ani ve sarsıcı bir değişiklik', taban: 0.5 },
  17: { alan: 'kendin', olay: 'uzun bir zorluğun ardından umudun geri gelmesi', taban: 0.6 },
  18: { alan: 'kendin', olay: 'saklanan bir şeyin ya da bir yanılsamanın ortaya çıkması', taban: 0.52 },
  19: { alan: 'iş', olay: 'açık, gözle görülür ve herkesin fark edeceği bir başarı', taban: 0.63 },
  20: { alan: 'kendin', olay: 'geçmişten bir çağrı gelmesi ve bir hesaplaşma', taban: 0.55 },
  21: { alan: 'kendin', olay: 'bir döngünün tamamlanması: diploma, teslim ya da uzun bir işin bitişi', taban: 0.62 },
}

/**
 * Pozisyonun ağırlığı ve vadesi. Geleceğe bakan pozisyonlar ihtimali
 * büyütür; geçmişe bakanlar bir tahmin değil, açıklama sunar.
 */
const POZISYON: Record<string, { agirlik: number; vade: string }> = {
  Bugün: { agirlik: 1.12, vade: 'bugün–yarın' },
  Cevap: { agirlik: 1.1, vade: 'sorduğun konuda' },
  Geçmiş: { agirlik: 0.68, vade: 'kökü geçmişte, etkisi sürüyor' },
  Şimdi: { agirlik: 1.0, vade: 'şu sıralar' },
  Gelecek: { agirlik: 1.15, vade: 'önümüzdeki 3–6 ay' },
  Sen: { agirlik: 0.92, vade: 'şu sıralar' },
  'Karşı taraf': { agirlik: 0.9, vade: 'şu sıralar' },
  'Aranızdaki bağ': { agirlik: 0.95, vade: 'ilişkinin geneli' },
  Engel: { agirlik: 0.88, vade: 'önümüzdeki 1–3 ay' },
  Gidişat: { agirlik: 1.15, vade: 'önümüzdeki 3–6 ay' },
  'Mevcut durum': { agirlik: 1.0, vade: 'şu sıralar' },
  Kök: { agirlik: 0.75, vade: 'kökü geçmişte, etkisi sürüyor' },
  'Bilinçli hedef': { agirlik: 0.95, vade: 'önümüzdeki 3–6 ay' },
  'Yakın gelecek': { agirlik: 1.15, vade: 'önümüzdeki 2–3 hafta' },
  Çevre: { agirlik: 0.9, vade: 'şu sıralar' },
  'Umut ve korku': { agirlik: 0.82, vade: 'içinde taşıdığın hâliyle' },
  Sonuç: { agirlik: 1.18, vade: 'bu yol sürerse 6–12 ay içinde' },
}

const VARSAYILAN_POZISYON = { agirlik: 1, vade: 'önümüzdeki 1–3 ay' }

/** Kartın evet/hayır tabiatı olasılığı doğrudan etkiler. */
const TABIAT_ETKENI = { evet: 1.1, belki: 1, hayir: 0.85 }

function kartIhtimali(k: CekilenKart, majorOrani: number): Ihtimal | null {
  const poz = POZISYON[k.pozisyon.ad] ?? VARSAYILAN_POZISYON

  let alan: IhtimalAlani
  let olay: string
  let taban: number

  if (k.kart.takim === 'major') {
    const kayit = MAJOR_OLAYI[k.kart.sira]
    if (!kayit) return null
    ;({ alan, olay, taban } = kayit)
  } else {
    const m = mertebe(k.kart.sira)
    alan = TAKIM_ALANI[k.kart.takim]
    olay = MINOR_OLAYI[m][k.kart.takim]
    taban = MERTEBE_TABANI[m]
  }

  // Ters kart olayı iptal etmez, geciktirir ve zayıflatır.
  const tersEtkeni = k.ters ? 0.76 : 1.03
  // Majörlerin çoğunlukta olduğu açılımda her kart daha ağır konuşur.
  const kaderEtkeni = 0.96 + majorOrani * 0.16

  return {
    id: `kart-${k.kart.id}`,
    alan,
    olay,
    olasilik: harmanla(
      taban,
      poz.agirlik,
      TABIAT_ETKENI[k.kart.evetHayir],
      tersEtkeni,
      kaderEtkeni,
    ),
    vade: poz.vade,
    gerekce: `${k.pozisyon.ad} konumunda ${k.kart.ad}${k.ters ? ' (ters)' : ''}`,
  }
}

/** Açılımın bileşiminden — takım dağılımı, ters oranı — çıkan ihtimaller. */
function acilimIhtimalleri(kartlar: CekilenKart[]): Ihtimal[] {
  const toplam = kartlar.length
  if (toplam < 2) return []

  const tersOran = kartlar.filter((k) => k.ters).length / toplam
  const majorOran = kartlar.filter((k) => k.kart.takim === 'major').length / toplam

  const takimSayaci = new Map<Takim, number>()
  for (const k of kartlar) {
    if (k.kart.takim === 'major') continue
    takimSayaci.set(k.kart.takim, (takimSayaci.get(k.kart.takim) ?? 0) + 1)
  }
  const baskin = [...takimSayaci.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]

  const sonuc: Ihtimal[] = [
    {
      id: 'acilim-gecikme',
      alan: 'kendin',
      olay: 'beklediğin gelişmenin öngördüğünden geç olması',
      olasilik: kirp(0.22 + tersOran * 0.8),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `${toplam} kartın ${Math.round(tersOran * toplam)} tanesi ters`,
    },
    {
      id: 'acilim-donemec',
      alan: 'kendin',
      olay: 'gidişatı senin seçimin değil, dışarıdan gelen bir gelişmenin belirlemesi',
      olasilik: kirp(0.2 + majorOran * 0.85),
      vade: 'önümüzdeki 3–6 ay',
      gerekce: `Majör Arkana oranı %${Math.round(majorOran * 100)}`,
    },
  ]

  if (baskin && baskin[1] >= 2) {
    const [takim, adet] = baskin
    const alan = TAKIM_ALANI[takim]
    const olay: Record<Exclude<Takim, 'major'>, string> = {
      wands: 'gündeminin iş, girişim ve hareket etrafında toplanması',
      cups: 'gündeminin ilişkiler ve duygusal bir mesele etrafında toplanması',
      swords: 'gündeminin bir konuşma, karar ya da anlaşmazlık etrafında toplanması',
      coins: 'gündeminin para, iş güvencesi ve somut meseleler etrafında toplanması',
    }
    sonuc.push({
      id: `acilim-baskin-${takim}`,
      alan,
      olay: olay[takim as Exclude<Takim, 'major'>],
      olasilik: kirp(0.34 + (adet / toplam) * 0.9),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `${TAKIM_ADI[takim]} takımı ${adet} kartla öne çıkıyor`,
    })
  }

  return sonuc
}

export function tarotIhtimalleri(kartlar: CekilenKart[], enFazla = 6): Ihtimal[] {
  const majorOrani = kartlar.length
    ? kartlar.filter((k) => k.kart.takim === 'major').length / kartlar.length
    : 0

  const kartlardan = kartlar
    .map((k) => kartIhtimali(k, majorOrani))
    .filter((i): i is Ihtimal => i !== null)

  return ihtimalleriDuzenle([...kartlardan, ...acilimIhtimalleri(kartlar)], enFazla)
}
