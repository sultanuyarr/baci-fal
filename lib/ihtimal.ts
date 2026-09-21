/**
 * Üç falın ortak "ihtimal" katmanı.
 *
 * Genel yorum bir hâli tarif eder ("yoğun bir dönemdesin"); ihtimal listesi
 * ise somut bir olay söyler ve arkasına bir yüzde koyar. Yüzde uydurma
 * değildir: her fal kendi ölçümlerinden (telve oranları, kart bileşimi, gök
 * konumları) bir taban olasılık ve onu büyüten/küçülten etkenler türetir.
 * Aynı girdi her zaman aynı listeyi ve aynı yüzdeyi verir.
 */

export type IhtimalAlani =
  | 'aşk'
  | 'iş'
  | 'para'
  | 'yolculuk'
  | 'sağlık'
  | 'aile'
  | 'haber'
  | 'kendin'

export const ALAN_SIMGESI: Record<IhtimalAlani, string> = {
  aşk: '❤️',
  iş: '💼',
  para: '💰',
  yolculuk: '🧳',
  sağlık: '🌿',
  aile: '🏠',
  haber: '✉️',
  kendin: '🪞',
}

export type Ihtimal = {
  /** Listede tekilliği sağlayan anahtar */
  id: string
  alan: IhtimalAlani
  /** Somut, tek cümlelik olay tahmini */
  olay: string
  /** 0-1 arası gerçekleşme olasılığı */
  olasilik: number
  /** "önümüzdeki 2-3 hafta" gibi zaman aralığı */
  vade: string
  /** Bu yüzdenin hangi ölçümden çıktığı */
  gerekce: string
}

/** Fal hiçbir zaman "kesin" demez; uçlar bilerek açık bırakılır. */
export const OLASILIK_TABANI = 0.08
export const OLASILIK_TAVANI = 0.92

export function kirp(
  deger: number,
  alt = OLASILIK_TABANI,
  ust = OLASILIK_TAVANI,
): number {
  if (!Number.isFinite(deger)) return alt
  return Math.min(ust, Math.max(alt, deger))
}

/**
 * Bir taban olasılığı çarpan etkenlerle harmanlar ve aralığa kırpar.
 * Etkenler 1'in üstündeyse ihtimali büyütür, altındaysa küçültür.
 */
export function harmanla(taban: number, ...etkenler: number[]): number {
  return kirp(etkenler.reduce((t, e) => t * e, taban))
}

/** 0-1 arası olasılığı falcının diliyle adlandırır. */
export function olasilikEtiketi(olasilik: number): string {
  if (olasilik >= 0.75) return 'neredeyse kesin'
  if (olasilik >= 0.6) return 'çok kuvvetli'
  if (olasilik >= 0.45) return 'kuvvetli'
  if (olasilik >= 0.3) return 'orta'
  return 'zayıf'
}

export function yuzde(olasilik: number): string {
  return `%${Math.round(olasilik * 100)}`
}

/**
 * Aynı olayı iki kez yazmaz, en olasıdan aza sıralar ve listeyi kırpar.
 * Eşit olasılıkta sıralama id'ye göre sabitlenir ki çıktı her seferinde
 * aynı olsun.
 */
export function ihtimalleriDuzenle(ham: Ihtimal[], enFazla = 6): Ihtimal[] {
  const enIyi = new Map<string, Ihtimal>()
  for (const i of ham) {
    const onceki = enIyi.get(i.id)
    if (!onceki || i.olasilik > onceki.olasilik) enIyi.set(i.id, i)
  }
  return [...enIyi.values()]
    .sort((a, b) => b.olasilik - a.olasilik || a.id.localeCompare(b.id, 'tr-TR'))
    .slice(0, enFazla)
}

/**
 * Listenin başındaki iki-üç ihtimali tek cümlede özetler; kullanıcı yüzdelere
 * bakmadan önce "asıl konu ne" sorusunun cevabını görsün diye.
 */
export function ihtimalOzeti(ihtimaller: Ihtimal[]): string {
  if (ihtimaller.length === 0) return ''
  const [ilk, ...kalan] = ihtimaller
  const bas = `En yüksek ihtimal ${yuzde(ilk.olasilik)} ile şu: ${ilk.olay} (${ilk.vade}).`
  if (kalan.length === 0) return bas
  const ikinci = kalan[0]
  const ucuncu = kalan[1]
  const orta = ucuncu
    ? `Onu ${yuzde(ikinci.olasilik)} ile ${ikinci.olay}, ${yuzde(ucuncu.olasilik)} ile ${ucuncu.olay} izliyor.`
    : `Onu ${yuzde(ikinci.olasilik)} ile ${ikinci.olay} izliyor.`
  return `${bas} ${orta}`
}
