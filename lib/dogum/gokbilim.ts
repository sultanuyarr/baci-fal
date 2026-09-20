/**
 * Gökbilim hesapları — Jean Meeus, "Astronomical Algorithms" (2. baskı).
 *
 * Burası falın "gerçek veri" tarafı: burçlar sabit tarih aralıklarından değil,
 * doğum anındaki Güneş'in gerçek ekliptik boylamından hesaplanır. Ay'ın burcu,
 * evresi ve yükselen burç da aynı şekilde konum hesabıyla bulunur.
 *
 * Doğruluk: Güneş boylamı ~0.01°, Ay boylamı ~0.1°, yeni ay anı ~1 dakika.
 */

const DER = Math.PI / 180

export const sin = (d: number) => Math.sin(d * DER)
export const cos = (d: number) => Math.cos(d * DER)
export const tan = (d: number) => Math.tan(d * DER)

/** Açıyı 0–360 aralığına indirger. */
export function normalize(derece: number): number {
  const d = derece % 360
  return d < 0 ? d + 360 : d
}

/** Takvim tarihinden Jülyen Günü (Meeus, bölüm 7). */
export function julyenGunu(
  yil: number,
  ay: number,
  gun: number,
  saat = 0,
  dakika = 0,
  saniye = 0,
): number {
  let Y = yil
  let M = ay
  if (M <= 2) {
    Y -= 1
    M += 12
  }
  // Gregoryen takvim düzeltmesi (1582 Ekim 15 sonrası)
  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)
  const gunKesri = (saat + dakika / 60 + saniye / 3600) / 24
  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    gun +
    gunKesri +
    B -
    1524.5
  )
}

/** Jülyen Günü'nden takvim tarihine (UTC). */
export function julyendenTarihe(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000)
}

export function jdFromDate(t: Date): number {
  return t.getTime() / 86400000 + 2440587.5
}

/** J2000'den itibaren Jülyen yüzyılı. */
export const yuzyil = (jd: number) => (jd - 2451545) / 36525

/** Ekliptiğin ortalama eğikliği (Meeus 22.2). */
export function egiklik(T: number): number {
  return (
    23.4392911111 -
    (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600
  )
}

/**
 * Güneş'in görünen ekliptik boylamı (Meeus bölüm 25, düşük hassasiyet).
 * Meeus örnek 25.a ile doğrulanır: 1992-10-13.0 TD → 199.90895°
 */
export function gunesBoylami(jd: number): number {
  const T = yuzyil(jd)
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
    (0.019993 - 0.000101 * T) * sin(2 * M) +
    0.000289 * sin(3 * M)
  const gercekBoylam = L0 + C
  const omega = 125.04 - 1934.136 * T
  // Işık sapması ve nutasyon düzeltmesi → görünen boylam
  return normalize(gercekBoylam - 0.00569 - 0.00478 * sin(omega))
}

/**
 * Ay'ın ekliptik boylamı (Meeus bölüm 47, ana terimler).
 * Meeus örnek 47.a ile doğrulanır: 1992-04-12.0 TD → 133.162655°
 */
export function ayBoylami(jd: number): number {
  const T = yuzyil(jd)

  // Ay'ın ortalama boylamı
  const Lp =
    218.3164477 +
    481267.88123421 * T -
    0.0015786 * T * T +
    (T * T * T) / 538841 -
    (T * T * T * T) / 65194000
  // Ay'ın ortalama uzaklaşması
  const D =
    297.8501921 +
    445267.1114034 * T -
    0.0018819 * T * T +
    (T * T * T) / 545868 -
    (T * T * T * T) / 113065000
  // Güneş'in ortalama anomalisi
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000
  // Ay'ın ortalama anomalisi
  const Mp =
    134.9633964 +
    477198.8675055 * T +
    0.0087414 * T * T +
    (T * T * T) / 69699 -
    (T * T * T * T) / 14712000
  // Ay'ın enlem argümanı
  const F =
    93.272095 +
    483202.0175233 * T -
    0.0036539 * T * T -
    (T * T * T) / 3526000 +
    (T * T * T * T) / 863310000

  const A1 = 119.75 + 131.849 * T
  const A2 = 53.09 + 479264.29 * T
  // Dünya yörünge dışmerkezliğinin düzeltme çarpanı
  const E = 1 - 0.002516 * T - 0.0000074 * T * T

  // [katsayı(1e-6 derece), D, M, M', F] — Meeus tablo 47.A
  const terimler: [number, number, number, number, number][] = [
    [6288774, 0, 0, 1, 0],
    [1274027, 2, 0, -1, 0],
    [658314, 2, 0, 0, 0],
    [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0],
    [-114332, 0, 0, 0, 2],
    [58793, 2, 0, -2, 0],
    [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0],
    [45758, 2, -1, 0, 0],
    [-40923, 0, 1, -1, 0],
    [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0],
    [15327, 2, 0, 0, -2],
    [-12528, 0, 0, 1, 2],
    [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0],
    [10034, 0, 0, 3, 0],
    [8548, 4, 0, -2, 0],
    [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0],
    [-5163, 1, 0, -1, 0],
    [4987, 1, 1, 0, 0],
    [4036, 2, -1, 1, 0],
    [3994, 2, 0, 2, 0],
    [3861, 4, 0, 0, 0],
    [3665, 2, 0, -3, 0],
    [-2689, 0, 1, -2, 0],
    [-2602, 2, 0, -1, 2],
    [2390, 2, -1, -2, 0],
    [-2348, 1, 0, 1, 0],
    [2236, 2, -2, 0, 0],
    [-2120, 0, 1, 2, 0],
    [-2069, 0, 2, 0, 0],
    [2048, 2, -2, -1, 0],
    [-1773, 2, 0, 1, -2],
    [-1595, 2, 0, 0, 2],
    [1215, 4, -1, -1, 0],
    [-1110, 0, 0, 2, 2],
    [-892, 3, 0, -1, 0],
    [-810, 2, 1, 1, 0],
    [759, 4, -1, -2, 0],
    [-713, 0, 2, -1, 0],
    [-700, 2, 2, -1, 0],
    [691, 2, 1, -2, 0],
    [596, 2, -1, 0, -2],
    [549, 4, 0, 1, 0],
    [537, 0, 0, 4, 0],
    [520, 4, -1, 0, 0],
    [-487, 1, 0, -2, 0],
    [-399, 2, 1, 0, -2],
    [-381, 0, 0, 2, -2],
    [351, 1, 1, 1, 0],
    [-340, 3, 0, -2, 0],
    [330, 4, 0, -3, 0],
    [327, 2, -1, 2, 0],
    [-323, 0, 2, 1, 0],
    [299, 1, 1, -1, 0],
    [294, 2, 0, 3, 0],
  ]

  let toplam = 0
  for (const [katsayi, d, m, mp, f] of terimler) {
    const aci = d * D + m * M + mp * Mp + f * F
    // Güneş'in anomalisini içeren terimler E ile ölçeklenir
    const olcek = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1
    toplam += katsayi * olcek * sin(aci)
  }
  // Venüs ve Jüpiter'in ek etkileri
  toplam += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2)

  return normalize(Lp + toplam / 1000000)
}

/** Greenwich ortalama yıldız zamanı, derece (Meeus 12.4). */
export function yildizZamani(jd: number): number {
  const T = yuzyil(jd)
  return normalize(
    280.46061837 +
      360.98564736629 * (jd - 2451545) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  )
}

/**
 * Yükselen burcun ekliptik boylamı.
 * @param jd    Jülyen Günü (UT)
 * @param enlem Coğrafi enlem (kuzey pozitif)
 * @param boylam Coğrafi boylam (doğu pozitif)
 */
export function yukselenBoylami(jd: number, enlem: number, boylam: number): number {
  const eps = egiklik(yuzyil(jd))
  const yerelYildizZamani = normalize(yildizZamani(jd) + boylam)
  const t = yerelYildizZamani
  const asc = Math.atan2(cos(t), -(sin(t) * cos(eps) + tan(enlem) * sin(eps))) / DER
  return normalize(asc)
}

/** Göğün ortası (MC) — ekliptik boylam. */
export function gogunOrtasi(jd: number, boylam: number): number {
  const eps = egiklik(yuzyil(jd))
  const t = normalize(yildizZamani(jd) + boylam)
  return normalize(Math.atan2(sin(t), cos(t) * cos(eps)) / DER)
}

/**
 * Ay evresi: Güneş ile Ay arasındaki ekliptik açı farkı (0 yeni ay, 180 dolunay)
 * ve aydınlanma oranı.
 */
export function ayEvresi(jd: number): { aci: number; aydinlanma: number } {
  const aci = normalize(ayBoylami(jd) - gunesBoylami(jd))
  // Aydınlanma oranı yaklaşık (1 - cos(faz açısı)) / 2
  return { aci, aydinlanma: (1 - cos(aci)) / 2 }
}

/**
 * k sıra numaralı yeni ayın anı (Meeus bölüm 49).
 * k = 0 → 2000 Ocak 6 yeni ayı.
 */
export function yeniAyAni(k: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const T4 = T3 * T

  let jde =
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4

  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const M = normalize(2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3)
  const Mp = normalize(
    201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4,
  )
  const F = normalize(
    160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4,
  )
  const O = normalize(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3)

  jde +=
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(O) -
    0.00007 * sin(Mp + 2 * M)

  return jde
}

/** Verilen ana en yakın önceki yeni ayın k numarası. */
export function yeniAyNumarasi(jd: number): number {
  const yaklasikYil = 2000 + (jd - 2451545) / 365.25
  return Math.floor((yaklasikYil - 2000) * 12.3685)
}

/**
 * Güneş'in belirli bir ekliptik boylama ulaştığı an (ör. 270° = kış gündönümü).
 * Newton benzeri yinelemeyle çözülür.
 */
export function gunesinBoylamaVardigiAn(hedefBoylam: number, baslangicJd: number): number {
  let jd = baslangicJd
  for (let i = 0; i < 12; i++) {
    const fark = ((gunesBoylami(jd) - hedefBoylam + 540) % 360) - 180
    if (Math.abs(fark) < 1e-6) break
    // Güneş günde yaklaşık 0.9856° ilerler
    jd -= fark / 0.9856473
  }
  return jd
}
