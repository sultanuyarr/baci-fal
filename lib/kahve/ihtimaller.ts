/**
 * Telve ölçümlerinden somut olay tahminleri çıkarır.
 *
 * İki kaynak birleşir:
 *  1. Fincanın geneli — doluluk, açıklık, hareket, simetri ve bölge
 *     yoğunlukları. Bunlar sembolden bağımsız, her fincanda okunabilen
 *     ihtimalleri verir ("beklenen haber", "kapanan bir dönem" gibi).
 *  2. Çıkan semboller — her sembolün geleneksel olarak işaret ettiği bir
 *     olay vardır. Eşleşme gücü, lekenin büyüklüğü, bulunduğu bölge ve
 *     yarım (gelenler/gidenler) olasılığı büyütür ya da küçültür.
 *
 * Yüzdeler ölçümlerin çarpımından gelir; aynı fotoğraf hep aynı listeyi verir.
 */
import {
  harmanla,
  kirp,
  type Ihtimal,
  type IhtimalAlani,
  ihtimalleriDuzenle,
} from '@/lib/ihtimal'
import type { Bolge, FincanAnalizi } from './goruntu'
import type { SembolEslesmesi } from './semboller'

/** Bölge, olayın ne zaman beklenebileceğini söyler: kenar yakın, dip uzak. */
const BOLGE_VADESI: Record<Bolge, string> = {
  kenar: 'önümüzdeki 2–3 hafta',
  orta: 'önümüzdeki 1–3 ay',
  dip: '3–6 ay içinde',
}

type SembolKehaneti = {
  alan: IhtimalAlani
  olay: string
  /** Sembolün geleneksel okumadaki kendi ağırlığı */
  taban: number
  /**
   * Sembol bir gelişi mi bir gidişi mi anlatıyor. Gelenler sağ yarıda,
   * gidenler sol yarıda güçlenir — geleneksel fincan okumasının kuralı.
   */
  tabiat: 'gelen' | 'giden'
}

const KEHANETLER: Record<string, SembolKehaneti> = {
  yol: { alan: 'yolculuk', olay: 'bir yola çıkman: taşınma, tayin ya da planlamadığın bir seyahat', taban: 0.62, tabiat: 'gelen' },
  yilan: { alan: 'kendin', olay: 'güvendiğin birinin arkandan konuştuğunu öğrenmen', taban: 0.5, tabiat: 'giden' },
  kus: { alan: 'haber', olay: 'uzun süredir beklediğin haberin gelmesi', taban: 0.68, tabiat: 'gelen' },
  balik: { alan: 'para', olay: 'ummadığın bir yerden para ya da iş fırsatı çıkması', taban: 0.58, tabiat: 'gelen' },
  kalp: { alan: 'aşk', olay: 'duygusal bir yakınlaşma ya da sana yapılacak bir itiraf', taban: 0.6, tabiat: 'gelen' },
  ay: { alan: 'kendin', olay: 'içinde sakladığın bir isteğin ilk adımını atman', taban: 0.52, tabiat: 'gelen' },
  gunes: { alan: 'iş', olay: 'emeğinin görülmesi: takdir, terfi ya da öne çıkacağın bir iş', taban: 0.6, tabiat: 'gelen' },
  goz: { alan: 'kendin', olay: 'üzerinde birinin fazla ilgisini ya da kıskançlığını hissetmen', taban: 0.45, tabiat: 'giden' },
  el: { alan: 'aile', olay: 'beklemediğin birinden somut bir yardım görmen', taban: 0.55, tabiat: 'gelen' },
  agac: { alan: 'iş', olay: 'yıllardır uğraştığın bir işin ya da eğitimin meyvesini vermesi', taban: 0.5, tabiat: 'gelen' },
  dag: { alan: 'iş', olay: 'büyük bir engelin karşına çıkması ve sabır istemesi', taban: 0.48, tabiat: 'giden' },
  kapi: { alan: 'iş', olay: 'yeni bir kapının açılması: görüşme, teklif ya da iş değişikliği', taban: 0.65, tabiat: 'gelen' },
  ev: { alan: 'aile', olay: 'evle ilgili bir değişiklik: taşınma, tadilat ya da birlikte yaşama kararı', taban: 0.52, tabiat: 'gelen' },
  yildiz: { alan: 'kendin', olay: 'uzun zamandır dilediğin şeyin gerçekleşmeye başlaması', taban: 0.55, tabiat: 'gelen' },
  anahtar: { alan: 'iş', olay: 'tıkalı bir işin çözülmesi: imza, onay ya da beklediğin cevap', taban: 0.63, tabiat: 'gelen' },
  yuzuk: { alan: 'aşk', olay: 'bir bağın resmîleşmesi: söz, nişan ya da ciddi bir karar', taban: 0.5, tabiat: 'gelen' },
  para: { alan: 'para', olay: 'eline beklemediğin bir ödeme ya da birikim fırsatı geçmesi', taban: 0.6, tabiat: 'gelen' },
  kus_surusu: { alan: 'haber', olay: 'aynı hafta içinde arka arkaya birkaç haber alman', taban: 0.55, tabiat: 'gelen' },
  bulut: { alan: 'kendin', olay: 'kafanı karıştıran bir belirsizliğin birkaç hafta daha sürmesi', taban: 0.5, tabiat: 'giden' },
  kus_yuvasi: { alan: 'aile', olay: 'aileye bir katılım ya da yuvayla ilgili sevindirici bir gelişme', taban: 0.45, tabiat: 'gelen' },
  merdiven: { alan: 'iş', olay: 'kademeli bir yükseliş: zam, terfi ya da sorumluluğun artması', taban: 0.55, tabiat: 'gelen' },
  kadeh: { alan: 'aile', olay: 'bir kutlamaya, davete ya da düğüne çağrılman', taban: 0.6, tabiat: 'gelen' },
  kus_kanadi: { alan: 'yolculuk', olay: 'son anda karar verilen kısa bir seyahat', taban: 0.52, tabiat: 'gelen' },
  kopru: { alan: 'aşk', olay: 'araya mesafe girmiş biriyle yeniden temas kurman', taban: 0.57, tabiat: 'gelen' },
  kus_tuyu: { alan: 'haber', olay: 'yazılı bir haber: mesaj, mektup ya da resmî bir evrak', taban: 0.5, tabiat: 'gelen' },
  kus_gagasi: { alan: 'haber', olay: 'beklemediğin doğrudan bir sözle ya da açık bir teklifle karşılaşman', taban: 0.48, tabiat: 'gelen' },
  carpi: { alan: 'kendin', olay: 'kurduğun bir planın ertelenmesi ya da iptal olması', taban: 0.45, tabiat: 'giden' },
  ucgen: { alan: 'para', olay: 'küçük ama zamanlaması çok iyi bir şans: ikramiye, indirim, denk gelme', taban: 0.42, tabiat: 'gelen' },
  gemi: { alan: 'yolculuk', olay: 'uzaktan gelen bir haber ya da uzun bir yolculuk gündemi', taban: 0.5, tabiat: 'gelen' },
  cicek: { alan: 'aşk', olay: 'yeni bir tanışma ya da mevcut ilişkide gözle görülür bir yumuşama', taban: 0.58, tabiat: 'gelen' },
  kuyruk: { alan: 'kendin', olay: 'kısa sürede dengeleri değiştiren ani bir gelişme', taban: 0.4, tabiat: 'gelen' },
  harf: { alan: 'haber', olay: 'adı bu harfle başlayan birinin hayatında belirleyici olması', taban: 0.45, tabiat: 'gelen' },
  ates: { alan: 'kendin', olay: 'bastırdığın bir meselenin tartışmaya dönüşmesi', taban: 0.47, tabiat: 'giden' },
  kus_izi: { alan: 'yolculuk', olay: 'birinin gitmesi ya da senin bir yerden ayrılman', taban: 0.45, tabiat: 'giden' },
}

/** Bir sembolün işaret ettiği olay; bölüm metinleri de bunu kullanır. */
export function sembolKehaneti(sembolId: string): SembolKehaneti | undefined {
  return KEHANETLER[sembolId]
}

/**
 * Fincanın geneli her alanı aynı ölçüde desteklemez: açık bir fincan iş ve
 * yolculuk ihtimalini büyütür, hareketli bir desen haberi, simetrik bir
 * desen ilişkileri.
 */
function alanEtkeni(alan: IhtimalAlani, a: FincanAnalizi): number {
  const acik = 0.9 + a.aciklik * 0.34
  const hizli = 0.92 + Math.min(a.hareket, 0.3) * 1.1
  const denge = 0.92 + a.simetri * 0.24
  const yogun = 0.94 + Math.min(a.doluluk, 0.55) * 0.42

  switch (alan) {
    case 'iş':
      return acik * (0.96 + a.bolgeler.orta * 0.22)
    case 'para':
      return acik * (0.96 + a.bolgeler.dip * 0.18)
    case 'yolculuk':
      return acik * hizli * 0.96
    case 'haber':
      return hizli * (0.96 + a.bolgeler.kenar * 0.24)
    case 'aşk':
    case 'aile':
      return denge
    case 'sağlık':
      return 1 / yogun
    case 'kendin':
      return yogun
  }
}

/** Sembolden çıkan ihtimalleri kurar. */
function sembolIhtimalleri(
  analiz: FincanAnalizi,
  eslesmeler: SembolEslesmesi[],
): Ihtimal[] {
  const sonuc: Ihtimal[] = []

  for (const e of eslesmeler) {
    const kehanet = KEHANETLER[e.sembol.id]
    if (!kehanet) continue

    const { leke } = e
    // Eşleşme gücü asıl belirleyici; zayıf bir eşleşme ihtimali de zayıflatır.
    const guvenEtkeni = 0.58 + e.guven * 0.44
    // Sembolün geleneksel bölgesinde çıkması okumayı sağlamlaştırır.
    const bolgeEtkeni = e.sembol.bolge.includes(leke.bolge) ? 1.08 : 0.9
    // Gelenler sağ yarıda, gidenler sol yarıda güçlenir.
    const beklenenYon = kehanet.tabiat === 'gelen' ? 'sag' : 'sol'
    const yonEtkeni = leke.yon === beklenenYon ? 1.08 : 0.92
    // Büyük leke, küçük lekeden daha yüksek sesle konuşur.
    const boyutEtkeni = 0.94 + Math.min(leke.alanOrani, 0.06) * 2.5

    sonuc.push({
      id: `sembol-${e.sembol.id}`,
      alan: kehanet.alan,
      olay: kehanet.olay,
      olasilik: harmanla(
        kehanet.taban,
        guvenEtkeni,
        bolgeEtkeni,
        yonEtkeni,
        boyutEtkeni,
        alanEtkeni(kehanet.alan, analiz),
      ),
      vade: BOLGE_VADESI[leke.bolge],
      gerekce: `${e.sembol.ad} sembolü ${
        leke.bolge === 'kenar' ? 'kenarda' : leke.bolge === 'orta' ? 'ortada' : 'dipte'
      }, ${leke.yon === 'sag' ? 'gelenler' : 'gidenler'} tarafında; eşleşme gücü %${Math.round(
        e.guven * 100,
      )}`,
    })
  }

  return sonuc
}

/** Sembolden bağımsız, fincanın genel ölçülerinden okunan ihtimaller. */
function olcumIhtimalleri(a: FincanAnalizi): Ihtimal[] {
  const yanFark = a.yarimlar.sag - a.yarimlar.sol

  return [
    {
      id: 'olcum-haber',
      alan: 'haber',
      olay: 'beklediğin bir haberin ya da cevabın gelmesi',
      olasilik: kirp(0.28 + a.bolgeler.kenar * 0.95 + Math.min(a.hareket, 0.3) * 0.5),
      vade: 'önümüzdeki 2–3 hafta',
      gerekce: `kenar yoğunluğu %${Math.round(a.bolgeler.kenar * 100)}`,
    },
    {
      id: 'olcum-yeni-kisi',
      alan: 'aşk',
      olay: 'hayatına yeni birinin girmesi ya da mevcut bir tanışıklığın derinleşmesi',
      olasilik: kirp(0.3 + Math.max(0, yanFark) * 2.4 + a.simetri * 0.16),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `sağ yarı sol yarıdan %${Math.round(Math.abs(yanFark) * 100)} ${
        yanFark >= 0 ? 'yoğun' : 'seyrek'
      }`,
    },
    {
      id: 'olcum-kapanis',
      alan: 'kendin',
      olay: 'bir ilişkinin, işin ya da alışkanlığın sessizce kapanması',
      olasilik: kirp(0.28 + Math.max(0, -yanFark) * 2.4),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `sol yarı — gidenler tarafı — yoğunluğu %${Math.round(a.yarimlar.sol * 100)}`,
    },
    {
      id: 'olcum-acilis',
      alan: 'iş',
      olay: 'tıkalı duran bir işin önünün açılması',
      olasilik: kirp(0.22 + a.aciklik * 0.7),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `en geniş açık alan fincanın %${Math.round(a.aciklik * 100)}'i`,
    },
    {
      id: 'olcum-karar',
      alan: 'kendin',
      olay: 'ertelediğin bir kararı vermek zorunda kalman',
      olasilik: kirp(0.26 + Math.min(a.doluluk, 0.55) * 1.1),
      vade: 'önümüzdeki 2–3 hafta',
      gerekce: `telve doluluğu %${Math.round(a.doluluk * 100)}`,
    },
    {
      id: 'olcum-yolculuk',
      alan: 'yolculuk',
      olay: 'plansız, kısa mesafeli bir yolculuk',
      olasilik: kirp(0.18 + Math.min(a.hareket, 0.3) * 1.5 + a.aciklik * 0.24),
      vade: 'önümüzdeki 1–3 ay',
      gerekce: `desen hareketliliği %${Math.round(a.hareket * 100)}`,
    },
    {
      id: 'olcum-gecmis',
      alan: 'aile',
      olay: 'geçmişten bir kişinin ya da kapanmamış bir meselenin tekrar karşına çıkması',
      olasilik: kirp(0.24 + a.bolgeler.dip * 0.95),
      vade: '3–6 ay içinde',
      gerekce: `dip yoğunluğu %${Math.round(a.bolgeler.dip * 100)}`,
    },
  ]
}

export function kahveIhtimalleri(
  analiz: FincanAnalizi,
  eslesmeler: SembolEslesmesi[],
  enFazla = 6,
): Ihtimal[] {
  return ihtimalleriDuzenle(
    [...sembolIhtimalleri(analiz, eslesmeler), ...olcumIhtimalleri(analiz)],
    enFazla,
  )
}
