import { describe, expect, it } from 'vitest'
import { istemKur, SISTEM_TALIMATI } from '@/lib/ai/istem'
import { UC } from '@/lib/ai/istemci'
import type { DogumGirdisi, KahveGirdisi, TarotGirdisi } from '@/lib/ai/tipler'
import { faliYorumla } from '@/lib/kahve/yorum'
import { tamponuAnalizEt } from '@/lib/kahve/cozucu-node'
import { acilimYap } from '@/lib/tarot/acilim'
import { haritaCikar } from '@/lib/dogum/harita'
import { C, cizgi, daire, pngYap, tuval } from './yardimci-tuval'

describe('sunucu ucunun adresi', () => {
  it('kökten yazılır, yoksa alt sayfadan yanlış adrese gider', () => {
    // "./api/yorum" olsaydı /tarot/ sayfasından /tarot/api/yorum çağrılırdı.
    expect(UC.startsWith('/')).toBe(true)
    expect(new URL(UC, 'https://ornek.test/tarot/').pathname).toBe('/api/yorum/')
  })

  it('sonda bölü çizgisi var; trailingSlash 308 yönlendirmesi olmasın', () => {
    expect(UC.endsWith('/')).toBe(true)
  })
})

describe('sistem talimatı', () => {
  it('modelin uydurmasını ve sayıları değiştirmesini yasaklar', () => {
    expect(SISTEM_TALIMATI).toContain('DIŞINA ÇIKMA')
    expect(SISTEM_TALIMATI).toContain('yüzdelerle çelişme')
    expect(SISTEM_TALIMATI).toContain('Sağlık teşhisi koyma')
  })
})

describe('kahve istemi', () => {
  it('bütün ölçümleri, sembolleri ve ihtimalleri taşır', async () => {
    const px = tuval()
    cizgi(px, C + 60, C - 200, C + 150, C + 40, 6)
    daire(px, C - 160, C - 60, 34)
    const analiz = await tamponuAnalizEt(await pngYap(px))
    const fal = faliYorumla(analiz)

    const girdi: KahveGirdisi = {
      tur: 'kahve',
      olcumler: {
        doluluk: fal.olcumler.doluluk,
        simetri: fal.olcumler.simetri,
        hareket: fal.olcumler.hareket,
        aciklik: fal.olcumler.aciklik,
        lekeSayisi: fal.olcumler.lekeSayisi,
        bolgeler: fal.olcumler.bolgeler,
        yarimlar: { sol: fal.olcumler.yarimlar.sol, sag: fal.olcumler.yarimlar.sag },
      },
      semboller: fal.semboller.map((s) => ({
        ad: s.ad,
        anlam: s.anlam,
        bolge: s.bolge,
        yon: s.yon === 'sag' ? 'sağ' : 'sol',
        guven: s.guven,
      })),
      ihtimaller: fal.ihtimaller,
    }

    const istem = istemKur(girdi)
    expect(istem).toContain('TELVENİN GENELİ')
    expect(istem).toContain(`Ayırt edilebilir leke sayısı: ${fal.olcumler.lekeSayisi}`)
    for (const s of fal.semboller) expect(istem).toContain(s.ad)
    for (const i of fal.ihtimaller) expect(istem).toContain(i.olay)
    // Fotoğrafa dair hiçbir şey gitmemeli.
    expect(istem).not.toContain('data:image')
    expect(istem).not.toContain('base64')
  })
})

describe('tarot istemi', () => {
  it('kartları, pozisyonları ve evet/hayır cevabını taşır', () => {
    const a = acilimYap({
      tur: 'evet-hayir',
      isim: 'Ayşe',
      soru: 'Bu işe girmeli miyim?',
      gun: '2026-09-21',
    })
    const girdi: TarotGirdisi = {
      tur: 'tarot',
      acilim: a.tanim.ad,
      soru: a.soru,
      kartlar: a.kartlar.map((k) => ({
        pozisyon: k.pozisyon.ad,
        pozisyonAciklamasi: k.pozisyon.aciklama,
        kart: k.kart.ad,
        takim: k.kart.takim,
        ters: k.ters,
        anahtar: k.kart.anahtar,
        anlam: k.ters ? k.kart.ters : k.kart.duz,
      })),
      cevap: { deger: a.cevap!.deger, guc: a.cevap!.guc },
      ihtimaller: a.ihtimaller,
    }

    const istem = istemKur(girdi)
    expect(istem).toContain(a.kartlar[0].kart.ad)
    expect(istem).toContain('Bu işe girmeli miyim?')
    expect(istem).toContain(a.cevap!.deger.toLocaleUpperCase('tr-TR'))
    // Model "belki" demesin diye açıkça yasaklanıyor.
    expect(istem).toContain('"belki" deme')
  })
})

describe('doğum istemi', () => {
  it('gök konumlarını, numerolojiyi ve kişisel yılı taşır', () => {
    const h = haritaCikar(
      { isim: 'Ayşe Yılmaz', tarih: '1995-04-12', saat: '07:30', ilPlaka: 34 },
      2026,
    )
    const girdi: DogumGirdisi = {
      tur: 'dogum',
      isim: h.isim,
      gunes: {
        burc: h.gunes.burc.ad,
        derece: h.gunes.derece,
        element: h.gunes.burc.element,
        nitelik: h.gunes.burc.nitelik,
      },
      ay: {
        burc: h.ay.burc.ad,
        derece: h.ay.derece,
        element: h.ay.burc.element,
        evre: h.ay.evre.ad,
        aydinlanma: h.ay.evre.aydinlanma,
      },
      yukselen: h.yukselen
        ? { burc: h.yukselen.burc.ad, derece: h.yukselen.derece, element: h.yukselen.burc.element }
        : null,
      denge: {
        elementler: h.denge.elementler,
        baskinElement: h.denge.baskinElement,
        baskinNitelik: h.denge.baskinNitelik,
      },
      numeroloji: {
        yasamYolu: { sayi: h.numeroloji.yasamYolu.sayi, baslik: h.numeroloji.yasamYolu.baslik },
        ifade: h.numeroloji.ifade.sayi,
        ruhArzusu: h.numeroloji.ruhArzusu.sayi,
        kisilik: h.numeroloji.kisilik.sayi,
        kisiselYil: { sayi: h.numeroloji.kisiselYil.sayi, yil: h.numeroloji.kisiselYilYili },
      },
      cin: { ad: h.cin.ad, hayvan: h.cin.hayvan.ad, element: h.cin.element },
      ihtimaller: h.ihtimaller,
    }

    const istem = istemKur(girdi)
    expect(istem).toContain(h.gunes.burc.ad)
    expect(istem).toContain(h.ay.burc.ad)
    expect(istem).toContain(h.cin.ad)
    expect(istem).toContain('2026 kişisel yılı')
    expect(istem).toContain(`Yaşam yolu: ${h.numeroloji.yasamYolu.sayi}`)
  })

  it('yükselen yoksa modele uydurmamasını söyler', () => {
    const h = haritaCikar({ isim: 'Mehmet Demir', tarih: '1988-11-03' }, 2026)
    const istem = istemKur({
      tur: 'dogum',
      isim: h.isim,
      gunes: {
        burc: h.gunes.burc.ad,
        derece: h.gunes.derece,
        element: h.gunes.burc.element,
        nitelik: h.gunes.burc.nitelik,
      },
      ay: {
        burc: h.ay.burc.ad,
        derece: h.ay.derece,
        element: h.ay.burc.element,
        evre: h.ay.evre.ad,
        aydinlanma: h.ay.evre.aydinlanma,
      },
      yukselen: null,
      denge: {
        elementler: h.denge.elementler,
        baskinElement: h.denge.baskinElement,
        baskinNitelik: h.denge.baskinNitelik,
      },
      numeroloji: {
        yasamYolu: { sayi: h.numeroloji.yasamYolu.sayi, baslik: h.numeroloji.yasamYolu.baslik },
        ifade: h.numeroloji.ifade.sayi,
        ruhArzusu: h.numeroloji.ruhArzusu.sayi,
        kisilik: h.numeroloji.kisilik.sayi,
        kisiselYil: { sayi: h.numeroloji.kisiselYil.sayi, yil: h.numeroloji.kisiselYilYili },
      },
      cin: { ad: h.cin.ad, hayvan: h.cin.hayvan.ad, element: h.cin.element },
      ihtimaller: h.ihtimaller,
    })
    expect(istem).toContain('hesaplanamadı')
    expect(istem).toContain('uydurma')
  })
})
