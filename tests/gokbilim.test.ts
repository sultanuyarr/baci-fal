import { describe, expect, it } from 'vitest'
import {
  ayBoylami,
  ayEvresi,
  egiklik,
  gogunOrtasi,
  gunesBoylami,
  gunesinBoylamaVardigiAn,
  julyenGunu,
  julyendenTarihe,
  normalize,
  yeniAyAni,
  yildizZamani,
  yukselenBoylami,
  yuzyil,
} from '@/lib/dogum/gokbilim'

describe('Jülyen Günü (Meeus bölüm 7 örnekleri)', () => {
  it('bilinen tarihleri doğru çevirir', () => {
    expect(julyenGunu(2000, 1, 1, 12)).toBe(2451545.0)
    expect(julyenGunu(1987, 1, 27, 0)).toBe(2446822.5)
    expect(julyenGunu(1957, 10, 4, 19, 26, 24)).toBeCloseTo(2436116.31, 2)
    expect(julyenGunu(1992, 10, 13, 0)).toBe(2448908.5)
  })

  it('geri çevirim tutarlıdır', () => {
    const jd = julyenGunu(1995, 4, 12, 7, 30)
    const t = julyendenTarihe(jd)
    expect(t.toISOString()).toBe('1995-04-12T07:30:00.000Z')
  })
})

describe('Güneş konumu (Meeus örnek 25.a)', () => {
  it('1992-10-13.0 TD için görünen boylamı 199.90895° verir', () => {
    // Meeus'un yayımladığı sonuç: görünen boylam 199°54′26″ = 199.90895°
    expect(gunesBoylami(2448908.5)).toBeCloseTo(199.90895, 3)
  })

  it('gündönümü ve ekinoksları doğru boylamlarda bulur', () => {
    // 2024 ilkbahar ekinoksu: 20 Mart 2024, 03:06 UTC
    const ekinoks = gunesinBoylamaVardigiAn(0, julyenGunu(2024, 3, 18))
    const t = julyendenTarihe(ekinoks)
    expect(t.toISOString().slice(0, 10)).toBe('2024-03-20')
    expect(t.getUTCHours()).toBe(3)

    // 2024 kış gündönümü: 21 Aralık 2024, 09:20 UTC
    const gundonumu = gunesinBoylamaVardigiAn(270, julyenGunu(2024, 12, 19))
    const g = julyendenTarihe(gundonumu)
    expect(g.toISOString().slice(0, 10)).toBe('2024-12-21')
    expect(g.getUTCHours()).toBe(9)
  })
})

describe('Ay konumu (Meeus örnek 47.a)', () => {
  it('1992-04-12.0 TD için boylamı 133.162655° verir', () => {
    expect(ayBoylami(2448724.5)).toBeCloseTo(133.162655, 2)
  })

  it('dolunayda Güneş ile arasındaki açı 180°ye yakındır', () => {
    // 2024-04-24 23:49 UTC dolunayı
    const { aci, aydinlanma } = ayEvresi(julyenGunu(2024, 4, 23, 23, 49))
    expect(Math.abs(aci - 180)).toBeLessThan(2)
    expect(aydinlanma).toBeGreaterThan(0.99)
  })

  it('yeni ayda açı 0°ye ve aydınlanma sıfıra yaklaşır', () => {
    // 2024-04-08 18:21 UTC yeni ayı (tam güneş tutulması)
    const { aci, aydinlanma } = ayEvresi(julyenGunu(2024, 4, 8, 18, 21))
    expect(Math.min(aci, 360 - aci)).toBeLessThan(2)
    expect(aydinlanma).toBeLessThan(0.01)
  })
})

describe('yeni ay anı (Meeus bölüm 49)', () => {
  it('örnek 49.a: 1977 Şubat yeni ayını dakika hassasiyetinde verir', () => {
    // Meeus'un ortalama yeni ay ara değeri 2443192.94102, düzeltmelerden
    // sonraki sonucu 2443192.65118 (18 Şubat 1977, 03:37:42 TD).
    // Gezegen terimleri (A1–A14) atlandığı için ~1 dakikalık fark kalır.
    expect(yeniAyAni(-283)).toBeCloseTo(2443192.65118, 2)
    expect(Math.abs(yeniAyAni(-283) - 2443192.65118) * 24 * 60).toBeLessThan(2)
  })

  it('bilinen yeni ay tarihlerini tutturur', () => {
    const beklenen: [number, string][] = [
      [0, '2000-01-06'],
      [300, '2024-04-08'],
      [-100, '1991-12-06'],
    ]
    for (const [k, tarih] of beklenen) {
      expect(julyendenTarihe(yeniAyAni(k)).toISOString().slice(0, 10)).toBe(tarih)
    }
  })

  it('ardışık yeni aylar arası ortalama 29.53 gündür', () => {
    const farklar: number[] = []
    for (let k = 0; k < 60; k++) farklar.push(yeniAyAni(k + 1) - yeniAyAni(k))
    const ortalama = farklar.reduce((a, b) => a + b, 0) / farklar.length
    expect(ortalama).toBeCloseTo(29.5306, 3)
  })
})

describe('yıldız zamanı ve yükselen', () => {
  it('Meeus örnek 12.a: 1987-04-10 0h UT için 197.693195°', () => {
    expect(yildizZamani(2446895.5)).toBeCloseTo(197.693195, 4)
  })

  it('ekvatorda yıldız zamanı 0 iken yükselen 90°dir', () => {
    // Bahar noktası meridyendeyken doğu ufkunda 90° boylam yükselir.
    const jd = 2451545
    const t = yildizZamani(jd)
    // Boylamı, yerel yıldız zamanını tam 0 yapacak şekilde seç
    const boylam = normalize(-t)
    expect(yukselenBoylami(jd, 0, boylam)).toBeCloseTo(90, 6)
    expect(gogunOrtasi(jd, boylam)).toBeCloseTo(0, 6)
  })

  it('yükselen bir yıldız gününde tam bir tur atar', () => {
    const jd0 = julyenGunu(2024, 6, 1)
    const enlem = 41.0
    const boylam = 29.0
    const yildizGunu = 0.9972695663
    expect(yukselenBoylami(jd0 + yildizGunu, enlem, boylam)).toBeCloseTo(
      yukselenBoylami(jd0, enlem, boylam),
      1,
    )
  })

  it('yükselen gün boyunca 12 burcun hepsinden geçer', () => {
    const jd0 = julyenGunu(2024, 6, 1)
    const burclar = new Set<number>()
    for (let i = 0; i < 24 * 6; i++) {
      burclar.add(Math.floor(yukselenBoylami(jd0 + i / (24 * 6), 41, 29) / 30))
    }
    expect(burclar.size).toBe(12)
  })

  it('yükselen MCden yaklaşık 90° ileridedir', () => {
    const jd = julyenGunu(2024, 6, 1, 14, 30)
    const fark = normalize(yukselenBoylami(jd, 41, 29) - gogunOrtasi(jd, 29))
    expect(fark).toBeGreaterThan(30)
    expect(fark).toBeLessThan(150)
  })
})

describe('ekliptik eğikliği', () => {
  it('J2000 için 23.4393°, 1987 için 23.44095°', () => {
    expect(egiklik(0)).toBeCloseTo(23.43929, 4)
    // Meeus örnek 22.a: 1987 Nisan 10 → 23°26′27.407″ = 23.440946°
    expect(egiklik(yuzyil(2446895.5))).toBeCloseTo(23.440946, 5)
  })
})
