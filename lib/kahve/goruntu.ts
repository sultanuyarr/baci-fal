/**
 * Fincan fotoğrafından ölçülebilir özellikler çıkarır.
 *
 * Bu dosya saf hesaptır: girdisi ham RGBA piksel dizisi, çıktısı sayılar.
 * Hiçbir platform kitaplığına bağlı değildir; böylece aynı kod hem tarayıcıda
 * (Canvas'tan gelen ImageData ile) hem Node'da (testlerde) çalışır ve ikisi
 * aynı sonucu verir. Ölçekleme ve kontrast germe de burada yapılır.
 *
 * Buradaki hiçbir adım rastgele değildir: aynı fotoğraf her zaman aynı sayıları
 * üretir. Yorum katmanı (semboller.ts / yorum.ts) bu sayıların üzerine kurulur.
 *
 * Boru hattı:
 *   1. Gri tonlama + kutu süzgeciyle ölçekleme
 *   2. Kontrast germe (yüzdelik tabanlı)
 *   3. Fincan diski tespiti (porselenin parlak pikselleri üzerinden)
 *   4. Otsu eşiklemesiyle telve maskesi
 *   5. Gürültü temizliği (açma: aşındır → genişlet)
 *   6. Bağlı bileşen analizi + şekil betimleyicileri
 *   7. Bölgesel yoğunluk, simetri, kenar yoğunluğu, açıklık ölçümleri
 */

/** Analiz çözünürlüğü. Büyütmek hassasiyeti değil sadece maliyeti artırır. */
const BOYUT = 460

export type Nokta = { x: number; y: number }

export type Bolge = 'kenar' | 'orta' | 'dip'

export type Leke = {
  /** Piksel cinsinden alan */
  alan: number
  /** Lekenin alanı / fincan içi alan */
  alanOrani: number
  merkez: Nokta
  /** 4·π·A/Ç² — 1'e yakın: daire, 0'a yakın: dallı/dağınık */
  dairesellik: number
  /** Ana eksen / yan eksen oranı — 1: yuvarlak, büyük: ince uzun */
  uzama: number
  /** Alan / sınırlayıcı dikdörtgen alanı */
  doluluk: number
  /** Alan / konveks kabuk alanı — düşükse şekil kıvrımlı veya çentikli */
  konveksDoluluk: number
  /** 1 - konveksDoluluk; kıvrımlılık göstergesi */
  kivrim: number
  /** Ana eksenin dikeye yakınlığı: 0 yatay, 1 dikey */
  dikeylik: number
  /** Şeklin içinde kalan kayda değer boşlukların sayısı */
  delik: number
  /** Boşlukların toplam alanı / (leke + boşluk) — yüzükte yüksek, benekli kütlede düşük */
  delikOrani: number
  /** Fincan merkezine uzaklık / fincan yarıçapı (0 dip, 1 kenar) */
  uzaklik: number
  /** Fincan merkezine göre açı; 0° sağ, 90° yukarı */
  aci: number
  bolge: Bolge
  /** Sol/sağ yarı */
  yon: 'sol' | 'sag'
}

export type FincanAnalizi = {
  genislik: number
  yukseklik: number
  fincan: { merkez: Nokta; yaricap: number }
  /** Fincan içindeki telve oranı (0-1) */
  doluluk: number
  /** Otsu eşiği (0-255) */
  esik: number
  /** Bölgelere göre telve yoğunluğu */
  bolgeler: Record<Bolge, number>
  /** Yarımlara göre telve yoğunluğu */
  yarimlar: { sol: number; sag: number; ust: number; alt: number }
  /** Dikey eksene göre ayna simetrisi (0-1) */
  simetri: number
  /** Sobel kenar yoğunluğu — desenin kırılganlığı/hareketliliği */
  hareket: number
  /** En büyük kesintisiz açık alanın fincana oranı — "yol açıklığı" */
  aciklik: number
  /** Ayırt edilebilir telve lekeleri, alana göre büyükten küçüğe */
  lekeler: Leke[]
  /** Anlamlı büyüklükteki toplam leke sayısı */
  lekeSayisi: number
  /**
   * Analizin üzerinde çalıştığı görüntü: ölçeklenmiş gri tonlama ve telve
   * maskesi. Kullanıcıya "fotoğrafında ne gördüm" katmanını çizdirmeye ve
   * görsel denetime yarar.
   */
  gorsel: {
    gri: Uint8Array
    /** 1 = telve, 0 = boş; gri ile aynı boyutta */
    maske: Uint8Array
  }
}

/** Otsu'nun yöntemiyle sınıf içi varyansı en aza indiren eşiği bulur. */
function otsuEsigi(histogram: number[], toplam: number): number {
  let toplamAgirlik = 0
  for (let i = 0; i < 256; i++) toplamAgirlik += i * histogram[i]

  let arkaAgirlik = 0
  let arkaToplam = 0
  let enIyiVaryans = -1
  let esik = 127

  for (let t = 0; t < 256; t++) {
    arkaToplam += histogram[t]
    if (arkaToplam === 0) continue
    const onToplam = toplam - arkaToplam
    if (onToplam === 0) break

    arkaAgirlik += t * histogram[t]
    const arkaOrt = arkaAgirlik / arkaToplam
    const onOrt = (toplamAgirlik - arkaAgirlik) / onToplam
    const varyans = arkaToplam * onToplam * (arkaOrt - onOrt) ** 2
    if (varyans > enIyiVaryans) {
      enIyiVaryans = varyans
      esik = t
    }
  }
  return esik
}

/**
 * Telve eşiği: Otsu'yu gerekirse iki kez uygular.
 *
 * Fincan içinde çoğu zaman üç ton bulunur: parlak porselen, ince kahve
 * tabakası ve yoğun telve. Tek geçişlik Otsu ince tabakayı da telveye katar ve
 * fincanı olduğundan çok daha dolu gösterir. Koyu sınıf diskin %38'inden
 * fazlasını kaplıyorsa eşik, yalnız o sınıfın histogramı üzerinde yeniden
 * hesaplanır; böylece geriye asıl yoğun telve kalır.
 */
function telveEsigi(hist: number[], icPiksel: number): number {
  let esik = otsuEsigi(hist, icPiksel)

  for (let gecis = 0; gecis < 2; gecis++) {
    let koyu = 0
    for (let t = 0; t <= esik; t++) koyu += hist[t]
    if (koyu <= icPiksel * 0.38 || koyu === 0) break

    const koyuHist = new Array(256).fill(0)
    for (let t = 0; t <= esik; t++) koyuHist[t] = hist[t]
    const yeni = otsuEsigi(koyuHist, koyu)
    if (yeni >= esik) break
    esik = yeni
  }

  return esik
}

/**
 * Fincanın iç diskini bulur.
 *
 * Porselen, telveden ve çoğu arka plandan parlaktır. Parlak piksellerin en
 * büyük bağlı bileşeni alınıp içindeki boşluklar (telve lekeleri) doldurulunca
 * geriye fincanın tamamı kalır. Yarıçap, merkezden 180 yöne atılan ışınların
 * maskeden çıktığı uzaklıkların ortancasıdır; ortanca kullanmak kulp ve tabak
 * gibi çıkıntıların ölçüyü şişirmesini önler.
 */
function fincaniBul(gri: Uint8Array, g: number, y: number) {
  const enBuyukYaricap = Math.min(g, y) / 2
  const varsayilan = { merkez: { x: g / 2, y: y / 2 }, yaricap: enBuyukYaricap * 0.94 }

  const hist = new Array(256).fill(0)
  for (let i = 0; i < gri.length; i++) hist[gri[i]]++
  const esik = otsuEsigi(hist, gri.length)

  const parlak = new Uint8Array(gri.length)
  let parlakSayisi = 0
  for (let p = 0; p < gri.length; p++) {
    if (gri[p] > esik) {
      parlak[p] = 1
      parlakSayisi++
    }
  }
  if (parlakSayisi < gri.length * 0.02) return varsayilan

  const fincan = enBuyukBilesen(parlak, g)
  if (!fincan) return varsayilan
  deliklerDoldur(fincan, g, y)

  let alan = 0
  let sx = 0
  let sy = 0
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < g; i++) {
      if (fincan[j * g + i]) {
        alan++
        sx += i
        sy += j
      }
    }
  }
  // Maske neredeyse tüm kareyi kaplıyorsa arka plan da parlak demektir;
  // bu durumda fincanı ayırt edemeyiz, kareye içten teğet daireye düşeriz.
  if (alan === 0 || alan > gri.length * 0.92) return varsayilan

  const cx = sx / alan
  const cy = sy / alan
  if (!fincan[Math.round(cy) * g + Math.round(cx)]) return varsayilan

  // Merkezden 180 yöne ışın at, maskeden çıkana kadar yürü.
  const uzakliklar: number[] = []
  for (let k = 0; k < 180; k++) {
    const aci = (k * Math.PI) / 90
    const dx = Math.cos(aci)
    const dy = Math.sin(aci)
    let r = 0
    while (r < enBuyukYaricap * 2) {
      const i = Math.round(cx + dx * (r + 1))
      const j = Math.round(cy + dy * (r + 1))
      if (i < 0 || j < 0 || i >= g || j >= y || !fincan[j * g + i]) break
      r++
    }
    uzakliklar.push(r)
  }
  uzakliklar.sort((a, b) => a - b)
  const ortanca = uzakliklar[Math.floor(uzakliklar.length / 2)]

  // Kenardaki parlak halkayı ve gölgeyi dışarıda bırakmak için biraz içeri al.
  const yaricap = Math.min(ortanca * 0.94, enBuyukYaricap * 0.99)
  if (yaricap < enBuyukYaricap * 0.18) return varsayilan

  return { merkez: { x: cx, y: cy }, yaricap }
}

/** Maskedeki en büyük bağlı bileşeni döndürür. */
function enBuyukBilesen(maske: Uint8Array, g: number): Uint8Array | null {
  const gezildi = new Uint8Array(maske.length)
  const yigin = new Int32Array(maske.length)
  const komsu = [-g, g, -1, 1]
  let enIyi: number[] | null = null

  for (let baslangic = 0; baslangic < maske.length; baslangic++) {
    if (!maske[baslangic] || gezildi[baslangic]) continue
    let tepe = 0
    yigin[tepe++] = baslangic
    gezildi[baslangic] = 1
    const pikseller: number[] = []
    while (tepe > 0) {
      const p = yigin[--tepe]
      pikseller.push(p)
      const px = p % g
      for (const d of komsu) {
        const q = p + d
        if (q < 0 || q >= maske.length || gezildi[q] || !maske[q]) continue
        if (Math.abs((q % g) - px) > 1) continue
        gezildi[q] = 1
        yigin[tepe++] = q
      }
    }
    if (!enIyi || pikseller.length > enIyi.length) enIyi = pikseller
  }

  if (!enIyi) return null
  const sonuc = new Uint8Array(maske.length)
  for (const p of enIyi) sonuc[p] = 1
  return sonuc
}

/** Maskenin içinde kalan, kenara bağlanmayan boşlukları doldurur. */
function deliklerDoldur(maske: Uint8Array, g: number, y: number) {
  const dis = new Uint8Array(maske.length)
  const yigin: number[] = []
  const ekle = (p: number) => {
    if (!maske[p] && !dis[p]) {
      dis[p] = 1
      yigin.push(p)
    }
  }
  for (let i = 0; i < g; i++) {
    ekle(i)
    ekle((y - 1) * g + i)
  }
  for (let j = 0; j < y; j++) {
    ekle(j * g)
    ekle(j * g + g - 1)
  }
  while (yigin.length) {
    const p = yigin.pop() as number
    const px = p % g
    for (const d of [-g, g, -1, 1]) {
      const q = p + d
      if (q < 0 || q >= maske.length) continue
      if (Math.abs((q % g) - px) > 1) continue
      ekle(q)
    }
  }
  for (let p = 0; p < maske.length; p++) if (!dis[p]) maske[p] = 1
}

/** 3x3 aşındırma + genişletme: tek piksellik gürültüyü siler, şekli korur. */
function ac(maske: Uint8Array, g: number, y: number): Uint8Array {
  const asinmis = new Uint8Array(maske.length)
  for (let j = 1; j < y - 1; j++) {
    for (let i = 1; i < g - 1; i++) {
      const p = j * g + i
      if (!maske[p]) continue
      let hepsi = 1
      for (let dy = -1; dy <= 1 && hepsi; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!maske[p + dy * g + dx]) {
            hepsi = 0
            break
          }
        }
      }
      asinmis[p] = hepsi
    }
  }
  const genis = new Uint8Array(maske.length)
  for (let j = 1; j < y - 1; j++) {
    for (let i = 1; i < g - 1; i++) {
      const p = j * g + i
      if (!asinmis[p]) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) genis[p + dy * g + dx] = 1
      }
    }
  }
  return genis
}

/** Andrew'un monoton zinciriyle konveks kabuk; şekil çentikliliği için. */
function konveksKabukAlani(noktalar: Nokta[]): number {
  if (noktalar.length < 3) return 0
  const p = [...noktalar].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  const capraz = (o: Nokta, a: Nokta, b: Nokta) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const alt: Nokta[] = []
  for (const nk of p) {
    while (alt.length >= 2 && capraz(alt[alt.length - 2], alt[alt.length - 1], nk) <= 0) alt.pop()
    alt.push(nk)
  }
  const ust: Nokta[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const nk = p[i]
    while (ust.length >= 2 && capraz(ust[ust.length - 2], ust[ust.length - 1], nk) <= 0) ust.pop()
    ust.push(nk)
  }
  const kabuk = alt.slice(0, -1).concat(ust.slice(0, -1))
  if (kabuk.length < 3) return 0

  let alan = 0
  for (let i = 0; i < kabuk.length; i++) {
    const a = kabuk[i]
    const b = kabuk[(i + 1) % kabuk.length]
    alan += a.x * b.y - b.x * a.y
  }
  return Math.abs(alan) / 2
}

function bolgeBul(uzaklik: number): Bolge {
  if (uzaklik >= 0.7) return 'kenar'
  if (uzaklik >= 0.36) return 'orta'
  return 'dip'
}

/**
 * Gri tonlamaya çevirip kutu süzgeciyle küçültür.
 *
 * Kutu süzgeci, hedef pikselin kapsadığı bütün kaynak piksellerin ortalamasını
 * alır. Tarayıcının kendi ölçekleme algoritmasına bırakılsaydı sonuç tarayıcıya
 * göre değişirdi; burada ölçeklemeyi kendimiz yaptığımız için her yerde aynı
 * sayılar çıkıyor.
 */
function griyeCevirVeKucult(rgba: Uint8ClampedArray | Uint8Array, kaynakG: number, kaynakY: number) {
  const oran = Math.min(1, BOYUT / Math.max(kaynakG, kaynakY))
  const g = Math.max(1, Math.round(kaynakG * oran))
  const y = Math.max(1, Math.round(kaynakY * oran))
  const gri = new Uint8Array(g * y)

  for (let j = 0; j < y; j++) {
    const sy0 = Math.floor((j * kaynakY) / y)
    const sy1 = Math.max(sy0 + 1, Math.floor(((j + 1) * kaynakY) / y))
    for (let i = 0; i < g; i++) {
      const sx0 = Math.floor((i * kaynakG) / g)
      const sx1 = Math.max(sx0 + 1, Math.floor(((i + 1) * kaynakG) / g))

      let toplam = 0
      let adet = 0
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const p = (sy * kaynakG + sx) * 4
          // Rec. 709 parlaklık katsayıları
          toplam += 0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2]
          adet++
        }
      }
      gri[j * g + i] = Math.round(toplam / adet)
    }
  }
  return { gri, g, y }
}

/**
 * Kontrastı gerer: histogramın %1 ve %99 yüzdelikleri 0 ve 255'e taşınır.
 * Farklı ışıkta çekilmiş fotoğrafları karşılaştırılabilir hâle getirir.
 */
function kontrastiGer(gri: Uint8Array) {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < gri.length; i++) hist[gri[i]]++

  const altSinir = gri.length * 0.01
  const ustSinir = gri.length * 0.99
  let birikim = 0
  let alt = 0
  let ust = 255
  for (let t = 0; t < 256; t++) {
    birikim += hist[t]
    if (birikim <= altSinir) alt = t
    if (birikim < ustSinir) ust = t
  }
  if (ust <= alt) return // düz görüntü; germeye gerek yok

  const olcek = 255 / (ust - alt)
  for (let i = 0; i < gri.length; i++) {
    gri[i] = Math.min(255, Math.max(0, Math.round((gri[i] - alt) * olcek)))
  }
}

/**
 * Ham RGBA piksellerden fincan analizini çıkarır.
 *
 * @param rgba    Kanal başına 1 bayt, RGBA sırasıyla piksel verisi
 * @param kaynakG Görüntünün genişliği
 * @param kaynakY Görüntünün yüksekliği
 */
export function fincaniAnalizEt(
  rgba: Uint8ClampedArray | Uint8Array,
  kaynakG: number,
  kaynakY: number,
): FincanAnalizi {
  if (rgba.length < kaynakG * kaynakY * 4) {
    throw new Error('Piksel verisi görüntü boyutlarıyla uyuşmuyor')
  }

  const { gri, g, y } = griyeCevirVeKucult(rgba, kaynakG, kaynakY)
  kontrastiGer(gri)

  const fincan = fincaniBul(gri, g, y)
  const { merkez, yaricap } = fincan
  const r2 = yaricap * yaricap

  // Fincan içi piksellerin histogramı — eşik sadece diskten hesaplanır.
  const hist = new Array(256).fill(0)
  let icPiksel = 0
  const icinde = new Uint8Array(g * y)
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < g; i++) {
      const dx = i - merkez.x
      const dy = j - merkez.y
      if (dx * dx + dy * dy <= r2) {
        const p = j * g + i
        icinde[p] = 1
        hist[gri[p]]++
        icPiksel++
      }
    }
  }
  const esik = telveEsigi(hist, icPiksel)

  // Telve = eşikten koyu pikseller.
  const hamMaske = new Uint8Array(g * y)
  for (let p = 0; p < gri.length; p++) hamMaske[p] = icinde[p] && gri[p] <= esik ? 1 : 0
  const maske = ac(hamMaske, g, y)

  // Bölgesel yoğunluklar
  const bolgeSayac: Record<Bolge, { koyu: number; toplam: number }> = {
    kenar: { koyu: 0, toplam: 0 },
    orta: { koyu: 0, toplam: 0 },
    dip: { koyu: 0, toplam: 0 },
  }
  const yarimSayac = {
    sol: { koyu: 0, toplam: 0 },
    sag: { koyu: 0, toplam: 0 },
    ust: { koyu: 0, toplam: 0 },
    alt: { koyu: 0, toplam: 0 },
  }
  let koyuToplam = 0

  for (let j = 0; j < y; j++) {
    for (let i = 0; i < g; i++) {
      const p = j * g + i
      if (!icinde[p]) continue
      const koyu = maske[p]
      koyuToplam += koyu
      const uzaklik = Math.hypot(i - merkez.x, j - merkez.y) / yaricap
      const b = bolgeBul(uzaklik)
      bolgeSayac[b].toplam++
      bolgeSayac[b].koyu += koyu
      const yatay = i < merkez.x ? 'sol' : 'sag'
      const dikey = j < merkez.y ? 'ust' : 'alt'
      yarimSayac[yatay].toplam++
      yarimSayac[yatay].koyu += koyu
      yarimSayac[dikey].toplam++
      yarimSayac[dikey].koyu += koyu
    }
  }

  const oran = (s: { koyu: number; toplam: number }) => (s.toplam ? s.koyu / s.toplam : 0)

  // Dikey eksene göre ayna simetrisi (Jaccard benzerliği)
  let kesisim = 0
  let birlesim = 0
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < g; i++) {
      const p = j * g + i
      if (!icinde[p]) continue
      const ayna = Math.round(2 * merkez.x - i)
      if (ayna < 0 || ayna >= g) continue
      const q = j * g + ayna
      if (!icinde[q]) continue
      const a = maske[p]
      const b = maske[q]
      if (a && b) kesisim++
      if (a || b) birlesim++
    }
  }
  const simetri = birlesim ? kesisim / birlesim : 0

  // Sobel kenar yoğunluğu
  let kenarToplam = 0
  let kenarSayac = 0
  for (let j = 1; j < y - 1; j++) {
    for (let i = 1; i < g - 1; i++) {
      const p = j * g + i
      if (!icinde[p]) continue
      const gx =
        -gri[p - g - 1] - 2 * gri[p - 1] - gri[p + g - 1] +
        gri[p - g + 1] + 2 * gri[p + 1] + gri[p + g + 1]
      const gy =
        -gri[p - g - 1] - 2 * gri[p - g] - gri[p - g + 1] +
        gri[p + g - 1] + 2 * gri[p + g] + gri[p + g + 1]
      kenarToplam += Math.min(255, Math.hypot(gx, gy))
      kenarSayac++
    }
  }
  const hareket = kenarSayac ? kenarToplam / kenarSayac / 255 : 0

  const { lekeler, enBuyukAciklik } = lekeleriCikar(maske, icinde, g, y, merkez, yaricap, icPiksel)

  return {
    genislik: g,
    yukseklik: y,
    fincan,
    doluluk: icPiksel ? koyuToplam / icPiksel : 0,
    esik,
    bolgeler: {
      kenar: oran(bolgeSayac.kenar),
      orta: oran(bolgeSayac.orta),
      dip: oran(bolgeSayac.dip),
    },
    yarimlar: {
      sol: oran(yarimSayac.sol),
      sag: oran(yarimSayac.sag),
      ust: oran(yarimSayac.ust),
      alt: oran(yarimSayac.alt),
    },
    simetri,
    hareket,
    aciklik: icPiksel ? enBuyukAciklik / icPiksel : 0,
    lekeler,
    lekeSayisi: lekeler.length,
    gorsel: { gri, maske },
  }
}

/** Bağlı bileşenleri etiketler ve her biri için şekil betimleyicilerini hesaplar. */
function lekeleriCikar(
  maske: Uint8Array,
  icinde: Uint8Array,
  g: number,
  y: number,
  merkez: Nokta,
  yaricap: number,
  icPiksel: number,
) {
  const enAzAlan = Math.max(24, Math.round(icPiksel * 0.0006))
  const gezildi = new Uint8Array(g * y)
  const lekeler: Leke[] = []
  const yigin = new Int32Array(g * y)

  const komsu8 = [-g - 1, -g, -g + 1, -1, 1, g - 1, g, g + 1]

  for (let baslangic = 0; baslangic < maske.length; baslangic++) {
    if (!maske[baslangic] || gezildi[baslangic]) continue

    let tepe = 0
    yigin[tepe++] = baslangic
    gezildi[baslangic] = 1
    const pikseller: number[] = []

    while (tepe > 0) {
      const p = yigin[--tepe]
      pikseller.push(p)
      const px = p % g
      for (const d of komsu8) {
        const q = p + d
        if (q < 0 || q >= maske.length || gezildi[q] || !maske[q]) continue
        // Satır sarmasını engelle
        if (Math.abs((q % g) - px) > 1) continue
        gezildi[q] = 1
        yigin[tepe++] = q
      }
    }

    if (pikseller.length < enAzAlan) continue
    lekeler.push(lekeyiOlc(pikseller, maske, g, merkez, yaricap, icPiksel))
  }

  lekeler.sort((a, b) => b.alan - a.alan)

  // En büyük kesintisiz açık alan ("yol açıklığı")
  const acikGezildi = new Uint8Array(g * y)
  let enBuyukAciklik = 0
  for (let baslangic = 0; baslangic < maske.length; baslangic++) {
    if (maske[baslangic] || !icinde[baslangic] || acikGezildi[baslangic]) continue
    let tepe = 0
    yigin[tepe++] = baslangic
    acikGezildi[baslangic] = 1
    let boyut = 0
    while (tepe > 0) {
      const p = yigin[--tepe]
      boyut++
      const px = p % g
      for (const d of komsu8) {
        const q = p + d
        if (q < 0 || q >= maske.length || acikGezildi[q] || maske[q] || !icinde[q]) continue
        if (Math.abs((q % g) - px) > 1) continue
        acikGezildi[q] = 1
        yigin[tepe++] = q
      }
    }
    if (boyut > enBuyukAciklik) enBuyukAciklik = boyut
  }

  return { lekeler: lekeler.slice(0, 40), enBuyukAciklik }
}

function lekeyiOlc(
  pikseller: number[],
  maske: Uint8Array,
  g: number,
  fincanMerkez: Nokta,
  yaricap: number,
  icPiksel: number,
): Leke {
  const alan = pikseller.length
  let sx = 0
  let sy = 0
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const p of pikseller) {
    const x = p % g
    const j = (p - x) / g
    sx += x
    sy += j
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (j < minY) minY = j
    if (j > maxY) maxY = j
  }
  const mx = sx / alan
  const my = sy / alan

  // İkinci momentler → ana/yan eksen
  let mxx = 0
  let myy = 0
  let mxy = 0
  for (const p of pikseller) {
    const x = p % g
    const j = (p - x) / g
    const dx = x - mx
    const dy = j - my
    mxx += dx * dx
    myy += dy * dy
    mxy += dx * dy
  }
  mxx /= alan
  myy /= alan
  mxy /= alan
  const ortak = Math.sqrt(Math.max(0, (mxx - myy) ** 2 + 4 * mxy * mxy))
  const l1 = (mxx + myy + ortak) / 2
  const l2 = Math.max((mxx + myy - ortak) / 2, 1e-6)
  const uzama = Math.sqrt(l1 / l2)
  const aciEksen = 0.5 * Math.atan2(2 * mxy, mxx - myy)
  // Görüntü y ekseni aşağı baktığı için dikeylik |sin| ile ölçülür.
  const dikeylik = Math.abs(Math.sin(aciEksen))

  // Çevre: sınır piksellerini düz/çapraz geçişlere göre ağırlıklandır.
  const pikselKumesi = new Set(pikseller)
  let cevre = 0
  const sinirNoktalari: Nokta[] = []
  for (const p of pikseller) {
    const x = p % g
    const j = (p - x) / g
    const duzAcik =
      (!maske[p - 1] ? 1 : 0) + (!maske[p + 1] ? 1 : 0) + (!maske[p - g] ? 1 : 0) + (!maske[p + g] ? 1 : 0)
    if (duzAcik > 0) {
      // Düz kenarlar 1, köşeler ~√2 katkı verir; dijital çevre böylece
      // gerçek çevreye yaklaşır ve dairesellik dolu daire için ~1 çıkar.
      cevre += duzAcik === 1 ? 1 : duzAcik === 2 ? Math.SQRT2 : duzAcik
      sinirNoktalari.push({ x, y: j })
    }
  }
  cevre = Math.max(cevre, 4)
  const dairesellik = Math.min(1, (4 * Math.PI * alan) / (cevre * cevre))

  const kutuAlan = (maxX - minX + 1) * (maxY - minY + 1)
  const doluluk = alan / kutuAlan
  const kabuk = konveksKabukAlani(sinirNoktalari)
  const konveksDoluluk = kabuk > 0 ? Math.min(1, alan / kabuk) : 1

  // Delikler: sınırlayıcı kutu içinde, kutunun kenarına bağlı olmayan boşluklar.
  // Yalnızca lekeye oranla kayda değer büyüklükte olanlar sayılır; telvedeki
  // benek boşlukları şekil bilgisi taşımaz.
  const { sayi: delik, oran: delikOrani } = delikleriOlc(pikselKumesi, minX, maxX, minY, maxY, g, alan)

  const dx = mx - fincanMerkez.x
  const dy = my - fincanMerkez.y
  const uzaklik = Math.min(1, Math.hypot(dx, dy) / yaricap)
  const aci = ((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360

  return {
    alan,
    alanOrani: alan / icPiksel,
    merkez: { x: mx, y: my },
    dairesellik,
    uzama,
    doluluk,
    konveksDoluluk,
    kivrim: 1 - konveksDoluluk,
    dikeylik,
    delik,
    delikOrani,
    uzaklik,
    aci,
    bolge: bolgeBul(uzaklik),
    yon: dx < 0 ? 'sol' : 'sag',
  }
}

function delikleriOlc(
  pikselKumesi: Set<number>,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  g: number,
  lekeAlani: number,
): { sayi: number; oran: number } {
  const gen = maxX - minX + 1
  const yuk = maxY - minY + 1
  if (gen < 3 || yuk < 3) return { sayi: 0, oran: 0 }
  const dis = new Uint8Array(gen * yuk)
  const kuyruk: number[] = []

  const yerel = (x: number, j: number) => j * gen + x
  const dolu = (x: number, j: number) => pikselKumesi.has((j + minY) * g + (x + minX))

  for (let x = 0; x < gen; x++) {
    for (const j of [0, yuk - 1]) {
      if (!dolu(x, j) && !dis[yerel(x, j)]) {
        dis[yerel(x, j)] = 1
        kuyruk.push(yerel(x, j))
      }
    }
  }
  for (let j = 0; j < yuk; j++) {
    for (const x of [0, gen - 1]) {
      if (!dolu(x, j) && !dis[yerel(x, j)]) {
        dis[yerel(x, j)] = 1
        kuyruk.push(yerel(x, j))
      }
    }
  }

  while (kuyruk.length) {
    const p = kuyruk.pop() as number
    const x = p % gen
    const j = (p - x) / gen
    for (const [ax, aj] of [[x - 1, j], [x + 1, j], [x, j - 1], [x, j + 1]] as const) {
      if (ax < 0 || aj < 0 || ax >= gen || aj >= yuk) continue
      const q = yerel(ax, aj)
      if (dis[q] || dolu(ax, aj)) continue
      dis[q] = 1
      kuyruk.push(q)
    }
  }

  // Dışarıya bağlanmayan boşluk kümelerini ölç
  const gezildi = new Uint8Array(gen * yuk)
  // Bir boşluğun "delik" sayılması için lekenin en az %5'i kadar olması gerekir.
  const enAzDelik = Math.max(6, lekeAlani * 0.05)
  let sayi = 0
  let toplamBosluk = 0
  for (let j = 0; j < yuk; j++) {
    for (let x = 0; x < gen; x++) {
      const p = yerel(x, j)
      if (dis[p] || dolu(x, j) || gezildi[p]) continue
      let boyut = 0
      const yig = [p]
      gezildi[p] = 1
      while (yig.length) {
        const q = yig.pop() as number
        boyut++
        const qx = q % gen
        const qj = (q - qx) / gen
        for (const [ax, aj] of [[qx - 1, qj], [qx + 1, qj], [qx, qj - 1], [qx, qj + 1]] as const) {
          if (ax < 0 || aj < 0 || ax >= gen || aj >= yuk) continue
          const r = yerel(ax, aj)
          if (gezildi[r] || dis[r] || dolu(ax, aj)) continue
          gezildi[r] = 1
          yig.push(r)
        }
      }
      toplamBosluk += boyut
      if (boyut >= enAzDelik) sayi++
    }
  }
  const oran = toplamBosluk / (lekeAlani + toplamBosluk)
  return { sayi, oran }
}
