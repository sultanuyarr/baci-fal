/**
 * Ölçümleri geleneksel fincan okumasına çevirir.
 *
 * Geleneksel bölge okuması:
 *   kenar (ağza yakın) → yakın gelecek, dış dünya
 *   orta              → içinde bulunulan dönem
 *   dip               → geçmiş, kökler, derinde olan
 *   sağ yarı          → gelenler ve açılan yollar
 *   sol yarı          → gidenler ve geride kalanlar
 */
import type { Bolge, FincanAnalizi } from './goruntu'
import { sembolleriEsle, type SembolEslesmesi } from './semboller'

export type Bolum = { baslik: string; metin: string }

export type SembolOkumasi = {
  id: string
  ad: string
  emoji: string
  anlam: string
  konum: string
  guven: number
  olculer: {
    dairesellik: number
    uzama: number
    doluluk: number
    kivrim: number
    delik: number
    alanYuzdesi: number
  }
}

export type KahveFali = {
  ozet: string
  bolumler: Bolum[]
  semboller: SembolOkumasi[]
  kapanis: string
  olcumler: {
    doluluk: number
    simetri: number
    hareket: number
    aciklik: number
    lekeSayisi: number
    bolgeler: Record<Bolge, number>
    yarimlar: { sol: number; sag: number; ust: number; alt: number }
  }
}

const BOLGE_ADI: Record<Bolge, string> = {
  kenar: 'fincanın kenarı (yakın gelecek)',
  orta: 'fincanın ortası (içinde bulunduğun dönem)',
  dip: 'fincanın dibi (geçmiş ve kökler)',
}

const BOLGE_BASLIK: Record<Bolge, string> = {
  kenar: 'Kenar — yakın gelecek',
  orta: 'Orta — içinde bulunduğun dönem',
  dip: 'Dip — geçmişin ve köklerin',
}

/** Ölçümlerden türeyen sabit bir seçici: aynı fincan hep aynı cümleyi alır. */
function secici(analiz: FincanAnalizi): (n: number) => number {
  const tohum =
    Math.round(analiz.doluluk * 1e5) * 31 +
    Math.round(analiz.simetri * 1e5) * 17 +
    Math.round(analiz.hareket * 1e5) * 7 +
    analiz.lekeSayisi * 13 +
    Math.round(analiz.aciklik * 1e5)
  return (n: number) => Math.abs(tohum) % n
}

function dolulukYorumu(d: number, sec: (n: number) => number): string {
  if (d < 0.14) {
    return [
      'Fincanın oldukça açık kalmış. Telve az, boşluk çok: önündeki dönem sade ve ferah. Yükün hafiflemiş, karar vermek şu an her zamankinden kolay.',
      'Fincanında bolca beyaz var. Bu, kafanın nispeten berrak, yollarının açık olduğu anlamına gelir. Zorlanmadan ilerleyeceğin bir aralıktasın.',
    ][sec(2)]
  }
  if (d < 0.3) {
    return [
      'Telve dengeli dağılmış: ne boğucu bir yoğunluk var ne de boşluk. Hayatın şu sıralar kendi düzeninde akıyor, sürprizler yönetilebilir ölçüde.',
      'Fincanın dengeli okunuyor. Uğraştığın şeyler var ama hiçbiri seni altında bırakacak ağırlıkta değil. Akışına güvenebilirsin.',
    ][sec(2)]
  }
  if (d < 0.48) {
    return [
      'Fincanın epey dolu. Aynı anda birden fazla konu omzunda; zihnin sürekli meşgul. Bu yoğunluk kötü değil ama sıraya koymadığın sürece hepsi birden büyüyor.',
      'Telve yoğun. Son dönemde çok şey biriktirmişsin — hem düşünce hem sorumluluk. Biraz eleme yapmadan rahatlaman zor.',
    ][sec(2)]
  }
  return [
    'Fincanın çok koyu. Uzun süredir taşıdığın, kimseye tam anlatmadığın bir yük var. Bu kadar dolu bir fincan genelde "artık boşalt" der: paylaşmadığın şey seni yoruyor.',
    'Telve neredeyse her yeri kaplamış. Yoğun, sıkışık ve hızlı bir dönemden geçiyorsun. Önce nefes alacak bir boşluk açman, sonra karar vermen gerekiyor.',
  ][sec(2)]
}

function simetriYorumu(s: number): string {
  if (s > 0.55)
    return 'Desen iki yana dengeli dağılmış; verdiğinle aldığın birbirini tutuyor, ilişkilerinde karşılıklılık var.'
  if (s > 0.32)
    return 'Desende hafif bir yana yatma var: bir tarafa diğerinden fazla emek veriyorsun, ama denge henüz bozulmamış.'
  return 'Desen belirgin biçimde tek yana toplanmış. Enerjini tek bir konuya ya da tek bir kişiye yığmışsın; diğer alanlar bakımsız kalıyor.'
}

function hareketYorumu(h: number): string {
  if (h > 0.2)
    return 'Telvenin kenarları kırık kırık, çok hareketli. Tempolu, sık haber alınan, yerinde durulmayan bir dönem.'
  if (h > 0.1)
    return 'Desenin dokusu orta canlılıkta: işler hareketli ama kontrolden çıkmış değil.'
  return 'Telve yumuşak ve düz akmış. Sakin, oturmuş, sürprizi az bir dönemdesin.'
}

function aciklikYorumu(a: number): string {
  if (a > 0.45)
    return 'Fincanda geniş, kesintisiz bir açıklık var — geleneksel okumada buna "yol açıklığı" denir: önün açık, tıkanan bir şey yok.'
  if (a > 0.22)
    return 'Telvenin arasında düzgün bir açıklık kalmış; bir çıkış yolu görünüyor, biraz zorlamanla genişleyecek.'
  return 'Açık alanlar dar kalmış. Şu an her yönün kapalı görünüyor olabilir; önce küçük bir aralık açman, gerisi kendiliğinden gelecek.'
}

function konumCumlesi(e: SembolEslesmesi): string {
  const { leke } = e
  const yon =
    leke.yon === 'sag'
      ? 'sağ yarıda, yani gelenlerin ve açılan yolların tarafında'
      : 'sol yarıda, yani gidenlerin ve geride kalanların tarafında'
  return `${BOLGE_ADI[leke.bolge]}, ${yon} çıktı.`
}

function bolumMetni(
  bolge: Bolge,
  yogunluk: number,
  eslesmeler: SembolEslesmesi[],
): string {
  const buradakiler = eslesmeler.filter((e) => e.leke.bolge === bolge)
  const adlar = buradakiler.map((e) => e.sembol.ad.toLocaleLowerCase('tr-TR'))

  // Yoğunluk düşük olsa da belirgin bir şekil çıkmış olabilir; o zaman
  // "boş" demek yanıltıcı olur, "seyrek ama okunaklı" demek gerekir.
  const yogunlukCumle =
    yogunluk > 0.45
      ? 'Bu bölge fincanın en koyu yeri; okumanın ağırlık merkezi burada.'
      : yogunluk > 0.25
        ? 'Bu bölgede telve gözle görülür biçimde toplanmış.'
        : buradakiler.length > 0
          ? 'Bu bölgede telve seyrek ama izler belirgin: az sayıda net şekil var.'
          : yogunluk > 0.1
            ? 'Bu bölge nispeten sakin, dağınık birkaç iz dışında boş.'
            : 'Bu bölge neredeyse bomboş kalmış.'

  const anlamCumle: Record<Bolge, string> = {
    kenar:
      yogunluk > 0.25
        ? 'Önündeki birkaç hafta hareketli: haberler, davetler ve hızlı gelişen konular var.'
        : 'Yakın gelecek sakin geçecek; beklediğin büyük haber biraz daha zaman alabilir.',
    orta:
      yogunluk > 0.25
        ? 'Şu an içinde bulunduğun dönem seni fazlasıyla meşgul ediyor; bu konuyu çözmeden yeni bir şeye başlama.'
        : 'İçinde bulunduğun dönem rahat; yeni bir şeye başlamak için elverişli bir aralık.',
    dip:
      yogunluk > 0.25
        ? 'Geçmişten gelen, tam kapanmamış bir mesele hâlâ altta duruyor. Kökler derin; bugünkü tepkilerinin bir kısmı oradan besleniyor.'
        : 'Geçmişinle barışıksın; geride bıraktığın şeyler bugünü fazla yormuyor.',
  }

  const sembolCumle = adlar.length
    ? ` Burada ${adlar.join(', ')} okundu.`
    : ' Burada belirgin bir sembol çıkmadı.'

  return `${yogunlukCumle} ${anlamCumle[bolge]}${sembolCumle}`
}

export function faliYorumla(analiz: FincanAnalizi): KahveFali {
  const sec = secici(analiz)
  const eslesmeler = sembolleriEsle(analiz.lekeler, 5)

  const baskinBolge = (Object.entries(analiz.bolgeler) as [Bolge, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0]

  const yanFark = analiz.yarimlar.sag - analiz.yarimlar.sol
  const yanCumle =
    Math.abs(yanFark) < 0.05
      ? 'Telve iki yana eşit dağılmış: geçmişle gelecek arasında dengedesin.'
      : yanFark > 0
        ? 'Telve sağ yarıda daha yoğun. Geleneksel okumada bu, gelenlerin gidenlerden çok olduğu anlamına gelir: hayatına yeni insanlar ve yeni işler giriyor.'
        : 'Telve sol yarıda toplanmış. Bu, bir dönemin kapanmakta olduğuna işaret eder: bazı insanlar ve alışkanlıklar geride kalıyor.'

  const ozet = [
    dolulukYorumu(analiz.doluluk, sec),
    yanCumle,
    simetriYorumu(analiz.simetri),
  ].join(' ')

  const bolumler: Bolum[] = (['kenar', 'orta', 'dip'] as Bolge[]).map((b) => ({
    baslik: BOLGE_BASLIK[b],
    metin: bolumMetni(b, analiz.bolgeler[b], eslesmeler),
  }))

  bolumler.push({
    baslik: 'Desenin dokusu',
    metin: `${hareketYorumu(analiz.hareket)} ${aciklikYorumu(analiz.aciklik)}`,
  })

  const semboller: SembolOkumasi[] = eslesmeler.map((e) => ({
    id: e.sembol.id,
    ad: e.sembol.ad,
    emoji: e.sembol.emoji,
    anlam: e.sembol.anlam,
    konum: konumCumlesi(e),
    guven: e.guven,
    olculer: {
      dairesellik: e.leke.dairesellik,
      uzama: e.leke.uzama,
      doluluk: e.leke.doluluk,
      kivrim: e.leke.kivrim,
      delik: e.leke.delik,
      alanYuzdesi: e.leke.alanOrani * 100,
    },
  }))

  const kapanisSecenekleri = [
    `Fincanının ağırlığı ${BOLGE_ADI[baskinBolge]} tarafında. Oraya dikkat et; bu dönemin asıl konusu orada saklı.`,
    `Bu fincan en çok ${BOLGE_ADI[baskinBolge]} üzerinden konuşuyor. Cevabını orada ara.`,
  ]
  const kapanis = `${kapanisSecenekleri[sec(2)]} Ne çıkarsa çıksın, fincan yol gösterir; yolu yürüyen sensin.`

  return {
    ozet,
    bolumler,
    semboller,
    kapanis,
    olcumler: {
      doluluk: analiz.doluluk,
      simetri: analiz.simetri,
      hareket: analiz.hareket,
      aciklik: analiz.aciklik,
      lekeSayisi: analiz.lekeSayisi,
      bolgeler: analiz.bolgeler,
      yarimlar: analiz.yarimlar,
    },
  }
}
