/**
 * Doğum haritasından önümüzdeki dönem için somut olay tahminleri çıkarır.
 *
 * Harita bir kişilik tarifidir; tek başına "ne olacağını" söylemez. Zamanı
 * veren şey kişisel yıldır: numerolojide dokuz yıllık döngünün kaçıncı
 * yılında olduğun, o yılın hangi konuyu öne çıkardığını belirler. Harita da
 * bunu şekillendirir — element dengesi hangi alanın destekli olduğunu,
 * Güneş-Ay ilişkisi kararlarının ne kadar çabuk verileceğini, eksik element
 * ise hangi tarafın gözden kaçacağını söyler.
 *
 * Yüzdeler bu üçünün çarpımıdır; aynı doğum bilgisi aynı yıl için hep aynı
 * listeyi verir.
 */
import {
  harmanla,
  kirp,
  type Ihtimal,
  type IhtimalAlani,
  ihtimalleriDuzenle,
} from '@/lib/ihtimal'
import type { Burc, Element, Nitelik } from './burc'
import type { CinBurcu, CinElementi } from './cin'
import type { NumerolojiSonucu } from './numeroloji'

/** İhtimal hesabının haritadan ihtiyaç duyduğu alanlar. */
export type HaritaOzu = {
  gunes: { burc: Burc }
  ay: { burc: Burc; evre: { aydinlanma: number } }
  yukselen: { burc: Burc } | null
  denge: {
    elementler: Record<Element, number>
    nitelikler: Record<Nitelik, number>
    baskinNitelik: Nitelik
  }
  numeroloji: NumerolojiSonucu
  cin: CinBurcu
  /** Kişisel yılın hesaplandığı takvim yılı */
  yil: number
}

type Kehanet = { alan: IhtimalAlani; olay: string; taban: number }

/** Kişisel yılın öne çıkardığı iki ana konu. */
const KISISEL_YIL_KEHANETI: Record<number, [Kehanet, Kehanet]> = {
  1: [
    { alan: 'iş', olay: 'yeni bir işe, okula ya da kendi projene başlaman', taban: 0.66 },
    { alan: 'kendin', olay: 'yıllardır ertelediğin bir kararı nihayet vermen', taban: 0.6 },
  ],
  2: [
    { alan: 'kendin', olay: 'bir sürecin beklemeni gerektirmesi ve acele edenin kaybetmesi', taban: 0.62 },
    { alan: 'aşk', olay: 'bir ortaklığın ya da ilişkinin resmîleşmesi', taban: 0.58 },
  ],
  3: [
    { alan: 'kendin', olay: 'çevreni genişletecek yeni tanışmalar', taban: 0.62 },
    { alan: 'iş', olay: 'yaratıcı bir uğraşının ya da yan işinin gelir getirmeye başlaması', taban: 0.52 },
  ],
  4: [
    { alan: 'iş', olay: 'yorucu ama kalıcı sonuç veren bir emek dönemi', taban: 0.64 },
    { alan: 'para', olay: 'düzenli bir birikim kurman ya da bir borcu kapatman', taban: 0.55 },
  ],
  5: [
    { alan: 'yolculuk', olay: 'yer değiştirmen: taşınma, uzun bir seyahat ya da iş değişikliği', taban: 0.66 },
    { alan: 'kendin', olay: 'planlarının beklemediğin biçimde değişmesi', taban: 0.6 },
  ],
  6: [
    { alan: 'aile', olay: 'aile, ev ya da sağlıkla ilgili bir sorumluluğun omzuna gelmesi', taban: 0.64 },
    { alan: 'aşk', olay: 'ilişkinde ciddi bir adım atılması', taban: 0.55 },
  ],
  7: [
    { alan: 'kendin', olay: 'içe dönüp bir konuyu derinlemesine araştırman', taban: 0.62 },
    { alan: 'sağlık', olay: 'bedeninin ve uykunun bakım istemesi', taban: 0.55 },
  ],
  8: [
    { alan: 'para', olay: 'maddi bir sıçrama: zam, terfi, büyük bir kazanç ya da büyük bir harcama', taban: 0.66 },
    { alan: 'iş', olay: 'yetkinin ve sorumluluğunun gözle görülür biçimde artması', taban: 0.6 },
  ],
  9: [
    { alan: 'kendin', olay: 'bir dönemin kapanması: bir iş, bir ilişki ya da yerleşmiş bir alışkanlık', taban: 0.66 },
    { alan: 'yolculuk', olay: 'geçmişle bağını gevşetecek bir uzaklaşma', taban: 0.5 },
  ],
  11: [
    { alan: 'kendin', olay: 'sezgilerinin seni doğru yere götürdüğü, fark edileceğin bir dönem', taban: 0.62 },
    { alan: 'sağlık', olay: 'yüksek hassasiyet: sinir sisteminin ve uykunun korunması gereken bir yıl', taban: 0.55 },
  ],
  22: [
    { alan: 'iş', olay: 'uzun vadeli, kalıcı bir yapının temelini atman', taban: 0.64 },
    { alan: 'para', olay: 'büyük ölçekli bir yatırım ya da uzun vadeli bir sorumluluk', taban: 0.55 },
  ],
}

/** Kişisel yılın kısa adı — gerekçe satırında kullanılır. */
const KISISEL_YIL_ADI: Record<number, string> = {
  1: 'başlangıç yılı',
  2: 'sabır ve ortaklık yılı',
  3: 'ifade ve sosyalleşme yılı',
  4: 'emek ve düzen yılı',
  5: 'değişim ve hareket yılı',
  6: 'sorumluluk ve yuva yılı',
  7: 'içe dönüş ve öğrenme yılı',
  8: 'hasat ve güç yılı',
  9: 'kapanış yılı',
  11: 'sezgi ve sıçrama yılı',
  22: 'kalıcı yapı kurma yılı',
}

/** Eksik kalan elementin hangi alanı aksattığı. */
const EKSIK_ELEMENT_KEHANETI: Record<Element, Kehanet> = {
  ateş: { alan: 'iş', olay: 'harekete geçmekte geciktiğin için bir fırsatın elinden kayması', taban: 0.46 },
  toprak: { alan: 'para', olay: 'plansız bıraktığın maddi bir konunun seni zorlaması', taban: 0.5 },
  hava: { alan: 'haber', olay: 'konuşulmadığı için büyüyen bir yanlış anlaşılma', taban: 0.46 },
  su: { alan: 'aşk', olay: 'karşındakinin duygusal bir ihtiyacını geç fark etmen', taban: 0.46 },
}

/** Çin elementinin yıla kattığı renk. */
const CIN_ELEMENT_KEHANETI: Record<CinElementi, Kehanet> = {
  Ağaç: { alan: 'iş', olay: 'öğrenmeyle ilgili bir kapının açılması: kurs, eğitim ya da yeni bir alan', taban: 0.48 },
  Ateş: { alan: 'kendin', olay: 'görünürlüğünün artması: seni öne çıkaran bir iş, sahne ya da tanıtım', taban: 0.48 },
  Toprak: { alan: 'aile', olay: 'yerleşmeyle ilgili bir karar: ev, arsa ya da uzun vadeli bir düzen', taban: 0.48 },
  Metal: { alan: 'para', olay: 'disiplinli bir birikimin ya da tasarrufun sonuç vermesi', taban: 0.48 },
  Su: { alan: 'yolculuk', olay: 'uzak bir yerle bağ kurman: yurt dışı, taşınma ya da uzaktan bir iş', taban: 0.48 },
}

/** Baskın niteliğin davranış olarak nasıl görüneceği. */
const NITELIK_KEHANETI: Record<Nitelik, Kehanet> = {
  öncü: { alan: 'iş', olay: 'senin başlattığın bir şeyin başkalarını da harekete geçirmesi', taban: 0.52 },
  sabit: { alan: 'kendin', olay: 'bir konuda direnmenin sonunda sana kazandırması', taban: 0.52 },
  değişken: { alan: 'yolculuk', olay: 'planın ortasında yön değiştirmen ve bunun iyi gelmesi', taban: 0.52 },
}

/** Yaşam yolunun uzun vadede hangi kapıyı açtığı. */
const YASAM_YOLU_KEHANETI: Record<number, Kehanet> = {
  1: { alan: 'iş', olay: 'kendi işini kurma ya da bir ekibin başına geçme fırsatı', taban: 0.5 },
  2: { alan: 'aşk', olay: 'bir ortaklığın hayatının yönünü belirlemesi', taban: 0.5 },
  3: { alan: 'kendin', olay: 'anlatma, yazma ya da sahne alma yoluyla fark edilmen', taban: 0.5 },
  4: { alan: 'para', olay: 'sabırla kurduğun bir düzenin somut güvence hâline gelmesi', taban: 0.5 },
  5: { alan: 'yolculuk', olay: 'hayatını değiştiren bir yer değişikliği', taban: 0.5 },
  6: { alan: 'aile', olay: 'bir yakınının sana ihtiyaç duyması ve senin devreye girmen', taban: 0.5 },
  7: { alan: 'kendin', olay: 'bir konuda uzmanlaşıp o alanda söz sahibi olman', taban: 0.5 },
  8: { alan: 'para', olay: 'maddi ölçeğini büyütecek bir karar', taban: 0.5 },
  9: { alan: 'kendin', olay: 'kendinden büyük bir işe, bir davaya ya da bir topluluğa katılman', taban: 0.5 },
  11: { alan: 'kendin', olay: 'başkalarına yol göstereceğin bir role çağrılman', taban: 0.5 },
  22: { alan: 'iş', olay: 'büyük bir planı somut bir yapıya çevirmen', taban: 0.5 },
  33: { alan: 'aile', olay: 'öğretme ya da iyileştirme yoluyla birinin hayatını değiştirmen', taban: 0.5 },
}

/** Hangi elementin hangi alanı desteklediği. */
const ALAN_ELEMENTLERI: Record<IhtimalAlani, Element[]> = {
  iş: ['ateş', 'toprak'],
  para: ['toprak'],
  yolculuk: ['ateş', 'hava'],
  haber: ['hava'],
  aşk: ['su'],
  aile: ['su', 'toprak'],
  sağlık: ['toprak'],
  kendin: [],
}

/**
 * Haritadaki element dağılımı alanı ne kadar destekliyor. "Kendin" her
 * elementle ilgili olduğu için nötr bırakılır.
 */
function elementEtkeni(alan: IhtimalAlani, elementler: Record<Element, number>): number {
  const destekleyen = ALAN_ELEMENTLERI[alan]
  if (destekleyen.length === 0) return 1
  const toplam = Object.values(elementler).reduce((a, b) => a + b, 0)
  if (toplam === 0) return 1
  const destek = destekleyen.reduce((t, e) => t + elementler[e], 0)
  return 0.86 + (destek / toplam) * 0.34
}

export function dogumIhtimalleri(oz: HaritaOzu, enFazla = 6): Ihtimal[] {
  const { elementler } = oz.denge
  const kisiselYil = oz.numeroloji.kisiselYil.sayi
  const yasamYolu = oz.numeroloji.yasamYolu.sayi
  const ham: Ihtimal[] = []

  const ekle = (id: string, k: Kehanet, vade: string, gerekce: string, ...etkenler: number[]) => {
    ham.push({
      id,
      alan: k.alan,
      olay: k.olay,
      olasilik: harmanla(k.taban, elementEtkeni(k.alan, elementler), ...etkenler),
      vade,
      gerekce,
    })
  }

  // 1) Kişisel yıl — zamanı veren asıl etken.
  const yilKehanetleri = KISISEL_YIL_KEHANETI[kisiselYil]
  if (yilKehanetleri) {
    // Kişisel yıl yaşam yoluyla aynı sayıya düştüyse konu iki kat vurgulanır.
    const ortusme = kisiselYil === yasamYolu ? 1.12 : 1
    yilKehanetleri.forEach((k, i) => {
      ekle(
        `yil-${kisiselYil}-${i}`,
        k,
        i === 0 ? `${oz.yil} yılı boyunca` : `${oz.yil}'nin ikinci yarısında`,
        `${oz.yil} kişisel yılın ${kisiselYil} — ${KISISEL_YIL_ADI[kisiselYil] ?? 'geçiş yılı'}`,
        ortusme,
        i === 0 ? 1.06 : 0.94,
      )
    })
  }

  // 2) Yaşam yolu — yıla bağlı değil, uzun vadeli kapı.
  const yolKehaneti = YASAM_YOLU_KEHANETI[yasamYolu]
  if (yolKehaneti) {
    ekle(
      `yasam-yolu-${yasamYolu}`,
      yolKehaneti,
      'önümüzdeki birkaç yıl içinde',
      `yaşam yolun ${yasamYolu} — "${oz.numeroloji.yasamYolu.baslik}"`,
    )
  }

  // 3) Eksik element — haritada hiç bulunmayan element bir kör nokta yaratır.
  for (const element of ['ateş', 'toprak', 'hava', 'su'] as Element[]) {
    if (elementler[element] > 0) continue
    const k = EKSIK_ELEMENT_KEHANETI[element]
    ham.push({
      id: `eksik-${element}`,
      alan: k.alan,
      olay: k.olay,
      olasilik: kirp(k.taban),
      vade: `${oz.yil} içinde`,
      gerekce: `haritanda hiç ${element} elementi yok`,
    })
  }

  // 4) Güneş ile Ay aynı elementte mi — kararların ne kadar çabuk verildiği.
  const uyumlu = oz.gunes.burc.element === oz.ay.burc.element
  ham.push({
    id: 'gunes-ay',
    alan: 'kendin',
    olay: uyumlu
      ? 'kararlarını tereddüt etmeden verip arkasında durman'
      : 'istediğin şeyle ihtiyacın olan şey arasında seçim yapmak zorunda kalman',
    olasilik: kirp(uyumlu ? 0.52 : 0.6),
    vade: `${oz.yil} içinde`,
    gerekce: uyumlu
      ? `Güneş ve Ay aynı elementte (${oz.gunes.burc.element})`
      : `Güneş ${oz.gunes.burc.element}, Ay ${oz.ay.burc.element} elementinde`,
  })

  // 5) Ay evresi — doğum anındaki aydınlanma duygusal tonu belirler.
  const isik = oz.ay.evre.aydinlanma
  if (isik > 0.72) {
    ham.push({
      id: 'ay-dolu',
      alan: 'aşk',
      olay: 'bir ilişkide birikmiş bir şeyin açığa çıkması ve konuşulması',
      olasilik: kirp(0.4 + isik * 0.26),
      vade: 'önümüzdeki 6–12 ay',
      gerekce: `doğduğunda Ay %${Math.round(isik * 100)} aydınlıktı`,
    })
  } else if (isik < 0.28) {
    ham.push({
      id: 'ay-yeni',
      alan: 'kendin',
      olay: 'yalnız kalma ve her şeye sıfırdan başlama isteğinin güçlenmesi',
      olasilik: kirp(0.4 + (0.28 - isik) * 0.7),
      vade: 'önümüzdeki 6–12 ay',
      gerekce: `doğduğunda Ay %${Math.round(isik * 100)} aydınlıktı`,
    })
  }

  // 6) Baskın nitelik ve Çin elementi — davranış ve yılın rengi.
  ekle(
    `nitelik-${oz.denge.baskinNitelik}`,
    NITELIK_KEHANETI[oz.denge.baskinNitelik],
    `${oz.yil} içinde`,
    `haritanda ${oz.denge.baskinNitelik} nitelik ağır basıyor`,
  )
  ekle(
    `cin-${oz.cin.element}`,
    CIN_ELEMENT_KEHANETI[oz.cin.element],
    'önümüzdeki 6–12 ay',
    `Çin takviminde ${oz.cin.ad}`,
  )

  // 7) Yükselen hesaplanabildiyse dış dünyayla ilgili bir ihtimal daha.
  if (oz.yukselen) {
    ham.push({
      id: 'yukselen',
      alan: 'iş',
      olay: `ilk izleniminin — ${oz.yukselen.burc.anahtar[0]} duruşunun — sana beklemediğin bir kapı açması`,
      olasilik: kirp(0.44 * elementEtkeni('iş', elementler) + 0.08),
      vade: `${oz.yil} içinde`,
      gerekce: `yükselen burcun ${oz.yukselen.burc.ad}`,
    })
  }

  return ihtimalleriDuzenle(ham, enFazla)
}
