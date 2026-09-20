/**
 * Doğum haritası: isim ve doğum bilgilerinden gerçek hesaplanmış bir okuma.
 *
 * Hesaplananlar:
 *  - Güneş burcu ve derecesi (gerçek ekliptik boylamdan)
 *  - Ay burcu, derecesi, evresi ve aydınlanma oranı
 *  - Yükselen burç ve göğün ortası (doğum saati ve il verilirse)
 *  - Büyük üçlünün element/nitelik dengesi
 *  - Pisagor numerolojisi
 *  - Çin zodyağı
 */
import illerVerisi from '@/data/iller.json'
import {
  ayBoylami,
  ayEvresi,
  gogunOrtasi,
  gunesBoylami,
  jdFromDate,
  yukselenBoylami,
} from './gokbilim'
import {
  ayEvresiAdi,
  boylamdanBurc,
  BURCLAR,
  ELEMENT_YORUMU,
  NITELIK_YORUMU,
  type Burc,
  type Element,
  type Nitelik,
} from './burc'
import { cinBurcu, type CinBurcu } from './cin'
import { numerolojiHesapla, type NumerolojiSonucu } from './numeroloji'

export type Il = { ad: string; plaka: number; enlem: number; boylam: number }

export const ILLER = illerVerisi.iller as Il[]
export const SAAT_DILIMI = illerVerisi.saatDilimi

export function ilBul(plaka: number): Il | undefined {
  return ILLER.find((i) => i.plaka === plaka)
}

/** Bir anın verilen saat diliminde kaç dakika ofseti olduğunu bulur. */
function dilimOfseti(an: Date, dilim: string): number {
  const bicim = new Intl.DateTimeFormat('en-US', {
    timeZone: dilim,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const parca of bicim.formatToParts(an)) {
    if (parca.type !== 'literal') p[parca.type] = Number(parca.value)
  }
  const yerelUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return (yerelUtc - an.getTime()) / 60000
}

/**
 * Yerel duvar saatini UTC anına çevirir. Türkiye 2016'ya kadar yaz saati
 * uyguladığı için ofset tarihe göre değişir; Intl bu geçmişi doğru bilir.
 */
export function yerelZamandanUtc(
  yil: number,
  ay: number,
  gun: number,
  saat: number,
  dakika: number,
  dilim = SAAT_DILIMI,
): Date {
  const varsayim = Date.UTC(yil, ay - 1, gun, saat, dakika)
  let an = new Date(varsayim - dilimOfseti(new Date(varsayim), dilim) * 60000)
  // Yaz saati sınırlarında ikinci yineleme sonucu oturtur.
  an = new Date(varsayim - dilimOfseti(an, dilim) * 60000)
  return an
}

export type Yerlesim = {
  burc: Burc
  derece: number
  boylam: number
  metin: string
}

export type DogumGirdisi = {
  isim: string
  /** YYYY-AA-GG */
  tarih: string
  /** SS:DD — verilmezse yükselen hesaplanmaz */
  saat?: string
  /** İl plaka kodu — verilmezse yükselen hesaplanmaz */
  ilPlaka?: number
}

export type DogumHaritasi = {
  isim: string
  tarih: string
  saat: string | null
  il: Il | null
  /** Hesaplamada kullanılan evrensel zaman */
  utc: string
  gunes: Yerlesim
  ay: Yerlesim & {
    evre: { ad: string; simge: string; aydinlanma: number; yorum: string }
  }
  yukselen: Yerlesim | null
  gogunOrtasi: Yerlesim | null
  denge: {
    elementler: Record<Element, number>
    nitelikler: Record<Nitelik, number>
    baskinElement: Element
    baskinNitelik: Nitelik
    elementMetni: string
    nitelikMetni: string
  }
  numeroloji: NumerolojiSonucu
  cin: CinBurcu
  ozet: string
  notlar: string[]
}

function yerlesim(boylam: number, tur: 'gunes' | 'ay' | 'yukselen' | 'mc'): Yerlesim {
  const { burc, derece } = boylamdanBurc(boylam)
  const metin =
    tur === 'gunes' ? burc.gunes : tur === 'ay' ? burc.ay : tur === 'yukselen' ? burc.yukselen : ''
  return { burc, derece, boylam, metin }
}

function dengeHesapla(burclar: Burc[]) {
  const elementler: Record<Element, number> = { ateş: 0, toprak: 0, hava: 0, su: 0 }
  const nitelikler: Record<Nitelik, number> = { öncü: 0, sabit: 0, değişken: 0 }
  for (const b of burclar) {
    elementler[b.element]++
    nitelikler[b.nitelik]++
  }
  const baskinElement = (Object.entries(elementler) as [Element, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0]
  const baskinNitelik = (Object.entries(nitelikler) as [Nitelik, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0]
  return {
    elementler,
    nitelikler,
    baskinElement,
    baskinNitelik,
    elementMetni: ELEMENT_YORUMU[baskinElement],
    nitelikMetni: NITELIK_YORUMU[baskinNitelik],
  }
}

function ozetYaz(h: {
  isim: string
  gunes: Yerlesim
  ay: Yerlesim
  yukselen: Yerlesim | null
  numeroloji: NumerolojiSonucu
  cin: CinBurcu
}): string {
  const ad = h.isim.trim().split(/\s+/)[0] || 'Sen'
  const ucluk = h.yukselen
    ? `Güneş'in ${h.gunes.burc.ad}, Ay'ın ${h.ay.burc.ad}, yükselenin ${h.yukselen.burc.ad}.`
    : `Güneş'in ${h.gunes.burc.ad}, Ay'ın ${h.ay.burc.ad}. (Yükselen için doğum saati ve il gerekiyor.)`

  const catisma =
    h.gunes.burc.element === h.ay.burc.element
      ? `Güneş ve Ay'ın aynı elementte olması içini dışına yakın kılıyor: istediğin şeyle ihtiyaç duyduğun şey genelde aynı yöne bakıyor.`
      : `Güneş'in ${h.gunes.burc.element}, Ay'ın ${h.ay.burc.element} elementinde. Bu, dışarıdan göründüğünle içeride hissettiğinin farklı dillerde konuştuğu anlamına gelir — hayatının büyük bir kısmı bu ikisini uzlaştırmakla geçiyor.`

  return `${ad}, ${ucluk} ${catisma} Numerolojide yaşam yolun ${h.numeroloji.yasamYolu.sayi} — "${h.numeroloji.yasamYolu.baslik}". Çin takviminde ${h.cin.ad} yılında doğmuşsun.`
}

export function haritaCikar(girdi: DogumGirdisi, bugunYili?: number): DogumHaritasi {
  const [yil, ay, gun] = girdi.tarih.split('-').map(Number)
  if (!yil || !ay || !gun) throw new Error('Doğum tarihi YYYY-AA-GG biçiminde olmalı')

  const notlar: string[] = []
  const il = girdi.ilPlaka ? (ilBul(girdi.ilPlaka) ?? null) : null
  const saatVar = Boolean(girdi.saat && il)

  let saatSayisi = 12
  let dakikaSayisi = 0
  if (girdi.saat) {
    const [s, d] = girdi.saat.split(':').map(Number)
    if (Number.isFinite(s)) saatSayisi = s
    if (Number.isFinite(d)) dakikaSayisi = d
  }

  if (!girdi.saat) {
    notlar.push(
      'Doğum saati verilmediği için hesap öğlen 12:00 kabul edilerek yapıldı. Güneş burcu bundan etkilenmez; Ay burcu, hızlı ilerlediği için gün içinde değişmiş olabilir.',
    )
  }
  if (!il) {
    notlar.push('Doğum yeri seçilmediği için yükselen burç hesaplanamadı.')
  }

  const utcAni = yerelZamandanUtc(yil, ay, gun, saatSayisi, dakikaSayisi)
  const jd = jdFromDate(utcAni)

  const gunes = yerlesim(gunesBoylami(jd), 'gunes')
  const ayBoylam = ayBoylami(jd)
  const evre = ayEvresi(jd)
  const evreAdi = ayEvresiAdi(evre.aci)
  const ayYerlesimi = {
    ...yerlesim(ayBoylam, 'ay'),
    evre: { ...evreAdi, aydinlanma: evre.aydinlanma },
  }

  const yukselen =
    saatVar && il ? yerlesim(yukselenBoylami(jd, il.enlem, il.boylam), 'yukselen') : null
  const mc = saatVar && il ? yerlesim(gogunOrtasi(jd, il.boylam), 'mc') : null

  const denge = dengeHesapla(
    [gunes.burc, ayYerlesimi.burc, yukselen?.burc].filter(Boolean) as Burc[],
  )

  const numeroloji = numerolojiHesapla(girdi.isim, girdi.tarih, bugunYili ?? new Date().getFullYear())
  const cin = cinBurcu(girdi.tarih)

  if (girdi.saat && !il) {
    notlar.push('Saat girdin ama il seçmedin; yükselen için ikisi birden gerekiyor.')
  }

  return {
    isim: girdi.isim.trim(),
    tarih: girdi.tarih,
    saat: girdi.saat ?? null,
    il,
    utc: utcAni.toISOString(),
    gunes,
    ay: ayYerlesimi,
    yukselen,
    gogunOrtasi: mc,
    denge,
    numeroloji,
    cin,
    ozet: ozetYaz({ isim: girdi.isim, gunes, ay: ayYerlesimi, yukselen, numeroloji, cin }),
    notlar,
  }
}

export { BURCLAR }
