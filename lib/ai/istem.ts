/**
 * Modele verilen istemi kurar.
 *
 * Kural şu: model hesap yapmaz. Bütün sayılar tarayıcıda çoktan hesaplandı;
 * modele düşen iş onları Türkçe, uzun ve tutarlı bir okumaya çevirmek. Bu
 * yüzden istem hem verinin tamamını hem de "bu sayıların dışına çıkma"
 * talimatını taşır.
 */
import { yuzde } from '@/lib/ihtimal'
import type { AiGirdi, DogumGirdisi, KahveGirdisi, TarotGirdisi } from './tipler'

export const SISTEM_TALIMATI = `Sen "Bacı"sın: yılların kahve falcısı, tarot okuyucusu ve astroloğu. Türkçe konuşursun.

SES TONUN
- Karşındakine "sen" diye hitap edersin; samimi, sıcak, biraz da iğneleyici bir teyze tavrın var.
- Süslü ama boş cümleler kurmazsın. Her paragraf somut bir şey söyler.
- "Enerjiler", "evren sana bir şey fısıldıyor" gibi klişelerden kaçınırsın.
- Kesin konuşursun ama kader dayatmazsın: "şu olacak" değil, "şu çok kuvvetli, şunu yaparsan döner" dersin.

KURALLAR
- Sana verilen ölçümlerin, sembollerin, kartların ve yüzdelerin DIŞINA ÇIKMA. Yeni sembol, yeni kart, yeni gezegen uydurma.
- Verilen yüzdelerle çelişme. %30'luk bir ihtimali "kesin olacak" diye anlatma.
- Sağlık teşhisi koyma, ilaç önerme, hukukî ya da yatırım tavsiyesi verme. Gebelik, ölüm ve ciddi hastalık gibi konularda kesin konuşma.
- Kişinin adını biliyorsan arada bir kullan, her cümlede değil.
- UZUN YAZ. Bu en önemli kuraldır. Her bölüm EN AZ 150 kelime olmalı, 230 kelimeyi de geçmemeli. 150 kelimeden kısa bölüm yazma; kısa yazarsan iş eksik kalır.
- Yüzeysel geçme: her bölümde en az bir somut örnek, bir de uygulanabilir öneri ver.
- Takımların, sembollerin ve burçların adlarını Türkçe yaz. İngilizce terim kullanma.
- Aynı cümleyi ya da aynı benzetmeyi bölümler arasında tekrarlama.

BİÇİM
- Yanıtı yalnızca istenen JSON biçiminde ver.
- "ozet": okumanın açılışı, EN AZ 180 kelime. En çarpıcı bulguyla başla.
- "bolumler": 5 ila 6 bölüm. Her birinin kısa bir "baslik"ı (en fazla 5 kelime) ve uzun bir "metin"i olsun.
- "kapanis": 2-3 cümlelik kapanış sözü. Bir öneriyle bitir.`

const OLCU = (o: number) => `%${Math.round(o * 100)}`

function ihtimalBlogu(ihtimaller: AiGirdi['ihtimaller']): string {
  if (ihtimaller.length === 0) return 'Hesaplanmış ihtimal yok.'
  return ihtimaller
    .map((i) => `- ${yuzde(i.olasilik)} · [${i.alan}] ${i.olay} (${i.vade}) — dayanağı: ${i.gerekce}`)
    .join('\n')
}

function kahveIstemi(g: KahveGirdisi): string {
  const o = g.olcumler
  const semboller = g.semboller.length
    ? g.semboller
        .map(
          (s) =>
            `- ${s.ad} (eşleşme gücü ${OLCU(s.guven)}), fincanın ${s.bolge} bölgesinde, ${s.yon} yarıda. Geleneksel anlamı: ${s.anlam}`,
        )
        .join('\n')
    : 'Bilinen bir sembole oturan belirgin leke çıkmadı.'

  return `Bir kahve fincanının fotoğrafı ölçüldü. Ölçümler şunlar:

TELVENİN GENELİ
- Telve doluluğu: ${OLCU(o.doluluk)} (fincan içinin ne kadarı telveyle kaplı)
- Simetri: ${OLCU(o.simetri)} (desenin dikey eksene göre ayna dengesi)
- Hareket: ${OLCU(o.hareket)} (kenarların kırıklığı; yüksekse tempolu bir dönem)
- Açıklık: ${OLCU(o.aciklik)} (en geniş kesintisiz boşluk; geleneksel adıyla "yol açıklığı")
- Ayırt edilebilir leke sayısı: ${o.lekeSayisi}

BÖLGELER (geleneksel okuma: kenar = yakın gelecek ve dış dünya, orta = içinde bulunulan dönem, dip = geçmiş ve kökler)
- Kenar: ${OLCU(o.bolgeler.kenar)}
- Orta: ${OLCU(o.bolgeler.orta)}
- Dip: ${OLCU(o.bolgeler.dip)}

YARIMLAR (sağ = gelenler ve açılan yollar, sol = gidenler ve geride kalanlar)
- Sağ: ${OLCU(o.yarimlar.sag)}
- Sol: ${OLCU(o.yarimlar.sol)}

ÇIKAN SEMBOLLER
${semboller}

HESAPLANMIŞ İHTİMALLER (bu yüzdeler kesindir, değiştirme)
${ihtimalBlogu(g.ihtimaller)}

Bu fincanı yorumla. Bölümlerin kenar, orta ve dip bölgelerini, desenin dokusunu ve çıkan sembolleri kapsasın. Her sembolü mutlaka ele al ve fincandaki yerine bağla.`
}

function tarotIstemi(g: TarotGirdisi): string {
  const kartlar = g.kartlar
    .map(
      (k, i) =>
        `${i + 1}. "${k.pozisyon}" konumu (${k.pozisyonAciklamasi}): ${k.kart}${
          k.ters ? ' — TERS' : ' — düz'
        }, ${k.takim} takımı. Anahtar kelimeler: ${k.anahtar.join(', ')}. Bu yöndeki anlamı: ${k.anlam}`,
    )
    .join('\n')

  const cevap = g.cevap
    ? `\nEVET/HAYIR CEVABI: ${g.cevap.deger.toLocaleUpperCase('tr-TR')} (cevabın gücü ${OLCU(
        g.cevap.guc,
      )}; 0 kesin hayır, 1 kesin evet demek). Bu cevabı değiştirme, "belki" deme.`
    : ''

  return `Bir tarot açılımı yapıldı: ${g.acilim}.
${g.soru ? `Kişinin sorusu: "${g.soru}"` : 'Kişi belirli bir soru sormadı.'}

ÇEKİLEN KARTLAR
${kartlar}
${cevap}

HESAPLANMIŞ İHTİMALLER (bu yüzdeler kesindir, değiştirme)
${ihtimalBlogu(g.ihtimaller)}

Bu açılımı yorumla. Her kartı düştüğü pozisyonun sorusuna bağla, kartlar arasındaki ilişkiyi kur (hangi kart hangisini besliyor, hangisi engelliyor). Takım dağılımının ve ters kartların ne anlattığını da söyle.${
    g.soru ? ' Sorulan soruya doğrudan cevap ver, konuyu dağıtma.' : ''
  }`
}

function dogumIstemi(g: DogumGirdisi): string {
  const n = g.numeroloji
  const yukselen = g.yukselen
    ? `- Yükselen: ${g.yukselen.burc} ${g.yukselen.derece.toFixed(1)}° (${g.yukselen.element})`
    : '- Yükselen: hesaplanamadı (doğum saati ya da yeri verilmedi). Bunu bir eksiklik olarak kısaca belirt, uydurma.'

  return `Bir doğum haritası hesaplandı. Kişinin adı: ${g.isim}.

GÖK KONUMLARI (gerçek ekliptik boylamlardan hesaplandı)
- Güneş: ${g.gunes.burc} ${g.gunes.derece.toFixed(1)}° (${g.gunes.element}, ${g.gunes.nitelik})
- Ay: ${g.ay.burc} ${g.ay.derece.toFixed(1)}° (${g.ay.element}), doğum anındaki evre: ${g.ay.evre}, aydınlanma ${OLCU(g.ay.aydinlanma)}
${yukselen}

DENGE
- Element dağılımı: ${Object.entries(g.denge.elementler)
    .map(([e, s]) => `${e} ${s}`)
    .join(', ')}
- Baskın element: ${g.denge.baskinElement}; baskın nitelik: ${g.denge.baskinNitelik}

NUMEROLOJİ (Pisagor, Türkçe alfabeye uyarlanmış)
- Yaşam yolu: ${n.yasamYolu.sayi} — "${n.yasamYolu.baslik}"
- İfade: ${n.ifade}, Ruh arzusu: ${n.ruhArzusu}, Kişilik: ${n.kisilik}
- ${n.kisiselYil.yil} kişisel yılı: ${n.kisiselYil.sayi}

ÇİN ZODYAĞI
- ${g.cin.ad} (${g.cin.hayvan}, ${g.cin.element} elementi)

HESAPLANMIŞ İHTİMALLER (bu yüzdeler kesindir, değiştirme)
${ihtimalBlogu(g.ihtimaller)}

Bu haritayı yorumla. Güneş-Ay-yükselen üçlüsünün birbiriyle nasıl geçindiğini, element dengesini ve eksiğini, numeroloji sayılarının haritayla nerede örtüşüp nerede çeliştiğini anlat. ${n.kisiselYil.yil} kişisel yılına ayrı bir bölüm ayır.`
}

export function istemKur(girdi: AiGirdi): string {
  switch (girdi.tur) {
    case 'kahve':
      return kahveIstemi(girdi)
    case 'tarot':
      return tarotIstemi(girdi)
    case 'dogum':
      return dogumIstemi(girdi)
  }
}
