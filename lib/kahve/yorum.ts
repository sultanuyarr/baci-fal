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
import { ihtimalOzeti, type Ihtimal } from '@/lib/ihtimal'
import type { Bolge, FincanAnalizi } from './goruntu'
import { kahveIhtimalleri, sembolKehaneti } from './ihtimaller'
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
  /** Ölçümlerden türeyen, yüzdeli somut olay tahminleri */
  ihtimaller: Ihtimal[]
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

/** Bölgedeki izlerin sağ/sol dağılımı: gelenler mi ağır basıyor, gidenler mi. */
function dagilimCumlesi(bolge: Bolge, analiz: FincanAnalizi): string {
  const izler = analiz.lekeler.filter((l) => l.bolge === bolge && l.alanOrani >= 0.0009)
  if (izler.length < 2) return ''
  const sag = izler.filter((l) => l.yon === 'sag').length
  const sol = izler.length - sag
  if (sag === sol) {
    return ` Buradaki ${izler.length} iz iki yana eşit dağılmış; gelenle giden bu bölgede başa baş.`
  }
  return sag > sol
    ? ` Buradaki ${izler.length} izin ${sag} tanesi sağ yarıda: bu bölgedeki hareketin çoğu sana doğru gelen bir şeyle ilgili.`
    : ` Buradaki ${izler.length} izin ${sol} tanesi sol yarıda: buradaki hareket daha çok geride bıraktığın bir şeyle ilgili.`
}

/** Yoğunluğa göre bölgenin ne anlattığı — üç kademeli. */
const BOLGE_ANLAMI: Record<Bolge, [string, string, string]> = {
  kenar: [
    'Önündeki birkaç hafta yoğun geçecek: peş peşe haberler, davetler ve hızlı karar isteyen konular var. Kenarın bu kadar dolu olması, gelişmelerin senden değil dışarıdan geleceğini söyler.',
    'Yakın gelecekte birkaç hareketli gün var ama tempo taşınabilir düzeyde. Bir iki haber bekleyebilirsin; büyük olan değil, işleri yerinden oynatan küçük olanlar.',
    'Yakın gelecek sakin görünüyor. Beklediğin büyük haber bu aralıkta gelmeyebilir; bu boşluk bir gecikme değil, hazırlanmak için verilmiş bir süre.',
  ],
  orta: [
    'İçinde bulunduğun dönem seni fazlasıyla meşgul ediyor; ortanın bu kadar koyu olması, aynı anda dönen birden fazla konu demek. Bunlardan birini kapatmadan yenisine başlarsan hiçbiri bitmiyor.',
    'Şu anki dönem dolu ama dengeli: hem uğraştığın bir konu var hem de nefes alacak yer. Bu aralık, elindekini toparlamak için uygun.',
    'İçinde bulunduğun dönem rahat; ortanın boş kalması yeni bir şeye başlamak için elverişli bir aralıkta olduğunu gösterir.',
  ],
  dip: [
    'Geçmişten gelen, tam kapanmamış bir mesele hâlâ altta duruyor ve dip bu kadar koyuyken bugünkü tepkilerinin bir kısmı oradan besleniyor. Muhtemelen kişiyle değil, o kişiyle yaşadığın şeyle uğraşıyorsun.',
    'Dipte bir miktar birikim var: tamamen kapanmamış ama seni de durdurmayan bir konu. Arada bir aklına geliyor, sonra kendi kendine geçiyor.',
    'Geçmişinle barışıksın; dibin hafif kalması geride bıraktığın şeylerin bugünü yormadığını gösterir.',
  ],
}

/** Bölgenin yoğunluğuna göre somut bir öneri. */
const BOLGE_ONERISI: Record<Bolge, [string, string]> = {
  kenar: [
    'Bu yoğunlukta gelen şeyi kaçırmamak önemli: dönmediğin bir telefon ya da açmadığın bir mesaj, listenin başındaki ihtimali geciktirir.',
    'Kenar boşken kapıyı senin çalman gerekir; beklemekle değil, aramakla sonuç alacağın bir dönem.',
  ],
  orta: [
    'Enerjini bölme: bu dönem yeni bir şey eklemenin değil, elindekini bitirmenin dönemi.',
    'Bu boşluk kalıcı değil; şimdi başlattığın şey önümüzdeki aylarda asıl konun olacak.',
  ],
  dip: [
    'Dipteki ağırlık genelde tek bir kişiyle ilgilidir; söylenmemiş bir cümle, aylardır süren bir gerginliği tek seferde çözebilir.',
    'Dibin hafifliği sana şunu veriyor: eski bir konuya dönmek yerine önüne bakabilirsin.',
  ],
}

function bolumMetni(
  bolge: Bolge,
  analiz: FincanAnalizi,
  eslesmeler: SembolEslesmesi[],
): string {
  const yogunluk = analiz.bolgeler[bolge]
  const buradakiler = eslesmeler.filter((e) => e.leke.bolge === bolge)
  const adlar = buradakiler.map((e) => e.sembol.ad.toLocaleLowerCase('tr-TR'))
  const yuzde = Math.round(yogunluk * 100)

  // Yoğunluk düşük olsa da belirgin bir şekil çıkmış olabilir; o zaman
  // "boş" demek yanıltıcı olur, "seyrek ama okunaklı" demek gerekir.
  const yogunlukCumle =
    yogunluk > 0.45
      ? `Bu bölge fincanın en koyu yeri (%${yuzde} telve); okumanın ağırlık merkezi burada.`
      : yogunluk > 0.25
        ? `Bu bölgede telve gözle görülür biçimde toplanmış (%${yuzde}).`
        : buradakiler.length > 0
          ? `Bu bölgede telve seyrek (%${yuzde}) ama izler belirgin: az sayıda net şekil var.`
          : yogunluk > 0.1
            ? `Bu bölge nispeten sakin (%${yuzde}); dağınık birkaç iz dışında boş.`
            : `Bu bölge neredeyse bomboş kalmış (%${yuzde}).`

  const kademe = yogunluk > 0.35 ? 0 : yogunluk > 0.18 ? 1 : 2
  const anlamCumle = BOLGE_ANLAMI[bolge][kademe]
  const oneri = BOLGE_ONERISI[bolge][kademe === 2 ? 1 : 0]

  let sembolCumle: string
  if (buradakiler.length === 0) {
    sembolCumle = ' Burada bilinen bir sembole oturan iz çıkmadı; bu bölgenin sözü tamamen telvenin dağılımından okunuyor.'
  } else {
    const enGuclu = buradakiler.reduce((a, b) => (b.guven > a.guven ? b : a))
    const kehanet = sembolKehaneti(enGuclu.sembol.id)
    sembolCumle = ` Burada ${adlar.join(', ')} okundu.`
    if (kehanet) {
      sembolCumle += ` En güçlü eşleşme ${enGuclu.sembol.ad.toLocaleLowerCase('tr-TR')} (%${Math.round(
        enGuclu.guven * 100,
      )}); geleneksel okumada bu, ${kehanet.olay} anlamına gelir.`
    }
  }

  return `${yogunlukCumle} ${anlamCumle}${dagilimCumlesi(bolge, analiz)}${sembolCumle} ${oneri}`
}

/** Kaç ayrı iz okunduğu, okumanın ne kadar dağınık olduğunu söyler. */
function detayCumlesi(analiz: FincanAnalizi, okunanSembol: number): string {
  const l = analiz.lekeSayisi
  if (l === 0) {
    return 'Ayrı ayrı okunabilecek belirgin bir iz çıkmadı; bu okuma tamamen telvenin genel dağılımı üzerinden yapıldı.'
  }
  if (l >= 14) {
    return `Fincanda ${l} ayrı iz saydım, ${okunanSembol} tanesi bilinen bir sembole oturdu. Bu kadar parçalı bir fincan tek bir büyük olayı değil, üst üste binen birçok küçük olayı anlatır.`
  }
  if (l >= 6) {
    return `Fincanda ${l} ayrı iz var, ${okunanSembol} tanesi okunabilir bir sembole oturdu. Bu sayı konuların birbirinden ayrışabildiğini gösterir: hangisine öncelik vereceğini seçebilecek durumdasın.`
  }
  return `Fincanda yalnızca ${l} belirgin iz var${
    okunanSembol ? ` ve ${okunanSembol} tanesi sembole oturdu` : ''
  }. Az ama net iz, tek bir konunun diğer her şeyin önüne geçtiği anlamına gelir.`
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

  const ihtimaller = kahveIhtimalleri(analiz, eslesmeler)

  const ozet = [
    dolulukYorumu(analiz.doluluk, sec),
    yanCumle,
    simetriYorumu(analiz.simetri),
    detayCumlesi(analiz, eslesmeler.length),
    ihtimalOzeti(ihtimaller),
  ]
    .filter(Boolean)
    .join(' ')

  const bolumler: Bolum[] = (['kenar', 'orta', 'dip'] as Bolge[]).map((b) => ({
    baslik: BOLGE_BASLIK[b],
    metin: bolumMetni(b, analiz, eslesmeler),
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
    ihtimaller,
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
