/**
 * Açılımlar: kart çekme, pozisyon yorumu ve açılım geneli sentez.
 */
import { ihtimalOzeti, type Ihtimal } from '@/lib/ihtimal'
import { DESTE, TAKIM_ADI, TAKIM_TEMASI, type EvetHayir, type Kart, type Takim } from './deste'
import { tarotIhtimalleri } from './ihtimaller'
import { karistir, tohumla, uretec } from './rastgele'

export type AcilimTuru = 'gunluk' | 'evet-hayir' | 'uclu' | 'ask' | 'kelt'

export type Pozisyon = { ad: string; aciklama: string }

export type AcilimTanimi = {
  tur: AcilimTuru
  ad: string
  ozet: string
  pozisyonlar: Pozisyon[]
}

export const ACILIMLAR: Record<AcilimTuru, AcilimTanimi> = {
  gunluk: {
    tur: 'gunluk',
    ad: 'Günün Kartı',
    ozet: 'Tek kart. Bugüne damgasını vuracak enerjiyi ve dikkat etmen gereken konuyu gösterir.',
    pozisyonlar: [{ ad: 'Bugün', aciklama: 'Günün genel havası ve sana verdiği mesaj' }],
  },
  'evet-hayir': {
    tur: 'evet-hayir',
    ad: 'Evet / Hayır',
    ozet: 'Net bir soru sor, tek kart cevaplasın. Kartın yönü ve tabiatı cevabı belirler.',
    pozisyonlar: [{ ad: 'Cevap', aciklama: 'Sorduğun soruya destenin yanıtı' }],
  },
  uclu: {
    tur: 'uclu',
    ad: 'Geçmiş — Şimdi — Gelecek',
    ozet: 'Üç kart. Bir konunun nereden geldiğini, şu an nerede durduğunu ve nereye gittiğini okur.',
    pozisyonlar: [
      { ad: 'Geçmiş', aciklama: 'Konuyu bugüne getiren kök ve geride kalan etki' },
      { ad: 'Şimdi', aciklama: 'İçinde bulunduğun durum ve şu anki asıl mesele' },
      { ad: 'Gelecek', aciklama: 'Bu gidişat sürerse varacağın yer' },
    ],
  },
  ask: {
    tur: 'ask',
    ad: 'İlişki Açılımı',
    ozet: 'Beş kart. İki tarafın duruşunu, aradaki bağı, engeli ve gidişatı ayrı ayrı gösterir.',
    pozisyonlar: [
      { ad: 'Sen', aciklama: 'Senin bu ilişkideki duruşun ve hissettiklerin' },
      { ad: 'Karşı taraf', aciklama: 'Diğer kişinin duruşu ve yaklaşımı' },
      { ad: 'Aranızdaki bağ', aciklama: 'İlişkinin gerçek doğası ve sizi bağlayan şey' },
      { ad: 'Engel', aciklama: 'İlerlemeyi zorlaştıran şey' },
      { ad: 'Gidişat', aciklama: 'Bugünkü hâliyle ilişkinin yöneldiği sonuç' },
    ],
  },
  kelt: {
    tur: 'kelt',
    ad: 'Kelt Haçı',
    ozet: 'On kart. Tarotun en kapsamlı açılımı; bir konuyu her yönüyle açar.',
    pozisyonlar: [
      { ad: 'Mevcut durum', aciklama: 'Konunun kalbi, şu an olan şey' },
      { ad: 'Engel', aciklama: 'Konuyu kesen, zorlaştıran ya da destekleyen karşıt güç' },
      { ad: 'Kök', aciklama: 'Meselenin altındaki bilinçdışı temel' },
      { ad: 'Geçmiş', aciklama: 'Yeni geride kalan, etkisi azalan dönem' },
      { ad: 'Bilinçli hedef', aciklama: 'Ulaşmak istediğin, aklından geçen sonuç' },
      { ad: 'Yakın gelecek', aciklama: 'Önümüzdeki dönemde yaklaşan gelişme' },
      { ad: 'Sen', aciklama: 'Kendini bu konuda nasıl konumlandırdığın' },
      { ad: 'Çevre', aciklama: 'Başkalarının ve dış koşulların etkisi' },
      { ad: 'Umut ve korku', aciklama: 'İçten içe beklediğin ya da çekindiğin şey' },
      { ad: 'Sonuç', aciklama: 'Bu yol sürerse varılacak nokta' },
    ],
  },
}

export type CekilenKart = {
  kart: Kart
  pozisyon: Pozisyon
  ters: boolean
  /** Pozisyona ve yöne göre yazılmış okuma */
  okuma: string
  /** Kaynak veri setinden seçilen özgün cümle */
  kaynakCumle: string
}

/** Evet-hayır açılımının cevabı; "belki" bilerek yok, zayıf cevap yüzdeyle anlatılır. */
export type CevapDegeri = Exclude<EvetHayir, 'belki'>

export type Cevap = {
  deger: CevapDegeri
  /** 0 kesin hayır, 1 kesin evet — cevabın ne kadar sağlam olduğu */
  guc: number
  metin: string
}

export type Acilim = {
  tanim: AcilimTanimi
  soru: string | null
  kartlar: CekilenKart[]
  ozet: string
  /** Kart bileşiminden türeyen, yüzdeli somut olay tahminleri */
  ihtimaller: Ihtimal[]
  /** Yalnızca evet-hayır açılımında dolu */
  cevap: Cevap | null
  /** Aynı girdilerle aynı açılımı üretmeyi sağlayan anahtar */
  tohum: string
}

export type AcilimIstegi = {
  tur: AcilimTuru
  isim?: string
  dogumTarihi?: string
  soru?: string
  /** Kullanıcı "yeniden karıştır" dediğinde değişen değer */
  tur_no?: number
  /** Günü sabitler; verilmezse bugünün tarihi kullanılır */
  gun?: string
}

/** Ters çıkma olasılığı — geleneksel okumalarda destenin yaklaşık üçte biri. */
const TERS_OLASILIK = 0.32

function bugun(): string {
  return new Date().toISOString().slice(0, 10)
}

export function tohumMetni(istek: AcilimIstegi): string {
  return [
    istek.tur,
    (istek.isim ?? '').trim().toLocaleLowerCase('tr-TR'),
    istek.dogumTarihi ?? '',
    (istek.soru ?? '').trim().toLocaleLowerCase('tr-TR'),
    istek.gun ?? bugun(),
    String(istek.tur_no ?? 0),
  ].join('|')
}

/**
 * Aynı kart, düştüğü pozisyona göre başka bir şey söyler. Bu tablo kartın
 * genel anlamını o pozisyonun sorusuna bağlar.
 */
const POZISYON_VURGUSU: Record<string, string> = {
  Bugün:
    'Bugün alacağın kararlarda bu enerjiyi hesaba kat; günün geri kalanı büyük ölçüde bu eksende ilerler.',
  Cevap:
    'Cevabı sertleştiren ya da yumuşatan şey bu kartın tabiatı; soruyu soruş biçimin de cevabın bir parçası.',
  Geçmiş:
    'Bu bitmiş bir şey değil: bugün verdiğin tepkilerin bir kısmı hâlâ buradan besleniyor.',
  Şimdi: 'Şu an yaşadığın şeyin adı bu; başka yerde aradığın sebep burada duruyor.',
  Gelecek:
    'Bugünkü tutumunu değiştirmezsen varacağın yer burası. Kart bir kader değil, bir gidişat söylüyor.',
  Sen: 'Bu senin duruşun; karşı taraf seni büyük ihtimalle böyle görüyor.',
  'Karşı taraf':
    'Diğer kişinin yaklaşımı bu. Söylediklerinden çok bu kartın anlattığına bak.',
  'Aranızdaki bağ':
    'Sizi bir arada tutan ya da yoran şey bu; ilişkinin asıl zemini burada.',
  Engel: 'Seni durduran şey bu. Bazen bir kişi, çoğu zaman kendi alışkanlığın.',
  Gidişat:
    'İlişki bugünkü hâliyle buraya gidiyor; yani müdahale edilebilir bir yön söz konusu.',
  'Mevcut durum': 'Konunun kalbi bu; diğer kartlar hep bunun etrafında konuşuyor.',
  Kök: 'Bunun farkında bile olmayabilirsin; kararlarının altındaki sessiz sebep bu.',
  'Bilinçli hedef':
    'Aklında kurduğun sonuç bu. Gerçekten istediğin şeyle aynı olup olmadığını sormakta fayda var.',
  'Yakın gelecek': 'Önümüzdeki haftalarda en somut biçimde bunu göreceksin.',
  Çevre:
    'Koşulların ve çevrendeki insanların etkisi bu yönde; tek başına karar veriyor gibi hissetsen de değilsin.',
  'Umut ve korku':
    'Bu kart hem en çok istediğin hem en çok çekindiğin şeyi aynı anda gösterir; ikisi genelde aynı şeydir.',
  Sonuç:
    'Yol bu şekilde sürerse varılacak nokta burası; aradaki kartlar bunun değiştirilebilir olduğunu söylüyor.',
}

const TERS_NOTU =
  'Kart ters geldiği için bu enerji dışarı değil içeri akıyor: konu çoğunlukla gecikme, direnç ya da henüz dile getirilmemiş bir şey olarak görünür.'

/** Kartın pozisyondaki okumasını kurar. */
function okumaYaz(kart: Kart, pozisyon: Pozisyon, ters: boolean, tur: AcilimTuru): string {
  const govde = ters ? kart.ters : kart.duz
  const baslik = `${pozisyon.ad} konumunda ${kart.ad}${ters ? ' (ters)' : ''}:`

  const vurgu = POZISYON_VURGUSU[pozisyon.ad] ?? ''

  const ek =
    tur === 'ask'
      ? `Aşk açısından: ${kart.ask}`
      : tur === 'kelt' || tur === 'uclu'
        ? `İş ve para tarafında: ${kart.kariyer} ${kart.para}`
        : tur === 'gunluk'
          ? `Bugün ilişkilerde: ${kart.ask} İşte: ${kart.kariyer}`
          : ''

  return [`${baslik} ${govde}`, vurgu, ters ? TERS_NOTU : '', ek]
    .filter(Boolean)
    .join(' ')
}

function kaynakCumleSec(kart: Kart, ters: boolean, rast: () => number): string {
  const havuz = ters ? kart.kaynak.golge : kart.kaynak.aydinlik
  const secenekler = havuz.length ? havuz : kart.kaynak.falCumleleri
  return secenekler[Math.floor(rast() * secenekler.length)] ?? kart.kaynak.ad
}

/**
 * Evet-hayır açılımı her zaman net bir taraf tutar: "belki" bir cevap değil,
 * cevabın zayıf olmasıdır. Bu yüzden kartın tabiatı bir güç puanına çevrilir
 * (0 kesin hayır, 1 kesin evet) ve taraf bu puanın yönünden okunur; puanın
 * kendisi de kullanıcıya gösterilir.
 */
const CEVAP_TABANI: Record<EvetHayir, number> = { evet: 0.8, belki: 0.56, hayir: 0.22 }

/** Takımların geleneksel evet/hayır eğilimi; kılıçlar en olumsuz takımdır. */
const TAKIM_EGILIMI: Record<Takim, number> = {
  major: 0,
  wands: 0.04,
  cups: 0.05,
  coins: 0.03,
  swords: -0.06,
}

function cevapHesapla(cekilen: CekilenKart): Cevap {
  let guc = CEVAP_TABANI[cekilen.kart.evetHayir] + TAKIM_EGILIMI[cekilen.kart.takim]

  // Ters kart olumluyu zayıflatır, olumsuzu ise biraz yumuşatır: ters gelen
  // bir "hayır" kartı kesin bir kapanma değil, geçici bir tıkanmadır.
  if (cekilen.ters) guc += guc >= 0.5 ? -0.2 : 0.1

  guc = Math.min(0.94, Math.max(0.06, guc))
  const deger: CevapDegeri = guc >= 0.5 ? 'evet' : 'hayir'
  const ad = `${cekilen.kart.ad}${cekilen.ters ? ' (ters)' : ''}`

  const metin =
    guc >= 0.72
      ? `Deste tereddüt etmiyor: evet. ${ad} bu soruya açık açık yeşil ışık yakıyor. Koşullar senden yana; tek beklenen, üstüne düşeni yapman.`
      : guc >= 0.5
        ? `Cevap evet, ama koşullu. ${ad} "olur" diyor; yalnız kendiliğinden olmasını bekleme. Eksik bir adım ya da tamamlanmamış bir hazırlık var — onu halledersen bu evet kesinleşir.`
        : guc >= 0.36
          ? `Cevap hayır — ama kapı çarpıp kapanmış değil. ${ad} "şimdi değil" diyor. Soruyu birkaç ay sonra ya da biraz değiştirerek sorarsan başka bir cevap alabilirsin.`
          : `Cevap net bir hayır. ${ad} bu yolun sana kapalı olduğunu söylüyor. Israr etmek yerine soruyu değiştirmek, hatta konuyu bütünüyle bırakmak daha çok kazandırır.`

  return { deger, guc, metin }
}

/** Açılımın geneline bakarak istatistiksel bir sentez yazar. */
function ozetYaz(
  kartlar: CekilenKart[],
  tanim: AcilimTanimi,
  ihtimaller: Ihtimal[],
): string {
  const toplam = kartlar.length
  const majorSayisi = kartlar.filter((k) => k.kart.takim === 'major').length
  const tersSayisi = kartlar.filter((k) => k.ters).length

  const takimSayaci = new Map<Takim, number>()
  for (const k of kartlar) {
    if (k.kart.takim === 'major') continue
    takimSayaci.set(k.kart.takim, (takimSayaci.get(k.kart.takim) ?? 0) + 1)
  }
  const baskin = [...takimSayaci.entries()].sort((a, b) => b[1] - a[1])[0]

  const parcalar: string[] = []

  if (toplam === 1) {
    parcalar.push(
      kartlar[0].kart.takim === 'major'
        ? 'Tek kartlık açılımda Majör Arkana çıktı: bu, günlük bir ayrıntıdan çok daha büyük bir temanın konuştuğu anlamına gelir.'
        : `Açılımın ${TAKIM_ADI[kartlar[0].kart.takim]} takımından geldi; konu ${TAKIM_TEMASI[kartlar[0].kart.takim]} etrafında dönüyor.`,
    )
  } else {
    const majorOran = majorSayisi / toplam
    if (majorOran >= 0.5) {
      parcalar.push(
        `${toplam} kartın ${majorSayisi} tanesi Majör Arkana. Bu oran yüksek: karşındaki mesele günlük bir pürüz değil, hayatının yönünü değiştirecek bir dönemeç. Kontrolün bir kısmı senin elinde değil.`,
      )
    } else if (majorSayisi === 0) {
      parcalar.push(
        `Açılımda hiç Majör Arkana yok. Yani mesele kader değil, gündelik seçimler düzeyinde: sonucu belirleyecek olan tamamen senin atacağın adımlar.`,
      )
    } else {
      parcalar.push(
        `${toplam} kartın ${majorSayisi} tanesi Majör Arkana; büyük temalarla gündelik meseleler iç içe geçmiş durumda.`,
      )
    }

    if (baskin && baskin[1] >= 2) {
      parcalar.push(
        `${TAKIM_ADI[baskin[0]]} takımı ${baskin[1]} kartla öne çıkıyor: açılımın ağırlık merkezi ${TAKIM_TEMASI[baskin[0]]}.`,
      )
    }

    const eksik = (['wands', 'cups', 'swords', 'coins'] as Takim[]).filter(
      (t) => !takimSayaci.has(t),
    )
    if (eksik.length === 1) {
      parcalar.push(
        `Açılımda hiç ${TAKIM_ADI[eksik[0]]} yok; ${TAKIM_TEMASI[eksik[0]]} bu dönem gündeminin dışında kalıyor, oraya bakmayı unutuyorsun.`,
      )
    }
  }

  const asSayisi = kartlar.filter((k) => k.kart.takim !== 'major' && k.kart.sira === 1).length
  if (asSayisi > 0) {
    parcalar.push(
      asSayisi === 1
        ? 'Açılımda bir As var: bir şey gerçekten sıfırdan başlıyor, devamı değil.'
        : `Açılımda ${asSayisi} As var. Bu, aynı anda birden fazla kapının açıldığı ender bir bileşim; hepsini birden taşımaya çalışma.`,
    )
  }

  const saraySayisi = kartlar.filter(
    (k) => k.kart.takim !== 'major' && k.kart.sira >= 11,
  ).length
  if (saraySayisi >= 2) {
    parcalar.push(
      `${saraySayisi} saray kartı çıktı: bu açılım büyük ölçüde kişilerle ilgili. Olaylardan çok, etrafındaki insanların tutumu belirleyici olacak.`,
    )
  }

  if (toplam > 1) {
    const tersOran = tersSayisi / toplam
    if (tersOran === 0) {
      parcalar.push('Hiçbir kart ters çıkmadı; enerji açık akıyor, önünde tıkanma yok.')
    } else if (tersOran >= 0.6) {
      parcalar.push(
        `Kartların ${tersSayisi} tanesi ters. Bu kadar çok ters kart, enerjinin dışarı değil içeri aktığını söyler: harekete geçmeden önce çözmen gereken bir iç mesele var.`,
      )
    } else {
      parcalar.push(
        `${tersSayisi} kart ters çıktı; bazı konularda gecikme ve direnç var ama genel akış devam ediyor.`,
      )
    }
  }

  parcalar.push(tanim.ozet)

  const ihtimalCumlesi = ihtimalOzeti(ihtimaller)
  if (ihtimalCumlesi) parcalar.push(ihtimalCumlesi)

  return parcalar.join(' ')
}

export function acilimYap(istek: AcilimIstegi): Acilim {
  const tanim = ACILIMLAR[istek.tur]
  if (!tanim) throw new Error(`Bilinmeyen açılım: ${istek.tur}`)

  const tohumAnahtari = tohumMetni(istek)
  const rast = uretec(tohumla(tohumAnahtari))
  const karilmis = karistir(DESTE, rast)

  const kartlar: CekilenKart[] = tanim.pozisyonlar.map((pozisyon, i) => {
    const kart = karilmis[i]
    const ters = rast() < TERS_OLASILIK
    return {
      kart,
      pozisyon,
      ters,
      okuma: okumaYaz(kart, pozisyon, ters, tanim.tur),
      kaynakCumle: kaynakCumleSec(kart, ters, rast),
    }
  })

  const ihtimaller = tarotIhtimalleri(kartlar)

  return {
    tanim,
    soru: istek.soru?.trim() || null,
    kartlar,
    ozet: ozetYaz(kartlar, tanim, ihtimaller),
    ihtimaller,
    cevap: tanim.tur === 'evet-hayir' ? cevapHesapla(kartlar[0]) : null,
    tohum: tohumAnahtari,
  }
}
