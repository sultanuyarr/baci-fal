import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DESTE, TAKIM_ADI } from '@/lib/tarot/deste'
import { ACILIMLAR, acilimYap, type AcilimTuru } from '@/lib/tarot/acilim'
import { karistir, tohumla, uretec } from '@/lib/tarot/rastgele'

describe('deste', () => {
  it('78 karttan oluşur ve kimlikler tekildir', () => {
    expect(DESTE).toHaveLength(78)
    expect(new Set(DESTE.map((k) => k.id)).size).toBe(78)
  })

  it('her kartın Türkçe okuması ve kaynak verisi eksiksizdir', () => {
    for (const k of DESTE) {
      expect(k.ad.length, k.id).toBeGreaterThanOrEqual(2) // 'Ay' destenin en kısa adı
      expect(k.duz.length, k.id).toBeGreaterThan(60)
      expect(k.ters.length, k.id).toBeGreaterThan(40)
      expect(k.anahtar.length, k.id).toBeGreaterThanOrEqual(3)
      expect(['evet', 'hayir', 'belki']).toContain(k.evetHayir)
      expect(k.kaynak.anahtarKelimeler.length, k.id).toBeGreaterThan(0)
      expect(k.kaynak.aydinlik.length + k.kaynak.golge.length, k.id).toBeGreaterThan(0)
    }
  })

  it('takım dağılımı doğrudur: 22 majör + 4×14 minör', () => {
    const say = (t: string) => DESTE.filter((k) => k.takim === t).length
    expect(say('major')).toBe(22)
    for (const t of ['wands', 'cups', 'swords', 'coins']) expect(say(t), TAKIM_ADI[t as 'wands']).toBe(14)
  })

  it('her kartın görseli diskte mevcuttur', () => {
    for (const k of DESTE) {
      expect(existsSync(join(process.cwd(), 'public', k.gorsel)), k.id).toBe(true)
    }
  })
})

describe('tohumlanmış karıştırma', () => {
  it('aynı tohum aynı sırayı verir', () => {
    const a = karistir([...Array(50).keys()], uretec(tohumla('bacı')))
    const b = karistir([...Array(50).keys()], uretec(tohumla('bacı')))
    expect(a).toEqual(b)
  })

  it('farklı tohum farklı sıra verir', () => {
    const a = karistir([...Array(50).keys()], uretec(tohumla('bacı')))
    const b = karistir([...Array(50).keys()], uretec(tohumla('bacı!')))
    expect(a).not.toEqual(b)
  })

  it('karıştırma dizinin tüm elemanlarını korur', () => {
    const girdi = [...Array(78).keys()]
    const cikti = karistir(girdi, uretec(tohumla('x')))
    expect([...cikti].sort((p, q) => p - q)).toEqual(girdi)
  })

  it('dağılım makul ölçüde düzgündür', () => {
    // İlk sıraya gelen kartın 78 olasılık arasında dengeli dağıldığını sınar.
    const sayac = new Array(78).fill(0)
    for (let i = 0; i < 7800; i++) {
      sayac[karistir([...Array(78).keys()], uretec(tohumla(`deneme-${i}`)))[0]]++
    }
    const ortalama = 100
    for (const s of sayac) {
      expect(s).toBeGreaterThan(ortalama * 0.45)
      expect(s).toBeLessThan(ortalama * 1.85)
    }
  })
})

describe('açılımlar', () => {
  const istek = { isim: 'Ayşe', dogumTarihi: '1995-04-12', soru: 'İşim ne olacak?', gun: '2026-09-21' }

  it('her açılım tanımı kadar kart çeker', () => {
    for (const tur of Object.keys(ACILIMLAR) as AcilimTuru[]) {
      const a = acilimYap({ ...istek, tur })
      expect(a.kartlar, tur).toHaveLength(ACILIMLAR[tur].pozisyonlar.length)
      a.kartlar.forEach((k, i) => {
        expect(k.pozisyon.ad).toBe(ACILIMLAR[tur].pozisyonlar[i].ad)
        expect(k.okuma).toContain(k.kart.ad)
        expect(k.kaynakCumle.length).toBeGreaterThan(3)
      })
    }
  })

  it('bir açılımda aynı kart iki kez çıkmaz', () => {
    const a = acilimYap({ ...istek, tur: 'kelt' })
    expect(new Set(a.kartlar.map((k) => k.kart.id)).size).toBe(10)
  })

  it('aynı girdiler aynı açılımı verir', () => {
    const a = acilimYap({ ...istek, tur: 'uclu' })
    const b = acilimYap({ ...istek, tur: 'uclu' })
    expect(a.kartlar.map((k) => k.kart.id + k.ters)).toEqual(b.kartlar.map((k) => k.kart.id + k.ters))
  })

  it('yeniden karıştırmak açılımı değiştirir', () => {
    const a = acilimYap({ ...istek, tur: 'uclu', tur_no: 0 })
    const b = acilimYap({ ...istek, tur: 'uclu', tur_no: 1 })
    expect(a.kartlar.map((k) => k.kart.id)).not.toEqual(b.kartlar.map((k) => k.kart.id))
  })

  it('farklı kişiler farklı açılım alır', () => {
    const a = acilimYap({ ...istek, isim: 'Ayşe', tur: 'uclu' })
    const b = acilimYap({ ...istek, isim: 'Mehmet', tur: 'uclu' })
    expect(a.kartlar.map((k) => k.kart.id)).not.toEqual(b.kartlar.map((k) => k.kart.id))
  })

  it('evet-hayır açılımı net bir cevap üretir', () => {
    const a = acilimYap({ ...istek, tur: 'evet-hayir' })
    expect(a.cevap).not.toBeNull()
    expect(['evet', 'hayir', 'belki']).toContain(a.cevap!.deger)
    expect(a.cevap!.metin).toContain(a.kartlar[0].kart.ad)
  })

  it('cevap her zaman evet ya da hayır; "belki" verilmez', () => {
    for (let i = 0; i < 120; i++) {
      const a = acilimYap({ ...istek, tur: 'evet-hayir', tur_no: i })
      expect(['evet', 'hayir']).toContain(a.cevap!.deger)
      expect(a.cevap!.metin).not.toContain('belki')
    }
  })

  it('ters kart olumlu cevabı zayıflatır ama sıfırlamaz', () => {
    // Aynı "evet" kartının düz ve ters hâlini bul, güç puanlarını karşılaştır.
    const duz = new Map<string, number>()
    const ters = new Map<string, number>()
    for (let i = 0; i < 300; i++) {
      const a = acilimYap({ ...istek, tur: 'evet-hayir', tur_no: i })
      const k = a.kartlar[0]
      if (k.kart.evetHayir !== 'evet') continue
      ;(k.ters ? ters : duz).set(k.kart.id, a.cevap!.guc)
    }
    const ortak = [...ters.keys()].filter((id) => duz.has(id))
    expect(ortak.length).toBeGreaterThan(0)
    for (const id of ortak) {
      expect(ters.get(id)!, id).toBeLessThan(duz.get(id)!)
      // Ters gelmesi kartı "hayır"a çevirmez, yalnızca cevabı koşullu kılar.
      expect(ters.get(id)!, id).toBeGreaterThanOrEqual(0.5)
    }
  })

  it('cevabın gücü 0 ile 1 arasında kalır ve yönüyle tutarlıdır', () => {
    for (let i = 0; i < 120; i++) {
      const c = acilimYap({ ...istek, tur: 'evet-hayir', tur_no: i }).cevap!
      expect(c.guc).toBeGreaterThan(0)
      expect(c.guc).toBeLessThan(1)
      expect(c.deger).toBe(c.guc >= 0.5 ? 'evet' : 'hayir')
    }
  })

  it('özet açılımın gerçek bileşimini anlatır', () => {
    const a = acilimYap({ ...istek, tur: 'kelt' })
    const majorSayisi = a.kartlar.filter((k) => k.kart.takim === 'major').length
    if (majorSayisi === 0) expect(a.ozet).toContain('hiç Majör Arkana yok')
    else expect(a.ozet).toContain(String(majorSayisi))
    expect(a.ozet.length).toBeGreaterThan(120)
  })

  it('ters oranı uzun vadede beklenen aralıkta kalır', () => {
    let ters = 0
    let toplam = 0
    for (let i = 0; i < 400; i++) {
      for (const k of acilimYap({ ...istek, tur: 'uclu', tur_no: i }).kartlar) {
        toplam++
        if (k.ters) ters++
      }
    }
    expect(ters / toplam).toBeGreaterThan(0.24)
    expect(ters / toplam).toBeLessThan(0.4)
  })
})
