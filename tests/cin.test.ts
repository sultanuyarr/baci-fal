import { describe, expect, it } from 'vitest'
import { cinBurcu, cinYilbasi } from '@/lib/dogum/cin'

describe('Çin yılbaşı hesabı', () => {
  it('bilinen yılbaşı tarihlerini tutturur', () => {
    const beklenen: [number, string][] = [
      [1996, '1996-02-19'],
      [2000, '2000-02-05'],
      [2020, '2020-01-25'],
      [2023, '2023-01-22'],
      [2024, '2024-02-10'],
      [2025, '2025-01-29'],
      [2026, '2026-02-17'],
      [1984, '1984-02-02'],
      [2033, '2033-01-31'],
    ]
    for (const [yil, tarih] of beklenen) {
      expect(cinYilbasi(yil), String(yil)).toBe(tarih)
    }
  })

  it('yılbaşı her zaman 21 Ocak – 21 Şubat arasındadır', () => {
    for (let yil = 1930; yil <= 2050; yil++) {
      const [, ay, gun] = cinYilbasi(yil).split('-').map(Number)
      const gecerli = (ay === 1 && gun >= 21) || (ay === 2 && gun <= 21)
      expect(gecerli, `${yil}: ${cinYilbasi(yil)}`).toBe(true)
    }
  })
})

describe('Çin burcu', () => {
  it('bilinen yılların hayvan ve elementini verir', () => {
    expect(cinBurcu('2024-06-15').ad).toBe('Yang Ağaç Ejderha')
    expect(cinBurcu('2020-06-15').ad).toBe('Yang Metal Fare')
    expect(cinBurcu('1984-06-15').ad).toBe('Yang Ağaç Fare')
    expect(cinBurcu('2025-06-15').ad).toBe('Yin Ağaç Yılan')
    expect(cinBurcu('1996-06-15').ad).toBe('Yang Ateş Fare')
  })

  it('yılbaşından önce doğanı bir önceki hayvana atar', () => {
    // 2024 yılbaşı 10 Şubat; 1 Şubat 2024 hâlâ Tavşan yılıdır.
    expect(cinBurcu('2024-02-01').hayvan.ad).toBe('Tavşan')
    expect(cinBurcu('2024-02-10').hayvan.ad).toBe('Ejderha')
    expect(cinBurcu('2024-02-09').yil).toBe(2023)
  })

  it('hayvan döngüsü 12, element döngüsü 10 yılda bir tekrar eder', () => {
    for (let yil = 1950; yil < 2040; yil++) {
      const a = cinBurcu(`${yil}-06-15`)
      const b = cinBurcu(`${yil + 12}-06-15`)
      expect(b.hayvan.ad, String(yil)).toBe(a.hayvan.ad)
      const c = cinBurcu(`${yil + 10}-06-15`)
      expect(c.element, String(yil)).toBe(a.element)
    }
  })
})
