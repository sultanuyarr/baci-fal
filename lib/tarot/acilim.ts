/**
 * Açılımlar: kart çekme, pozisyon yorumu ve açılım geneli sentez.
 */
import { DESTE, TAKIM_ADI, TAKIM_TEMASI, type EvetHayir, type Kart, type Takim } from './deste'
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

export type Acilim = {
  tanim: AcilimTanimi
  soru: string | null
  kartlar: CekilenKart[]
  ozet: string
  /** Yalnızca evet-hayır açılımında dolu */
  cevap: { deger: EvetHayir; metin: string } | null
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

/** Kartın pozisyondaki okumasını kurar. */
function okumaYaz(kart: Kart, pozisyon: Pozisyon, ters: boolean, tur: AcilimTuru): string {
  const govde = ters ? kart.ters : kart.duz
  const baslik = `${pozisyon.ad} konumunda ${kart.ad}${ters ? ' (ters)' : ''}:`

  const ek =
    tur === 'ask'
      ? ` Aşk açısından: ${kart.ask}`
      : tur === 'kelt' || tur === 'uclu'
        ? ` İş ve para tarafında: ${kart.kariyer} ${kart.para}`
        : ''

  return `${baslik} ${govde}${ek}`
}

function kaynakCumleSec(kart: Kart, ters: boolean, rast: () => number): string {
  const havuz = ters ? kart.kaynak.golge : kart.kaynak.aydinlik
  const secenekler = havuz.length ? havuz : kart.kaynak.falCumleleri
  return secenekler[Math.floor(rast() * secenekler.length)] ?? kart.kaynak.ad
}

/** Evet-hayır: kartın tabiatı ve yönü birlikte karar verir. */
function cevapHesapla(cekilen: CekilenKart): { deger: EvetHayir; metin: string } {
  const temel = cekilen.kart.evetHayir
  let deger: EvetHayir = temel
  if (cekilen.ters) {
    deger = temel === 'evet' ? 'belki' : temel === 'belki' ? 'hayir' : 'hayir'
  }

  const metin =
    deger === 'evet'
      ? `Deste net konuşuyor: evet. ${cekilen.kart.ad} bu soruya yeşil ışık yakıyor — ama kendiliğinden olmasını bekleme, üstüne düşeni yap.`
      : deger === 'hayir'
        ? `Cevap hayır. ${cekilen.kart.ad}${cekilen.ters ? ' ters' : ''} çıkması, bu yolun şu an sana kapalı olduğunu söylüyor. Israr etmek yerine soruyu değiştirmeyi dene.`
        : `Kesin bir cevap yok: belki. ${cekilen.kart.ad} "koşullar henüz olgunlaşmadı" diyor. Eksik bir bilgi ya da tamamlanmamış bir adım var; onu halledersen cevap evete döner.`

  return { deger, metin }
}

/** Açılımın geneline bakarak istatistiksel bir sentez yazar. */
function ozetYaz(kartlar: CekilenKart[], tanim: AcilimTanimi): string {
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

  return {
    tanim,
    soru: istek.soru?.trim() || null,
    kartlar,
    ozet: ozetYaz(kartlar, tanim),
    cevap: tanim.tur === 'evet-hayir' ? cevapHesapla(kartlar[0]) : null,
    tohum: tohumAnahtari,
  }
}
