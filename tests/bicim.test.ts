import { describe, expect, it } from 'vitest'

/** DogumFormu'ndaki derece biçimlendirmesinin aynısı. */
function DERECE(d: number): string {
  let derece = Math.floor(d)
  let dakika = Math.round((d - derece) * 60)
  if (dakika === 60) {
    derece += 1
    dakika = 0
  }
  return `${derece}°${String(dakika).padStart(2, '0')}′`
}

describe('derece biçimi', () => {
  it('dakikayı doğru yuvarlar ve taşırır', () => {
    expect(DERECE(22.1)).toBe('22°06′')
    expect(DERECE(12.183)).toBe('12°11′')
    expect(DERECE(0)).toBe('0°00′')
    // 60 dakikaya yuvarlanan değer bir sonraki dereceye taşınmalı
    expect(DERECE(21.999)).toBe('22°00′')
    expect(DERECE(29.9999)).toBe('30°00′')
  })
})
