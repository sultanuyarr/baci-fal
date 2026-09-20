import { describe, expect, it } from 'vitest'
import { tamponuAnalizEt } from '@/lib/kahve/cozucu-node'
import { sembolleriEsle } from '@/lib/kahve/semboller'
import { faliYorumla } from '@/lib/kahve/yorum'
import { C, cizgi, daire, halka, pngYap, tuval, ucgen, yay } from './yardimci-tuval'

describe('şekil betimleyicileri', () => {
  it('dolu daireyi dairesel ve delik­siz ölçer', async () => {
    const px = tuval()
    daire(px, C, C, 55)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    expect(lekeler).toHaveLength(1)
    expect(lekeler[0].dairesellik).toBeGreaterThan(0.85)
    expect(lekeler[0].uzama).toBeLessThan(1.1)
    expect(lekeler[0].delik).toBe(0)
    // Dairenin sınırlayıcı kutusunu doldurma oranı teorik olarak π/4 ≈ 0.785
    expect(lekeler[0].doluluk).toBeCloseTo(0.785, 1)
  })

  it('çizgiyi uzun ve yönlü ölçer', async () => {
    const dikeyPx = tuval()
    cizgi(dikeyPx, C, C - 150, C, C + 150, 4)
    const dikey = await tamponuAnalizEt(await pngYap(dikeyPx))
    expect(dikey.lekeler[0].uzama).toBeGreaterThan(10)
    expect(dikey.lekeler[0].dikeylik).toBeGreaterThan(0.9)

    const yatayPx = tuval()
    cizgi(yatayPx, C - 150, C, C + 150, C, 4)
    const yatay = await tamponuAnalizEt(await pngYap(yatayPx))
    expect(yatay.lekeler[0].dikeylik).toBeLessThan(0.1)
  })

  it('halkanın içindeki boşluğu delik olarak sayar', async () => {
    const px = tuval()
    halka(px, C, C, 60, 14)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    expect(lekeler[0].delik).toBe(1)
    expect(lekeler[0].konveksDoluluk).toBeLessThan(0.6)
  })

  it('üçgenin kutu doldurma oranını ~0.5 ölçer', async () => {
    const px = tuval()
    ucgen(px, C, C, 80)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    expect(lekeler[0].doluluk).toBeCloseTo(0.5, 1)
  })

  it('kıvrımlı şekli düşük konveks dolulukla ayırt eder', async () => {
    const px = tuval()
    yay(px, C - 50, C, 60, -1.2, 1.6, 5)
    yay(px, C + 55, C, 60, 1.9, 4.6, 5)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    expect(lekeler[0].kivrim).toBeGreaterThan(0.5)
  })
})

describe('bölge ve konum', () => {
  it('lekeyi bulunduğu bölgeye yerleştirir', async () => {
    const px = tuval()
    daire(px, C + 200, C, 26) // kenara yakın, sağda
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    expect(lekeler[0].bolge).toBe('kenar')
    expect(lekeler[0].yon).toBe('sag')

    const dipPx = tuval()
    daire(dipPx, C, C, 26) // tam merkez
    const dip = await tamponuAnalizEt(await pngYap(dipPx))
    expect(dip.lekeler[0].bolge).toBe('dip')
  })

  it('sağa yığılmış telveyi sağ yarıda daha yoğun ölçer', async () => {
    const px = tuval()
    for (let k = 0; k < 6; k++) daire(px, C + 90 + (k % 3) * 40, C - 100 + k * 35, 22)
    const a = await tamponuAnalizEt(await pngYap(px))
    expect(a.yarimlar.sag).toBeGreaterThan(a.yarimlar.sol)
  })
})

describe('sembol eşleştirme', () => {
  it('uzun ince izi yol/yılan ailesinden bir sembolle eşler', async () => {
    const px = tuval()
    cizgi(px, C - 180, C + 40, C + 170, C - 30, 4)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    const [e] = sembolleriEsle(lekeler)
    expect(e).toBeDefined()
    expect(['yol', 'yilan', 'kopru', 'kuyruk', 'anahtar']).toContain(e.sembol.id)
  })

  it('içi boş çemberi yüzük olarak okur', async () => {
    const px = tuval()
    halka(px, C + 120, C - 60, 45, 11)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    const [e] = sembolleriEsle(lekeler)
    expect(e.sembol.id).toBe('yuzuk')
  })

  it('aynı sembolü iki kez atamaz', async () => {
    const px = tuval()
    for (const [dx, dy] of [[-150, -100], [140, -90], [0, 150], [150, 90], [-140, 100]])
      daire(px, C + dx, C + dy, 30)
    const { lekeler } = await tamponuAnalizEt(await pngYap(px))
    const e = sembolleriEsle(lekeler)
    expect(new Set(e.map((x) => x.sembol.id)).size).toBe(e.length)
  })
})

describe('okuma bütünlüğü', () => {
  it('aynı fotoğraf her seferinde aynı falı verir', async () => {
    const px = tuval()
    daire(px, C - 120, C - 80, 40)
    cizgi(px, C, C + 60, C + 170, C + 20, 5)
    halka(px, C + 110, C - 120, 38, 10)
    const png = await pngYap(px)

    const bir = faliYorumla(await tamponuAnalizEt(png))
    const iki = faliYorumla(await tamponuAnalizEt(png))
    expect(JSON.stringify(bir)).toBe(JSON.stringify(iki))
  })

  it('farklı fotoğraflar farklı fal üretir', async () => {
    const a = tuval()
    daire(a, C - 100, C - 100, 50)
    const b = tuval()
    cizgi(b, C - 170, C, C + 170, C, 6)
    yay(b, C, C + 100, 70, -2.4, 0.4, 6)

    const falA = faliYorumla(await tamponuAnalizEt(await pngYap(a)))
    const falB = faliYorumla(await tamponuAnalizEt(await pngYap(b)))
    expect(falA.ozet + falA.semboller.map((s) => s.id).join()).not.toBe(
      falB.ozet + falB.semboller.map((s) => s.id).join(),
    )
  })

  it('boş fincanı açık ve ferah okur', async () => {
    const analiz = await tamponuAnalizEt(await pngYap(tuval()))
    const fal = faliYorumla(analiz)
    expect(analiz.doluluk).toBeLessThan(0.05)
    expect(fal.semboller).toHaveLength(0)
    expect(fal.bolumler).toHaveLength(4)
    expect(fal.ozet.length).toBeGreaterThan(40)
  })

  it('yoğun fincanda birden fazla sembol okur', async () => {
    const px = tuval()
    daire(px, C - 140, C - 90, 42)
    cizgi(px, C - 30, C + 70, C + 180, C + 30, 6)
    halka(px, C + 120, C - 130, 40, 10)
    ucgen(px, C - 120, C + 120, 55)
    const fal = faliYorumla(await tamponuAnalizEt(await pngYap(px)))
    expect(fal.semboller.length).toBeGreaterThanOrEqual(3)
    for (const s of fal.semboller) {
      expect(s.guven).toBeGreaterThan(0.5)
      expect(s.anlam.length).toBeGreaterThan(50)
    }
  })
})
