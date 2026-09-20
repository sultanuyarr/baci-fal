/**
 * Burç verileri.
 *
 * Burç, sabit takvim aralıklarından değil, doğum anındaki gerçek ekliptik
 * boylamdan bulunur (30°lik dilimler, 0° Koç'un başlangıcı).
 */

export type Element = 'ateş' | 'toprak' | 'hava' | 'su'
export type Nitelik = 'öncü' | 'sabit' | 'değişken'

export type Burc = {
  ad: string
  /** Burç damgası. Sonundaki U+FE0E, tarayıcının simgeyi emoji yerine
   *  metin olarak çizmesini sağlar. */
  simge: string
  element: Element
  nitelik: Nitelik
  yonetici: string
  anahtar: string[]
  gunes: string
  ay: string
  yukselen: string
}

export const BURCLAR: Burc[] = [
  {
    ad: 'Koç', simge: '♈\uFE0E', element: 'ateş', nitelik: 'öncü', yonetici: 'Mars',
    anahtar: ['cesaret', 'inisiyatif', 'acelecilik', 'dürüstlük'],
    gunes: 'İlk hamleyi yapan sensin. Düşünmeden atlamak kadar, kimsenin göze alamadığını göze almak da senin işin. Enerjin yüksek, sabrın kısa; bir işi bitirmek başlatmak kadar heyecanlı gelmiyor. Öfken çabuk parlar, çabuk geçer — kin tutmazsın.',
    ay: 'Duygularını anında ve ham hâliyle yaşarsın; içinde bir şey biriktirmezsin. Tepkin hızlıdır ama kalıcı değildir.',
    yukselen: 'İnsanlar seni enerjik, dolaysız ve biraz meydan okuyan biri olarak görür. İlk izlenimin güçlüdür.',
  },
  {
    ad: 'Boğa', simge: '♉\uFE0E', element: 'toprak', nitelik: 'sabit', yonetici: 'Venüs',
    anahtar: ['istikrar', 'sabır', 'inatçılık', 'haz'],
    gunes: 'Sağlamı seversin: dokunabildiğin, güvenebildiğin, yarın da yerinde duracak olanı. Yavaş karar verir ama verdiğin karardan dönmezsin. Konfor, lezzet ve güzellik senin için lüks değil ihtiyaç. İnadın hem kalkanın hem duvarın.',
    ay: 'Duygusal güvenlik senin için her şeyden önce gelir. Değişim seni sarsar; istikrar sakinleştirir.',
    yukselen: 'Sakin, güven veren ve oturaklı bir izlenim bırakırsın. Aceleye getirilmeyi sevmezsin.',
  },
  {
    ad: 'İkizler', simge: '♊\uFE0E', element: 'hava', nitelik: 'değişken', yonetici: 'Merkür',
    anahtar: ['merak', 'iletişim', 'çeşitlilik', 'huzursuzluk'],
    gunes: 'Zihnin hiç durmuyor. Öğrenmek, anlatmak, bağlantı kurmak senin doğal hâlin. Aynı anda birkaç şeyle ilgilenmek seni yormaz, aksine besler; asıl sıkıntı tek bir şeye uzun süre bağlı kalmakta. Kelimelerle çok şey yapabilirsin.',
    ay: 'Duygularını konuşarak çözersin; içinde tuttuğunda dağılırsın. Ruh hâlin hızlı değişir.',
    yukselen: 'Konuşkan, zeki ve genç görünürsün. İnsanlar seninle kolay sohbet eder.',
  },
  {
    ad: 'Yengeç', simge: '♋\uFE0E', element: 'su', nitelik: 'öncü', yonetici: 'Ay',
    anahtar: ['duyarlılık', 'koruma', 'hafıza', 'yuva'],
    gunes: 'Kabuğunun altında oldukça yumuşak bir yer var ve oraya herkesi almıyorsun. Sevdiklerini korumak için şaşırtıcı bir sertlik gösterebilirsin. Geçmişi ve duyguları güçlü hatırlarsın; bu hem zenginliğin hem yükün.',
    ay: 'Duyguların derin ve dalgalı; çevrendeki havayı süngerdi gibi çekersin. Yuva hissi olmadan dengelenemezsin.',
    yukselen: 'Sıcak, ilgili ve biraz çekingen görünürsün. İnsanlar sana içini dökmek ister.',
  },
  {
    ad: 'Aslan', simge: '♌\uFE0E', element: 'ateş', nitelik: 'sabit', yonetici: 'Güneş',
    anahtar: ['gurur', 'cömertlik', 'yaratıcılık', 'sahne'],
    gunes: 'Görülmek senin için gösteriş değil, varoluş biçimi. Cömertsin, sadıksın ve sevdiklerini gururla taşırsın. Takdir edildiğinde en iyi hâline geçer, görmezden gelindiğinde içten içe kırılırsın. Liderlik sana doğal geliyor.',
    ay: 'Duygusal olarak fark edilmeye, değer görmeye ihtiyacın var. Sevgini büyük ve gösterişli yaşarsın.',
    yukselen: 'Girdiğin ortamda fark edilirsin; duruşunda doğal bir otorite ve sıcaklık var.',
  },
  {
    ad: 'Başak', simge: '♍\uFE0E', element: 'toprak', nitelik: 'değişken', yonetici: 'Merkür',
    anahtar: ['analiz', 'hizmet', 'titizlik', 'eleştiri'],
    gunes: 'Detayı görürsün; kimsenin fark etmediği aksaklık senin gözüne çarpar. Faydalı olmak, düzeltmek ve işe yaramak seni tatmin eder. En sert eleştirmenin kendinsin; bu titizlik iyi iş çıkarır ama seni de yorar.',
    ay: 'Kaygıyı düzen kurarak yönetirsin. Küçük ritüeller ve temiz bir çevre seni gerçekten sakinleştirir.',
    yukselen: 'Düzenli, temkinli ve zeki görünürsün; hemen güvenmez, önce gözlemlersin.',
  },
  {
    ad: 'Terazi', simge: '♎\uFE0E', element: 'hava', nitelik: 'öncü', yonetici: 'Venüs',
    anahtar: ['denge', 'estetik', 'adalet', 'kararsızlık'],
    gunes: 'Adalet ve uyum senin pusulan. İnsanların arasını bulur, ortamı yumuşatırsın. Güzellik ve zarafet sana iyi geliyor. Zorlandığın yer karar vermek: her seçeneğin haklı tarafını gördüğün için terazi bir türlü durmuyor.',
    ay: 'Duygusal dengen ilişkilerinden geçer; yalnızlık seni dinlendirmez, huzursuz eder.',
    yukselen: 'Zarif, nazik ve uyumlu görünürsün. İlk izlenimin genelde çok olumludur.',
  },
  {
    ad: 'Akrep', simge: '♏\uFE0E', element: 'su', nitelik: 'sabit', yonetici: 'Plüton (Mars)',
    anahtar: ['yoğunluk', 'sezgi', 'dönüşüm', 'kontrol'],
    gunes: 'Yüzeyde durmayı bilmiyorsun; ya tamamen içindesin ya hiç. Sezgin keskin, insanları okuma yeteneğin rahatsız edici derecede iyi. Güvenmen zor, güvendiğinde ise tam. Kriz anlarında sakinleşen ender insanlardansın.',
    ay: 'Duyguların çok derin ve gizli; hissettiğinin yarısını bile göstermezsin. Bırakmak senin en zor dersin.',
    yukselen: 'Yoğun, gizemli ve delip geçen bir bakışın var. Nötr kalmak sana zor.',
  },
  {
    ad: 'Yay', simge: '♐\uFE0E', element: 'ateş', nitelik: 'değişken', yonetici: 'Jüpiter',
    anahtar: ['özgürlük', 'anlam', 'iyimserlik', 'dobralık'],
    gunes: 'Ufku genişletmeden duramıyorsun: yeni yerler, yeni fikirler, yeni ihtimaller. İyimserliğin bulaşıcı, dobralığın bazen fazla çıplak. Sıkışmak seni boğar; anlam arayışın seni yollara düşürür.',
    ay: 'Duygusal olarak alana ihtiyacın var. Kısıtlandığında kaçarsın; özgür bırakıldığında kalırsın.',
    yukselen: 'Neşeli, açık sözlü ve maceraperest görünürsün. İnsanlar yanında rahatlar.',
  },
  {
    ad: 'Oğlak', simge: '♑\uFE0E', element: 'toprak', nitelik: 'öncü', yonetici: 'Satürn',
    anahtar: ['disiplin', 'hırs', 'sorumluluk', 'sabır'],
    gunes: 'Uzun yolu göze alabilen azınlıktansın. Hedefini koyar, yıllara yayar ve sızlanmadan yürürsün. Sorumluluğu erken üstlenmişsindir. Sert görünürsün ama içeride ciddi bir şefkat var; sadece gösterişini sevmiyorsun.',
    ay: 'Duyguyu kontrol altında tutarsın; zayıf görünmek sana ağır gelir. Güven, sözle değil istikrarla gelir.',
    yukselen: 'Ciddi, ölçülü ve güvenilir görünürsün; yaşından olgun durursun.',
  },
  {
    ad: 'Kova', simge: '♒\uFE0E', element: 'hava', nitelik: 'sabit', yonetici: 'Uranüs (Satürn)',
    anahtar: ['özgünlük', 'bağımsızlık', 'toplum', 'mesafe'],
    gunes: 'Herkesin kabul ettiği şeyi neden kabul etmek zorunda olduğunu sorarsın. Fikirlerin zamanının biraz ilerisinde; bu yüzden bazen yalnız, bazen öncü olursun. Topluluğa bağlısın ama kalabalığa karışmazsın.',
    ay: 'Duyguya mesafeden bakarsın; hissetmek yerine analiz etme eğilimin var. Özgürlük duygusal ihtiyacındır.',
    yukselen: 'Farklı, özgün ve biraz mesafeli görünürsün; kalıba girmezsin.',
  },
  {
    ad: 'Balık', simge: '♓\uFE0E', element: 'su', nitelik: 'değişken', yonetici: 'Neptün (Jüpiter)',
    anahtar: ['sezgi', 'şefkat', 'hayal', 'sınırsızlık'],
    gunes: 'Sınırların ince: başkasının hissettiğini kendi içinde duyuyorsun. Şefkatin ve hayal gücün çok geniş; bu seni sanatçı da yapar, kolay yaralanan da. Gerçekle hayal arasında dengeyi kurduğunda nadir bir derinlik taşıyorsun.',
    ay: 'Duyguların denizde gibi; kendininkiyle başkasınınkini ayırmak zor. Yalnız kalacak sessiz bir köşe şart.',
    yukselen: 'Yumuşak, rüya gibi ve yaklaşılabilir görünürsün; insanlar yanında savunmasını bırakır.',
  },
]

export const ELEMENT_YORUMU: Record<Element, string> = {
  ateş: 'Ateş baskın: harekete geçmek, ilham ve cesaret ön planda. Beklemek senin için en zor eylem.',
  toprak: 'Toprak baskın: somut, ölçülebilir ve kalıcı olan seni ikna eder. Hayal değil, plan istersin.',
  hava: 'Hava baskın: fikir, iletişim ve bağlantı senin alanın. Önce anlamak, sonra hissetmek istersin.',
  su: 'Su baskın: duygu ve sezgi hayatının yönünü belirliyor. Mantığın söylediğinden çok içine doğanı dinliyorsun.',
}

export const NITELIK_YORUMU: Record<Nitelik, string> = {
  öncü: 'Öncü nitelik ağır basıyor: başlatmak sana kolay, sürdürmek zor geliyor.',
  sabit: 'Sabit nitelik ağır basıyor: başladığını bitirirsin ama yön değiştirmek seni zorlar.',
  değişken: 'Değişken nitelik ağır basıyor: uyum sağlamakta ustasın, bir yere sabitlenmek zor.',
}

/** Ekliptik boylamdan burcu ve burç içindeki dereceyi bulur. */
export function boylamdanBurc(boylam: number): { burc: Burc; derece: number; indeks: number } {
  const indeks = Math.floor(((boylam % 360) + 360) % 360 / 30)
  return { burc: BURCLAR[indeks], derece: (((boylam % 360) + 360) % 360) % 30, indeks }
}

/** Ay evresi açısından evre adı ve yorumu. */
export function ayEvresiAdi(aci: number): { ad: string; simge: string; yorum: string } {
  const evreler: [number, string, string, string][] = [
    [22.5, 'Yeni Ay', '🌑', 'Doğduğunda gökyüzü karanlıktı. Yeni ay doğumluları başlangıçların insanıdır: içgüdüsel, atılgan ve biraz pervasız. Geçmişe değil, önüne bakarsın.'],
    [67.5, 'Hilal', '🌒', 'Büyüyen hilalde doğdun. Bir şeyi sıfırdan var etme isteği ve geçmişin alışkanlıklarından kopma mücadelesi seni tanımlar.'],
    [112.5, 'İlk Dördün', '🌓', 'İlk dördünde doğanlar kriz ve karar insanıdır. Harekete geçmek için bir engele ihtiyacın var; direnç seni büyütüyor.'],
    [157.5, 'Şişkin Ay', '🌔', 'Şişkin ay doğumlusun: bir şeyi mükemmelleştirme, ayrıntısını tamamlama arzusu taşıyorsun. Aceleci değil, olgunlaştırıcısın.'],
    [202.5, 'Dolunay', '🌕', 'Dolunayda doğdun. İçindeki iki uç — akıl ve duygu, sen ve öteki — sürekli karşı karşıya. Bu gerilim seni hem yorar hem bilge yapar. İlişkiler senin aynan.'],
    [247.5, 'Yayılan Ay', '🌖', 'Yayılan ayda doğanlar anlatıcıdır: öğrendiğini paylaşma, aktarma dürtüsü güçlü. Bildiğini kendine saklamak sana ters.'],
    [292.5, 'Son Dördün', '🌗', 'Son dördünde doğdun: içeride sessizce biten bir şey var. Sorgulamak, eskiyi bırakmak ve kendi doğrunu kurmak senin işin.'],
    [337.5, 'Balsamik Ay', '🌘', 'Balsamik ayda doğanlar bir döngünün sonunda gelir: sezgisel, biraz melankolik ve yaşından bilge. Bırakmayı başkalarından iyi bilirsin.'],
  ]
  for (const [sinir, ad, simge, yorum] of evreler) if (aci < sinir) return { ad, simge, yorum }
  return { ad: 'Yeni Ay', simge: '🌑', yorum: evreler[0][3] }
}
