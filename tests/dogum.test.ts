import { describe, expect, it } from 'vitest'
import { haritaCikar, ILLER, ilBul, yerelZamandanUtc } from '@/lib/dogum/harita'
import { indirge, ismiNormalize, numerolojiHesapla } from '@/lib/dogum/numeroloji'
import { boylamdanBurc, BURCLAR } from '@/lib/dogum/burc'

describe('il verisi', () => {
  it('81 il, tekil plaka ve Türkiye sınırları içinde koordinat', () => {
    expect(ILLER).toHaveLength(81)
    expect(new Set(ILLER.map((i) => i.plaka)).size).toBe(81)
    for (const il of ILLER) {
      expect(il.enlem, il.ad).toBeGreaterThan(35.5)
      expect(il.enlem, il.ad).toBeLessThan(42.5)
      expect(il.boylam, il.ad).toBeGreaterThan(25.5)
      expect(il.boylam, il.ad).toBeLessThan(45.5)
    }
  })

  it('bilinen illerin koordinatları doğrudur', () => {
    expect(ilBul(34)!.ad).toBe('İstanbul')
    expect(ilBul(34)!.enlem).toBeCloseTo(41.0, 0)
    expect(ilBul(6)!.ad).toBe('Ankara')
    expect(ilBul(35)!.ad).toBe('İzmir')
  })
})

describe('saat dilimi geçmişi', () => {
  it('2016 öncesi kışın UTC+2, yazın UTC+3 uygular', () => {
    // Türkiye 2016 Eylülüne kadar yaz saati uyguluyordu.
    expect(yerelZamandanUtc(1990, 1, 15, 12, 0).toISOString()).toBe('1990-01-15T10:00:00.000Z')
    expect(yerelZamandanUtc(1990, 6, 15, 12, 0).toISOString()).toBe('1990-06-15T09:00:00.000Z')
  })

  it('2016 sonrası yıl boyu UTC+3 uygular', () => {
    expect(yerelZamandanUtc(2020, 1, 15, 12, 0).toISOString()).toBe('2020-01-15T09:00:00.000Z')
    expect(yerelZamandanUtc(2020, 6, 15, 12, 0).toISOString()).toBe('2020-06-15T09:00:00.000Z')
  })
})

describe('numeroloji', () => {
  it('usta sayıları indirgemez', () => {
    expect(indirge(29)).toBe(11)
    expect(indirge(11)).toBe(11)
    expect(indirge(22)).toBe(22)
    expect(indirge(33)).toBe(33)
    expect(indirge(39)).toBe(3)
    expect(indirge(1)).toBe(1)
  })

  it('Türkçe harfleri temel harflerine eşler', () => {
    expect(ismiNormalize('Şükrü Çağdaş')).toEqual(['Ş', 'Ü', 'K', 'R', 'Ü', 'Ç', 'A', 'Ğ', 'D', 'A', 'Ş'])
    // Ş→S(1), Ü→U(3), K(2), R(9), Ü(3) = 18 → 9
    const n = numerolojiHesapla('Şükrü', '1990-01-01', 2026)
    expect(n.ifade.sayi).toBe(9)
  })

  it('yaşam yolunu bilinen örnekle doğrular', () => {
    // 1990-11-23 → gün 23→5, ay 11→11, yıl 1990→19→10→1; 5+11+1=17→8
    const n = numerolojiHesapla('Test', '1990-11-23', 2026)
    expect(n.yasamYolu.sayi).toBe(8)
    expect(n.yasamYolu.baslik).toBe('Yönetici')
  })

  it('sesli ve sessiz harfleri ayırır', () => {
    const n = numerolojiHesapla('Ayşe Yılmaz', '1995-04-12', 2026)
    // Ruh arzusu yalnız seslilerden, kişilik yalnız sessizlerden hesaplanır
    expect(n.ruhArzusu.sayi).not.toBe(n.ifade.sayi)
    expect(n.adimlar.some((a) => a.includes('sesli harfler'))).toBe(true)
  })

  it('her sonucun metni doludur', () => {
    const n = numerolojiHesapla('Mehmet Demir', '1988-07-04', 2026)
    for (const alan of [n.yasamYolu, n.ifade, n.ruhArzusu, n.kisilik, n.dogumGunu, n.kisiselYil]) {
      expect(alan.metin.length, String(alan.sayi)).toBeGreaterThan(30)
    }
  })
})

describe('burç dilimleri', () => {
  it('ekliptik boylamı doğru burca böler', () => {
    expect(boylamdanBurc(0).burc.ad).toBe('Koç')
    expect(boylamdanBurc(29.99).burc.ad).toBe('Koç')
    expect(boylamdanBurc(30).burc.ad).toBe('Boğa')
    expect(boylamdanBurc(359.9).burc.ad).toBe('Balık')
    expect(boylamdanBurc(185).derece).toBeCloseTo(5, 6)
  })

  it('12 burcun her biri eksiksiz tanımlıdır', () => {
    expect(BURCLAR).toHaveLength(12)
    for (const b of BURCLAR) {
      expect(b.gunes.length, b.ad).toBeGreaterThan(80)
      expect(b.ay.length, b.ad).toBeGreaterThan(40)
      expect(b.yukselen.length, b.ad).toBeGreaterThan(40)
      expect(b.anahtar.length).toBe(4)
    }
  })
})

describe('doğum haritası', () => {
  const girdi = { isim: 'Ayşe Yılmaz', tarih: '1995-04-12', saat: '14:30', ilPlaka: 34 }

  it('bilinen bir tarihte doğru güneş burcunu verir', () => {
    // 12 Nisan her zaman Koç'tur (Güneş ~22°)
    const h = haritaCikar(girdi, 2026)
    expect(h.gunes.burc.ad).toBe('Koç')
    expect(h.gunes.derece).toBeGreaterThan(20)
    expect(h.gunes.derece).toBeLessThan(24)
  })

  it('burç geçişini gerçek boylamdan yakalar', () => {
    // 2024'te Güneş 19 Nisan 15:00 UTC civarı Boğa'ya geçer.
    const once = haritaCikar({ isim: 'X', tarih: '2024-04-18', saat: '12:00', ilPlaka: 34 }, 2026)
    const sonra = haritaCikar({ isim: 'X', tarih: '2024-04-21', saat: '12:00', ilPlaka: 34 }, 2026)
    expect(once.gunes.burc.ad).toBe('Koç')
    expect(sonra.gunes.burc.ad).toBe('Boğa')
  })

  it('doğum saati ve il verilirse yükselen hesaplar', () => {
    const h = haritaCikar(girdi, 2026)
    expect(h.yukselen).not.toBeNull()
    expect(h.gogunOrtasi).not.toBeNull()
    expect(h.yukselen!.metin.length).toBeGreaterThan(40)
    expect(h.il!.ad).toBe('İstanbul')
  })

  it('saat ya da il eksikse yükseleni atlar ve nedenini yazar', () => {
    const saatsiz = haritaCikar({ isim: 'X', tarih: '1995-04-12' }, 2026)
    expect(saatsiz.yukselen).toBeNull()
    expect(saatsiz.notlar.join(' ')).toContain('12:00')
    expect(saatsiz.notlar.join(' ')).toContain('yükselen')
  })

  it('yükselen gün içinde saate göre değişir', () => {
    const sabah = haritaCikar({ ...girdi, saat: '06:00' }, 2026)
    const aksam = haritaCikar({ ...girdi, saat: '18:00' }, 2026)
    expect(sabah.yukselen!.burc.ad).not.toBe(aksam.yukselen!.burc.ad)
  })

  it('aynı girdi her zaman aynı haritayı verir', () => {
    expect(JSON.stringify(haritaCikar(girdi, 2026))).toBe(JSON.stringify(haritaCikar(girdi, 2026)))
  })

  it('Ay evresi ve aydınlanma tutarlıdır', () => {
    const h = haritaCikar(girdi, 2026)
    expect(h.ay.evre.aydinlanma).toBeGreaterThanOrEqual(0)
    expect(h.ay.evre.aydinlanma).toBeLessThanOrEqual(1)
    expect(h.ay.evre.yorum.length).toBeGreaterThan(50)
  })

  it('element dengesi büyük üçlüyü sayar', () => {
    const h = haritaCikar(girdi, 2026)
    const toplam = Object.values(h.denge.elementler).reduce((a, b) => a + b, 0)
    expect(toplam).toBe(3)
  })

  it('özet kişinin adını ve üç ana yerleşimi içerir', () => {
    const h = haritaCikar(girdi, 2026)
    expect(h.ozet).toContain('Ayşe')
    expect(h.ozet).toContain(h.gunes.burc.ad)
    expect(h.ozet).toContain(h.cin.hayvan.ad)
    expect(h.ozet.length).toBeGreaterThan(150)
  })
})
