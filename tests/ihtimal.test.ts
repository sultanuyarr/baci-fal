import { describe, expect, it } from 'vitest'
import {
  ihtimalleriDuzenle,
  ihtimalOzeti,
  kirp,
  olasilikEtiketi,
  OLASILIK_TABANI,
  OLASILIK_TAVANI,
  type Ihtimal,
} from '@/lib/ihtimal'
import { tamponuAnalizEt } from '@/lib/kahve/cozucu-node'
import { faliYorumla } from '@/lib/kahve/yorum'
import { acilimYap, type AcilimTuru, ACILIMLAR } from '@/lib/tarot/acilim'
import { tarotIhtimalleri } from '@/lib/tarot/ihtimaller'
import { haritaCikar } from '@/lib/dogum/harita'
import { C, cizgi, daire, halka, pngYap, tuval, yay } from './yardimci-tuval'

function ihtimal(id: string, olasilik: number): Ihtimal {
  return { id, alan: 'iş', olay: `olay ${id}`, olasilik, vade: 'yakında', gerekce: 'deneme' }
}

/** Her listede geçerli olması gereken ortak kurallar. */
function listeyiDogrula(liste: Ihtimal[], enFazla = 6) {
  expect(liste.length).toBeLessThanOrEqual(enFazla)
  expect(new Set(liste.map((i) => i.id)).size).toBe(liste.length)
  for (const i of liste) {
    expect(i.olasilik, i.id).toBeGreaterThanOrEqual(OLASILIK_TABANI)
    expect(i.olasilik, i.id).toBeLessThanOrEqual(OLASILIK_TAVANI)
    expect(i.olay.length, i.id).toBeGreaterThan(15)
    expect(i.vade.length, i.id).toBeGreaterThan(3)
    expect(i.gerekce.length, i.id).toBeGreaterThan(5)
  }
  for (let k = 1; k < liste.length; k++) {
    expect(liste[k - 1].olasilik).toBeGreaterThanOrEqual(liste[k].olasilik)
  }
}

describe('ihtimal aritmetiği', () => {
  it('olasılığı taban ve tavan arasına kırpar', () => {
    expect(kirp(-3)).toBe(OLASILIK_TABANI)
    expect(kirp(9)).toBe(OLASILIK_TAVANI)
    expect(kirp(Number.NaN)).toBe(OLASILIK_TABANI)
    expect(kirp(0.5)).toBe(0.5)
  })

  it('etiketler olasılıkla birlikte yükselir', () => {
    expect(olasilikEtiketi(0.9)).toBe('neredeyse kesin')
    expect(olasilikEtiketi(0.62)).toBe('çok kuvvetli')
    expect(olasilikEtiketi(0.5)).toBe('kuvvetli')
    expect(olasilikEtiketi(0.35)).toBe('orta')
    expect(olasilikEtiketi(0.1)).toBe('zayıf')
  })

  it('aynı olayı tekrar etmez, en olasıdan aza sıralar ve kırpar', () => {
    const duzenli = ihtimalleriDuzenle(
      [ihtimal('a', 0.3), ihtimal('b', 0.7), ihtimal('a', 0.5), ihtimal('c', 0.6)],
      2,
    )
    expect(duzenli.map((i) => i.id)).toEqual(['b', 'c'])
    // 'a' iki kez geldiğinde yüksek olan kalmalı
    expect(ihtimalleriDuzenle([ihtimal('a', 0.3), ihtimal('a', 0.5)])[0].olasilik).toBe(0.5)
  })

  it('eşit olasılıkta sıralama sabittir', () => {
    const girdi = [ihtimal('z', 0.5), ihtimal('a', 0.5), ihtimal('m', 0.5)]
    expect(ihtimalleriDuzenle(girdi).map((i) => i.id)).toEqual(
      ihtimalleriDuzenle([...girdi].reverse()).map((i) => i.id),
    )
  })

  it('özet ilk üç ihtimali cümleye döker', () => {
    expect(ihtimalOzeti([])).toBe('')
    const ozet = ihtimalOzeti([ihtimal('a', 0.7), ihtimal('b', 0.5), ihtimal('c', 0.4)])
    expect(ozet).toContain('%70')
    expect(ozet).toContain('%50')
    expect(ozet).toContain('%40')
  })
})

describe('kahve ihtimalleri', () => {
  /** Birkaç farklı şekil içeren sentetik bir fincan. */
  async function ornekFincan() {
    const px = tuval()
    cizgi(px, C + 60, C - 200, C + 150, C + 40, 6)
    daire(px, C - 160, C - 60, 34)
    halka(px, C + 40, C + 150, 45, 12)
    yay(px, C - 60, C + 120, 55, 0.4, 3.2, 7)
    return tamponuAnalizEt(await pngYap(px))
  }

  it('geçerli ve sıralı bir liste üretir', async () => {
    const fal = faliYorumla(await ornekFincan())
    expect(fal.ihtimaller.length).toBeGreaterThan(2)
    listeyiDogrula(fal.ihtimaller)
  })

  it('aynı fincan aynı yüzdeleri verir', async () => {
    const analiz = await ornekFincan()
    const a = faliYorumla(analiz).ihtimaller
    const b = faliYorumla(analiz).ihtimaller
    expect(a.map((i) => `${i.id}:${i.olasilik}`)).toEqual(b.map((i) => `${i.id}:${i.olasilik}`))
  })

  it('açıklığı yüksek fincanda "yolun açılması" ihtimali yükselir', async () => {
    const seyrek = tuval()
    daire(seyrek, C - 120, C - 120, 26)
    const acik = await tamponuAnalizEt(await pngYap(seyrek))

    const kalabalik = tuval()
    for (let x = -3; x <= 3; x++) {
      for (let y = -3; y <= 3; y++) daire(kalabalik, C + x * 70, C + y * 70, 30)
    }
    const kapali = await tamponuAnalizEt(await pngYap(kalabalik))

    expect(acik.aciklik).toBeGreaterThan(kapali.aciklik)
    const bul = (l: typeof acik) =>
      faliYorumla(l).ihtimaller.find((i) => i.id === 'olcum-acilis')?.olasilik ?? 0
    expect(bul(acik)).toBeGreaterThan(bul(kapali))
  })

  it('özet en yüksek ihtimali de söyler', async () => {
    const fal = faliYorumla(await ornekFincan())
    expect(fal.ozet).toContain('En yüksek ihtimal')
    expect(fal.ozet).toContain(`%${Math.round(fal.ihtimaller[0].olasilik * 100)}`)
  })
})

describe('tarot ihtimalleri', () => {
  const istek = {
    isim: 'Ayşe',
    dogumTarihi: '1995-04-12',
    soru: 'İşim ne olacak?',
    gun: '2026-09-21',
  }

  it('her açılım geçerli bir liste üretir', () => {
    for (const tur of Object.keys(ACILIMLAR) as AcilimTuru[]) {
      const a = acilimYap({ ...istek, tur })
      expect(a.ihtimaller.length, tur).toBeGreaterThan(0)
      listeyiDogrula(a.ihtimaller)
    }
  })

  it('aynı açılım aynı yüzdeleri verir', () => {
    const a = acilimYap({ ...istek, tur: 'kelt' })
    const b = acilimYap({ ...istek, tur: 'kelt' })
    expect(a.ihtimaller.map((i) => `${i.id}:${i.olasilik}`)).toEqual(
      b.ihtimaller.map((i) => `${i.id}:${i.olasilik}`),
    )
  })

  it('ters kart aynı kartın düz hâlinden daha düşük ihtimal alır', () => {
    // Ters kart içeren bir Kelt Haçı bul; aynı kart düz çıkan bir tur ara.
    const duzOlasilik = new Map<string, number>()
    const tersOlasilik = new Map<string, number>()
    for (let i = 0; i < 40; i++) {
      const a = acilimYap({ ...istek, tur: 'kelt', tur_no: i })
      for (const k of a.kartlar) {
        if (k.pozisyon.ad !== 'Sonuç') continue
        const hedef = a.ihtimaller.find((h) => h.id === `kart-${k.kart.id}`)
        if (!hedef) continue
        ;(k.ters ? tersOlasilik : duzOlasilik).set(k.kart.id, hedef.olasilik)
      }
    }
    const ortak = [...tersOlasilik.keys()].filter((id) => duzOlasilik.has(id))
    expect(ortak.length).toBeGreaterThan(0)
    for (const id of ortak) {
      expect(tersOlasilik.get(id)!, id).toBeLessThan(duzOlasilik.get(id)!)
    }
  })

  it('gecikme ihtimali ters kart sayısıyla birlikte artar', () => {
    const olcumler = [0, 1, 2, 3, 4, 5].map((n) => {
      const a = acilimYap({ ...istek, tur: 'kelt', tur_no: n })
      // Gecikme ihtimali listenin ilk altısına girmeyebilir; tam listeye bak.
      const tumu = tarotIhtimalleri(a.kartlar, 50)
      return {
        ters: a.kartlar.filter((k) => k.ters).length,
        olasilik: tumu.find((i) => i.id === 'acilim-gecikme')!.olasilik,
      }
    })
    const azTers = olcumler.reduce((a, b) => (b.ters < a.ters ? b : a))
    const cokTers = olcumler.reduce((a, b) => (b.ters > a.ters ? b : a))
    if (azTers.ters < cokTers.ters) {
      expect(cokTers.olasilik).toBeGreaterThan(azTers.olasilik)
    }
  })

  it('özet en yüksek ihtimali de söyler', () => {
    const a = acilimYap({ ...istek, tur: 'uclu' })
    expect(a.ozet).toContain('En yüksek ihtimal')
  })
})

describe('doğum haritası ihtimalleri', () => {
  const girdi = { isim: 'Ayşe Yılmaz', tarih: '1995-04-12', saat: '07:30', ilPlaka: 34 }

  it('geçerli ve sıralı bir liste üretir', () => {
    const h = haritaCikar(girdi, 2026)
    expect(h.ihtimaller.length).toBeGreaterThan(3)
    listeyiDogrula(h.ihtimaller)
  })

  it('aynı doğum ve aynı yıl aynı yüzdeleri verir', () => {
    const a = haritaCikar(girdi, 2026).ihtimaller
    const b = haritaCikar(girdi, 2026).ihtimaller
    expect(a.map((i) => `${i.id}:${i.olasilik}`)).toEqual(b.map((i) => `${i.id}:${i.olasilik}`))
  })

  it('kişisel yıl değişince listenin başı da değişir', () => {
    const a = haritaCikar(girdi, 2026)
    const b = haritaCikar(girdi, 2027)
    expect(a.numeroloji.kisiselYil.sayi).not.toBe(b.numeroloji.kisiselYil.sayi)
    expect(a.ihtimaller.map((i) => i.id)).not.toEqual(b.ihtimaller.map((i) => i.id))
  })

  it('listede kişisel yıldan gelen bir ihtimal mutlaka bulunur', () => {
    for (const yil of [2024, 2025, 2026, 2027, 2028]) {
      const h = haritaCikar(girdi, yil)
      expect(
        h.ihtimaller.some((i) => i.id.startsWith('yil-')),
        String(yil),
      ).toBe(true)
    }
  })

  it('doğum saati verilmese de liste üretilir', () => {
    const h = haritaCikar({ isim: 'Mehmet Demir', tarih: '1988-11-03' }, 2026)
    expect(h.yukselen).toBeNull()
    listeyiDogrula(h.ihtimaller)
    expect(h.ihtimaller.some((i) => i.id === 'yukselen')).toBe(false)
  })

  it('özet en yüksek ihtimali de söyler', () => {
    const h = haritaCikar(girdi, 2026)
    expect(h.ozet).toContain('En yüksek ihtimal')
    expect(h.ozet).toContain('kişisel yılı')
  })
})
