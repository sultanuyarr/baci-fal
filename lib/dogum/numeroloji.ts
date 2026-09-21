/**
 * Pisagor numerolojisi — Türkçe alfabeye uyarlanmış.
 *
 * Türkçeye özgü harfler temel harflerinin değerini alır:
 * Ç→C, Ğ→G, İ→I, Ö→O, Ş→S, Ü→U. Sesli harfler: A E I İ O Ö U Ü.
 *
 * 11, 22 ve 33 "usta sayı" kabul edilir ve tek haneye indirgenmez.
 */

const HARF_DEGERI: Record<string, number> = {
  A: 1, J: 1, S: 1, Ş: 1,
  B: 2, K: 2, T: 2,
  C: 3, Ç: 3, L: 3, U: 3, Ü: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, Ö: 6, X: 6,
  G: 7, Ğ: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, İ: 9, R: 9,
}

const SESLILER = new Set(['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'])
const USTA_SAYILAR = new Set([11, 22, 33])

/** Sayıyı tek haneye indirger; usta sayılara dokunmaz. */
export function indirge(sayi: number): number {
  let n = Math.abs(Math.trunc(sayi))
  while (n > 9 && !USTA_SAYILAR.has(n)) {
    n = String(n)
      .split('')
      .reduce((t, h) => t + Number(h), 0)
  }
  return n
}

/** İsmi numerolojiye uygun biçime getirir: büyük harf, yalnız harfler. */
export function ismiNormalize(isim: string): string[] {
  return isim
    .toLocaleUpperCase('tr-TR')
    .split('')
    .filter((h) => h in HARF_DEGERI)
}

function harfleriTopla(harfler: string[]): number {
  return harfler.reduce((t, h) => t + HARF_DEGERI[h], 0)
}

export type SayiYorumu = { sayi: number; baslik: string; metin: string }

export type NumerolojiSonucu = {
  yasamYolu: SayiYorumu
  ifade: SayiYorumu
  ruhArzusu: SayiYorumu
  kisilik: SayiYorumu
  dogumGunu: SayiYorumu
  kisiselYil: SayiYorumu
  /** Kişisel yılın hesaplandığı takvim yılı */
  kisiselYilYili: number
  /** Hesabın nasıl yapıldığını gösteren adımlar */
  adimlar: string[]
}

const YASAM_YOLU: Record<number, [string, string]> = {
  1: ['Öncü', 'Kendi yolunu açmak için doğmuşsun. Kimseye tabi olmadan, kendi kararınla ilerlediğinde güçlüsün; ama yalnız yürümeyi fazla abartırsan yardım almayı unutursun. Bu yol liderlik, girişim ve özgünlük ister.'],
  2: ['Uzlaştırıcı', 'Senin gücün karşındakini anlamakta. İnsanları bir araya getirir, gerilimi yumuşatırsın. Tehlike, herkesi memnun etmeye çalışırken kendi isteğini kaybetmek. Ortaklıklar ve diplomasi bu yolun malzemesi.'],
  3: ['Anlatıcı', 'İfade etmek için buradasın: söz, yazı, sahne, görüntü. Neşen bulaşıcı, yaratıcılığın bol. Dağılmaya ve yüzeysel kalmaya dikkat et; derinleştiğinde yeteneğin işe dönüşür.'],
  4: ['Kurucu', 'Sağlam temel atma işi sende. Disiplin, sabır ve düzen doğal olarak geliyor; başkalarının dağıttığını sen topluyorsun. Katılaşmadığın ve esneyebildiğin sürece kurduğun şey kalıcı olur.'],
  5: ['Değişim', 'Özgürlük senin oksijenin. Çeşitlilik, seyahat, yeni insanlar ve değişen planlar seni besler. Rutin seni öldürür ama hiç kök salmamak da seni savurur; özgürlüğünü sorumlulukla dengelemeyi öğreneceksin.'],
  6: ['Koruyucu', 'Sorumluluk ve şefkat üstüne kurulu bir yol. Aile, ev, sağlık ve estetik senin alanın; insanlar zorlanınca sana geliyor. Kendini ihmal etme ve herkesin yükünü sırtlanma eğilimine dikkat.'],
  7: ['Araştırmacı', 'Yüzeyle yetinmiyorsun; her şeyin altındaki sebebi merak ediyorsun. Yalnız kaldığın zamanlar seni besler, kalabalık yorar. Analiz, uzmanlık ve manevi arayış bu yolun işaretleri. Fazla mesafe soğukluğa dönüşebilir.'],
  8: ['Yönetici', 'Maddi dünyayla güçlü bir bağın var: para, güç, yapı ve sonuç. Büyük hedefler koymak ve onları yönetmek sana yakışıyor. Kazanmanın bedelini hesapla; güç, amaç olursa yorucudur.'],
  9: ['Tamamlayan', 'Geniş bir kalbin ve geniş bir bakışın var. Kendinden büyük bir amaca hizmet ettiğinde tatmin oluyorsun. Bırakmayı, affetmeyi ve döngüleri kapatmayı öğrenmek bu yolun asıl dersi.'],
  11: ['Sezgi ustası', 'İki 1 yan yana: hem öncü hem sezgisel. İnsanların hissettiğini onlardan önce fark ediyorsun; ilham verme kapasiten yüksek. Karşılığında hassasiyet ve kaygı da geliyor. Sinir sistemini koru, sezgine güven.'],
  22: ['Usta kurucu', 'Hayal ile inşa arasındaki köprü sensin. Büyük düşünüp onu somut hâle getirme gücün var; ama bu yol yüksek beklenti ve ağır sorumluluk getirir. Küçük adımları küçümsememeyi öğrendiğinde büyük işler çıkarırsın.'],
  33: ['Usta öğretmen', 'Sevgiyi sorumluluğa çeviren nadir bir yol. Başkalarını iyileştirme, öğretme ve taşıma kapasiten büyük. Kendi kabını doldurmadan verirsen tükenirsin; sınır koymak senin için lüks değil zorunluluk.'],
}

const IFADE: Record<number, string> = {
  1: 'Dışarıya bağımsız, kararlı ve inisiyatif alan biri olarak görünürsün; insanlar senden yön beklerler.',
  2: 'Yeteneğin iş birliğinde ve incelikte; kaba kuvvetle değil, uyumla sonuç alırsın.',
  3: 'İletişim, mizah ve yaratıcılık senin araçların; bir odayı kelimelerinle çevirebilirsin.',
  4: 'Güvenilirlik senin markan; söz verdiğini yapan, işi bitiren kişi olarak tanınırsın.',
  5: 'Çok yönlülük ve uyum sağlama becerin yüksek; değişen koşullarda parlarsın.',
  6: 'İnsanlara bakma, düzenleme ve güzelleştirme yeteneğin öne çıkar; sığınılan kişi olursun.',
  7: 'Derin düşünme ve uzmanlaşma kapasiten var; söylediğin az ama ağırdır.',
  8: 'Yönetme, büyütme ve maddi sonuç üretme becerin belirgin; hedefe kilitlenirsin.',
  9: 'Geniş bakış, hoşgörü ve hizmet duygusu seni tanımlar; kalabalıklara hitap edebilirsin.',
  11: 'İlham verici ve sezgisel bir etkin var; farkında olmadan insanları etkiliyorsun.',
  22: 'Büyük planları uygulanabilir hâle getirme yeteneğin ender rastlanır bir şey.',
  33: 'Öğretme ve iyileştirme yönün baskın; verdiğin şey seni aşıyor.',
}

const RUH_ARZUSU: Record<number, string> = {
  1: 'İçten içe kendi kararını kendi vermeyi, kimseye hesap vermemeyi istiyorsun.',
  2: 'En derin isteğin huzur ve gerçek bir yakınlık; kavga seni yıpratıyor.',
  3: 'Kendini ifade etmek ve görülmek istiyorsun; susturulduğunda soluyorsun.',
  4: 'Güvende ve düzende olmak istiyorsun; belirsizlik seni en çok yoran şey.',
  5: 'Özgürlük ve yenilik istiyorsun; sıkışmak sana ölüm gibi geliyor.',
  6: 'Sevmek ve sevilmek, bir yuvaya ait olmak istiyorsun; ihtiyaç duyulmak seni besliyor.',
  7: 'Anlamak istiyorsun; yüzeysel ilişkiler ve boş konuşmalar seni yoruyor.',
  8: 'Güç ve karşılık istiyorsun; emeğinin somut biçimde tanınması senin için önemli.',
  9: 'Bir şeye gerçekten hizmet etmek, iz bırakmak istiyorsun; anlamsızlık seni çökertiyor.',
  11: 'Yükselmek ve yükseltmek istiyorsun; sıradanlık içini daraltıyor.',
  22: 'Kalıcı bir şey kurmak istiyorsun; geçici işler seni tatmin etmiyor.',
  33: 'İyileştirmek istiyorsun; başkasının acısına kayıtsız kalamıyorsun.',
}

const KISILIK: Record<number, string> = {
  1: 'İlk izlenimin güçlü ve kendine yeten biri; kimileri seni mesafeli bulabilir.',
  2: 'Yumuşak, yaklaşılabilir ve dinleyen biri olarak algılanırsın.',
  3: 'Canlı, esprili ve sosyal görünürsün; ortama renk katarsın.',
  4: 'Ciddi, düzenli ve güvenilir bir izlenim bırakırsın.',
  5: 'Hareketli, meraklı ve öngörülemez görünürsün; ilgi çekersin.',
  6: 'Sıcak, sorumlu ve koruyucu bir hava taşırsın.',
  7: 'Sakin, gizemli ve biraz uzak durursun; herkese açılmazsın.',
  8: 'Otoriter, ciddiye alınan ve güçlü bir duruşun var.',
  9: 'Olgun, hoşgörülü ve biraz uzaklardan bakan bir hâlin var.',
  11: 'Dikkat çeken, elektriği yüksek bir varlığın var.',
  22: 'Ağırbaşlı ama iddialı görünürsün; insanlar sana büyük işler yakıştırır.',
  33: 'Şefkatli ve güven veren bir izlenim bırakırsın.',
}

const KISISEL_YIL: Record<number, string> = {
  1: 'Yeni bir dokuz yıllık döngünün ilk yılındasın: başlangıçlar, tohum atma ve yön belirleme yılı. Bu yıl attığın adım sonraki sekiz yılı şekillendirir.',
  2: 'Sabır ve iş birliği yılı. Bu yıl zorlamak işe yaramaz; ilişkiler, ortaklıklar ve olgunlaşmayı bekleyen şeyler öne çıkar.',
  3: 'İfade ve sosyalleşme yılı. Yaratıcılığın açılıyor, çevren genişliyor. Dağılmamak kaydıyla keyifli bir dönem.',
  4: 'Emek ve düzen yılı. Temelleri sağlamlaştırma zamanı; bu yıl konulan taşlar kalıcı olur. Yorucu ama verimli.',
  5: 'Değişim ve hareket yılı. Beklenmedik fırsatlar, seyahat, yer değiştirme. Katı planlar bu yıl tutmaz.',
  6: 'Sorumluluk ve yuva yılı. Aile, ilişki, sağlık ve ev konuları öne çıkar. Verdiğin emek karşılık bulur.',
  7: 'İçe dönüş ve öğrenme yılı. Dışarıda az, içeride çok şey olur. Acele karar değil, araştırma yılı.',
  8: 'Hasat ve güç yılı. Maddi sonuçlar, terfi, büyük kararlar. Emeğinin karşılığını en çok bu yıl görürsün.',
  9: 'Kapanış yılı. Bitmesi gerekenler bitiyor, yer açılıyor. Yeni bir şeye başlamak yerine tamamlamaya odaklan.',
  11: 'Sezgilerin olağanüstü açık olduğu bir yıl. İlham, fark edilme ve manevi sıçrama; aynı zamanda yüksek hassasiyet.',
  22: 'Büyük bir şeyi somutlaştırma yılı. Uzun vadeli bir yapı kurabilirsin; sorumluluk ağır ama getirisi kalıcı.',
}

function yorum(sayi: number, tablo: Record<number, string>, baslik: string): SayiYorumu {
  return { sayi, baslik, metin: tablo[sayi] ?? tablo[indirge(sayi)] ?? '' }
}

/**
 * @param isim      Tam ad soyad
 * @param dogum     ISO tarih (YYYY-AA-GG)
 * @param yil       Kişisel yılın hesaplanacağı takvim yılı
 */
export function numerolojiHesapla(isim: string, dogum: string, yil: number): NumerolojiSonucu {
  const [y, a, g] = dogum.split('-').map(Number)
  const adimlar: string[] = []

  // Yaşam yolu: gün, ay ve yıl ayrı ayrı indirgenir, sonra toplanır.
  const gunI = indirge(g)
  const ayI = indirge(a)
  const yilI = indirge(y)
  const yasamYoluHam = gunI + ayI + yilI
  const yasamYolu = indirge(yasamYoluHam)
  adimlar.push(
    `Yaşam yolu: gün ${g}→${gunI}, ay ${a}→${ayI}, yıl ${y}→${yilI}; ${gunI}+${ayI}+${yilI}=${yasamYoluHam}→${yasamYolu}`,
  )

  const harfler = ismiNormalize(isim)
  const sesliler = harfler.filter((h) => SESLILER.has(h))
  const sessizler = harfler.filter((h) => !SESLILER.has(h))

  const ifadeHam = harfleriTopla(harfler)
  const ifade = indirge(ifadeHam)
  adimlar.push(`İfade sayısı: ismin tüm harfleri ${ifadeHam}→${ifade}`)

  const ruhHam = harfleriTopla(sesliler)
  const ruhArzusu = indirge(ruhHam)
  adimlar.push(`Ruh arzusu: sesli harfler (${sesliler.join('')}) ${ruhHam}→${ruhArzusu}`)

  const kisilikHam = harfleriTopla(sessizler)
  const kisilik = indirge(kisilikHam)
  adimlar.push(`Kişilik: sessiz harfler ${kisilikHam}→${kisilik}`)

  const dogumGunu = indirge(g)
  const kisiselYilHam = indirge(a) + indirge(g) + indirge(yil)
  const kisiselYil = indirge(kisiselYilHam)
  adimlar.push(`${yil} kişisel yılı: ${indirge(a)}+${indirge(g)}+${indirge(yil)}=${kisiselYilHam}→${kisiselYil}`)

  return {
    yasamYolu: {
      sayi: yasamYolu,
      baslik: YASAM_YOLU[yasamYolu]?.[0] ?? '',
      metin: YASAM_YOLU[yasamYolu]?.[1] ?? '',
    },
    ifade: yorum(ifade, IFADE, 'İfade sayısı'),
    ruhArzusu: yorum(ruhArzusu, RUH_ARZUSU, 'Ruh arzusu'),
    kisilik: yorum(kisilik, KISILIK, 'Kişilik sayısı'),
    dogumGunu: yorum(dogumGunu, IFADE, 'Doğum günü sayısı'),
    kisiselYil: yorum(kisiselYil, KISISEL_YIL, `${yil} kişisel yılı`),
    kisiselYilYili: yil,
    adimlar,
  }
}
