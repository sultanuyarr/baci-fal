/**
 * Çin zodyağı — takvim tablosuyla değil, gerçek gökyüzü hesabıyla.
 *
 * Çin yılbaşı, kış gündönümünden sonraki ikinci yeni aydır. Her iki değer de
 * gokbilim.ts'teki Meeus algoritmalarıyla hesaplanır; böylece 1900-2100 arası
 * herhangi bir tarih için sabit bir tabloya ihtiyaç kalmaz.
 *
 * Yıl adı 60'lık döngüden gelir: 10 gök sapı (5 element × yin/yang) ve
 * 12 yer dalı (hayvanlar). 1984 = Yang Ağaç Fare, döngünün başlangıcı.
 */
import {
  gunesBoylami,
  gunesinBoylamaVardigiAn,
  julyenGunu,
  yeniAyAni,
  yeniAyNumarasi,
} from './gokbilim'

export type CinElementi = 'Ağaç' | 'Ateş' | 'Toprak' | 'Metal' | 'Su'

export type CinHayvani = {
  ad: string
  emoji: string
  metin: string
}

export const HAYVANLAR: CinHayvani[] = [
  { ad: 'Fare', emoji: '🐀', metin: 'Zeki, uyanık ve fırsatı ilk gören. Kıvraksın, kaynak bulmakta ustasın ve zor durumdan sıyrılmayı bilirsin. Tedbirlilik bazen kuşkuculuğa dönüşebilir.' },
  { ad: 'Öküz', emoji: '🐂', metin: 'Sabırlı, güvenilir ve yorulmaz. Söz verdiğini yaparsın, yükü sessizce taşırsın. İnadın hem en büyük gücün hem en büyük engelin.' },
  { ad: 'Kaplan', emoji: '🐅', metin: 'Cesur, tutkulu ve otoriteye kolay boyun eğmeyen. Risk almaktan çekinmezsin; liderliğin doğal ama sabrın kısa.' },
  { ad: 'Tavşan', emoji: '🐇', metin: 'Nazik, diplomatik ve zarif. Çatışmadan kaçınır, ortamı yumuşatırsın. İncelikli zekân seni fark ettirmeden kazandırır.' },
  { ad: 'Ejderha', emoji: '🐉', metin: 'Karizmatik, iddialı ve enerjik. Göze çarparsın, büyük düşünürsün. Gururun yüksek; eleştiriyi hazmetmek dersin.' },
  { ad: 'Yılan', emoji: '🐍', metin: 'Sezgisel, derin ve ölçülü. Az konuşur, çok gözlemlersin. Gizemli duruşun insanları hem çeker hem tedirgin eder.' },
  { ad: 'At', emoji: '🐎', metin: 'Özgür, hareketli ve coşkulu. Yolda olmak seni besler, kısıtlanmak boğar. Enerjin yüksek ama dikkatin dağınık olabilir.' },
  { ad: 'Keçi', emoji: '🐐', metin: 'Şefkatli, yaratıcı ve barışçıl. Estetik duygun güçlü, insanlara karşı yumuşaksın. Güvence ihtiyacın kararlarını belirler.' },
  { ad: 'Maymun', emoji: '🐒', metin: 'Zeki, esprili ve çözüm üretmekte hızlı. Sıkılmaya tahammülün yok; merakın seni sürekli yeni bir şeye taşıyor.' },
  { ad: 'Horoz', emoji: '🐓', metin: 'Dürüst, düzenli ve açık sözlü. Detayı kaçırmaz, doğruyu söylemekten çekinmezsin. Bu dürüstlük bazen fazla sert gelebilir.' },
  { ad: 'Köpek', emoji: '🐕', metin: 'Sadık, adaletli ve koruyucu. Güvendiğin insanın arkasında sonuna kadar durursun. Haksızlık karşısında susamazsın.' },
  { ad: 'Domuz', emoji: '🐖', metin: 'Cömert, içten ve keyfine düşkün. İnsanlara iyi niyetle yaklaşırsın; bu bazen saflık olarak kullanılabilir.' },
]

export const ELEMENT_YORUMU: Record<CinElementi, string> = {
  Ağaç: 'Ağaç elementi büyümeyi, esnekliği ve yeni filizleri getirir: genişleyen, öğrenen ve iyi niyetli bir tabiat.',
  Ateş: 'Ateş elementi tutkuyu ve görünürlüğü getirir: coşkulu, ilham veren ama çabuk tükenen bir enerji.',
  Toprak: 'Toprak elementi istikrarı ve güveni getirir: sabırlı, pratik ve sözünün arkasında duran bir yapı.',
  Metal: 'Metal elementi keskinliği ve disiplini getirir: kararlı, düzenli ve kolay taviz vermeyen bir duruş.',
  Su: 'Su elementi sezgiyi ve akışkanlığı getirir: derin düşünen, uyum sağlayan ve ikna gücü yüksek bir tabiat.',
}

const SAP_ELEMENTI: CinElementi[] = ['Ağaç', 'Ağaç', 'Ateş', 'Ateş', 'Toprak', 'Toprak', 'Metal', 'Metal', 'Su', 'Su']

export type CinBurcu = {
  yil: number
  hayvan: CinHayvani
  element: CinElementi
  kutup: 'Yang' | 'Yin'
  ad: string
  yilbasi: string
  elementYorumu: string
}

/**
 * Çin takvimi gün sınırlarını UTC+8'e göre çizer. Ay başı, yeni ay anının
 * düştüğü Çin yerel günüdür; bu ayrıntı yılbaşını bazı yıllarda tam bir ay
 * kaydırdığı için önemlidir.
 */
const CIN_OFSETI = 8 / 24

/** Jülyen Günü'nü Çin yerel gün numarasına çevirir. */
function cinGunu(jd: number): number {
  return Math.floor(jd + 0.5 + CIN_OFSETI)
}

/** Çin yerel gün numarasının başladığı andaki Jülyen Günü. */
function gunBasi(gun: number): number {
  return gun - 0.5 - CIN_OFSETI
}

function gunuTariheCevir(gun: number): string {
  return new Date((gunBasi(gun) + CIN_OFSETI - 2440587.5) * 86400000).toISOString().slice(0, 10)
}

/** Kış gündönümünün düştüğü Çin yerel günü. */
function gundonumuGunu(yil: number): number {
  return cinGunu(gunesinBoylamaVardigiAn(270, julyenGunu(yil, 12, 19)))
}

/** Verilen günü içeren ay ayının (ay başının) sıra numarası. */
function ayiKapsayanYeniAy(gun: number): number {
  let k = yeniAyNumarasi(gunBasi(gun)) - 2
  while (cinGunu(yeniAyAni(k + 1)) <= gun) k++
  while (cinGunu(yeniAyAni(k)) > gun) k--
  return k
}

/**
 * Bir ay ayının "orta terim" (中气) içerip içermediği.
 * Orta terimler Güneş'in 30°nin katlarına vardığı anlardır. Orta terimi
 * olmayan ay, artık aydır.
 */
function ortaTerimVar(k: number): boolean {
  const baslangic = gunBasi(cinGunu(yeniAyAni(k)))
  const bitis = gunBasi(cinGunu(yeniAyAni(k + 1)))
  const dilim = (jd: number) => Math.floor(gunesBoylami(jd) / 30)
  return dilim(baslangic) !== dilim(bitis)
}

/**
 * Çin yılbaşının düştüğü Çin yerel günü hesaplar.
 *
 * Kural: Kış gündönümünü içeren ay 11. aydır. Yılbaşı normalde ondan iki ay
 * sonrasıdır; ancak iki gündönümü arasında 13 ay varsa araya bir artık ay
 * girer. Artık ay, orta terimi olmayan ilk aydır; bu ay 11. ayın hemen
 * ardından geliyorsa yılbaşı bir ay daha ötelenir.
 */
export function cinYilbasiGunu(yil: number): number {
  const k11 = ayiKapsayanYeniAy(gundonumuGunu(yil - 1))
  const k11Sonraki = ayiKapsayanYeniAy(gundonumuGunu(yil))
  const ayAdedi = k11Sonraki - k11

  let kaydirma = 2
  if (ayAdedi === 13) {
    for (let i = 1; i <= 12; i++) {
      if (!ortaTerimVar(k11 + i)) {
        if (i <= 2) kaydirma = 3
        break
      }
    }
  }
  return cinGunu(yeniAyAni(k11 + kaydirma))
}

/** Çin yılbaşı tarihi (YYYY-AA-GG, Çin yerel saati). */
export function cinYilbasi(yil: number): string {
  return gunuTariheCevir(cinYilbasiGunu(yil))
}

/** ISO tarihinden Çin burcunu bulur. */
export function cinBurcu(isoTarih: string): CinBurcu {
  const [y, a, g] = isoTarih.split('-').map(Number)
  // Doğum günü, Çin takviminde hangi güne denk geliyorsa o gün üzerinden bak.
  const dogumGunu = cinGunu(julyenGunu(y, a, g, 12) - CIN_OFSETI)

  // Doğum, o yılın yılbaşından önceyse bir önceki Çin yılına aittir.
  let cinYil = y
  if (dogumGunu < cinYilbasiGunu(y)) cinYil = y - 1

  // 1984 = Yang Ağaç Fare, 60'lık döngünün başı
  const indeks = (((cinYil - 1984) % 60) + 60) % 60
  const sap = indeks % 10
  const dal = indeks % 12
  const element = SAP_ELEMENTI[sap]
  const kutup = sap % 2 === 0 ? 'Yang' : 'Yin'
  const hayvan = HAYVANLAR[dal]

  return {
    yil: cinYil,
    hayvan,
    element,
    kutup,
    ad: `${kutup} ${element} ${hayvan.ad}`,
    yilbasi: cinYilbasi(cinYil),
    elementYorumu: ELEMENT_YORUMU[element],
  }
}
