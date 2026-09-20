import type { Metadata } from 'next'
import { DESTE } from '@/lib/tarot/deste'
import { SEMBOLLER } from '@/lib/kahve/semboller'
import { ILLER } from '@/lib/dogum/harita'
import { Baslik, Panel } from '@/components/Panel'

export const metadata: Metadata = {
  title: 'Nasıl Çalışıyor — Bacı Fal',
  description:
    'Bacı Fal’ın kullandığı veri kaynakları ve hesap yöntemleri: görüntü işleme, tarot veri seti ve Meeus astronomi algoritmaları.',
}

export default function NasilSayfasi() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Baslik
        etiket="Perde arkası"
        baslik="Nasıl Çalışıyor"
        ortala
        aciklama={
          <p>
            Fal eğlencelidir ama arkasındaki hesabın uydurma olması gerekmez. Bu sayfada hangi
            veriyi nereden aldığımız ve her sonucun hangi adımlardan geçtiği yazıyor.
          </p>
        }
      />

      <div className="mt-12 space-y-6">
        <Panel className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">
            ☕ Kahve falı — fotoğrafın gerçekten ölçülüyor
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">
            Yüklediğin fotoğraf <b className="text-[#ded4f0]">senin cihazından hiç çıkmaz</b>:
            tarayıcı onu bir tuvale çizip piksellerini okur ve bütün hesap orada yapılır.
            Adımlar şöyle:
          </p>
          <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#c3b8dd]">
            <li>
              <b className="text-[#ded4f0]">1. Hazırlık.</b> Fotoğraf EXIF yönüne göre çevrilir,
              460 piksele küçültülür, gri tonlamaya alınır ve kontrastı gerilir. Böylece farklı
              ışıkta çekilmiş kareler karşılaştırılabilir hâle gelir.
            </li>
            <li>
              <b className="text-[#ded4f0]">2. Fincanı bulma.</b> Porselenin parlak pikselleri
              toplanır; ağırlık merkezleri fincanın ortasını, merkeze uzaklıklarının 88.
              yüzdeliği ise yarıçapını verir. Analiz yalnız bu dairenin içinde yapılır.
            </li>
            <li>
              <b className="text-[#ded4f0]">3. Telveyi ayırma.</b> Daire içindeki piksellerin
              histogramına <i>Otsu</i> yöntemi uygulanır. Bu yöntem, koyu ve açık pikselleri en
              iyi ayıran eşiği sınıf içi varyansı en aza indirerek bulur. Ardından 3×3 açma
              işlemiyle tek piksellik gürültü silinir.
            </li>
            <li>
              <b className="text-[#ded4f0]">4. Lekeleri ölçme.</b> Bağlı bileşen etiketlemesiyle
              her telve lekesi ayrı ayrı bulunur. Her leke için dairesellik (4πA/Ç²), ikinci
              momentlerden uzama oranı, kutu doldurma oranı, konveks kabuğa göre kıvrımlılık,
              içindeki delik sayısı ve fincandaki konumu hesaplanır.
            </li>
            <li>
              <b className="text-[#ded4f0]">5. Sembolle eşleştirme.</b> Sözlükteki{' '}
              {SEMBOLLER.length} geleneksel sembolün her birinin ölçülebilir bir tarifi var
              (örneğin yüzük: içinde bir delik, uzama ~1, kutu doldurma 0,2–0,7). Lekenin
              ölçüleri hangi tarife ne kadar uyuyorsa o kadar puan alır; en yüksek puanlı sembol
              seçilir ve bir sembol iki kez kullanılmaz.
            </li>
            <li>
              <b className="text-[#ded4f0]">6. Bölge okuması.</b> Fincan, geleneğe uygun olarak
              kenar (yakın gelecek), orta (şimdi) ve dip (geçmiş) diye üçe; sağ (gelenler) ve sol
              (gidenler) diye ikiye bölünür. Her bölgenin telve yoğunluğu ayrı ölçülür.
            </li>
          </ol>
          <p className="mt-4 rounded-xl border border-altin-400/15 bg-gece-900/40 p-4 text-sm text-[#a99ec6]">
            Hiçbir adımda rastgele sayı kullanılmaz. Aynı fotoğrafı yüz kez yükle, yüz kez aynı
            falı alırsın. Farklı bir fotoğraf ise farklı ölçüler verdiği için farklı okunur.
          </p>
        </Panel>

        <Panel className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">
            🔮 Tarot — gerçek deste, tekrarlanabilir karıştırma
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#c3b8dd]">
            <li>
              <b className="text-[#ded4f0]">Kart anlamları.</b> {DESTE.length} kartın özgün
              anlamları Mark McElroy’un <i>A Guide to Tarot Card Meanings</i> çalışmasından
              geliyor (dariusk/corpora veri seti). Her kartın anahtar kelimeleri, aydınlık ve
              gölge anlamları sitede “Kaynak veri” başlığı altında olduğu gibi gösteriliyor.
              Türkçe okumalar bu verinin üzerine yazılmış ayrı bir katman.
            </li>
            <li>
              <b className="text-[#ded4f0]">Kart görselleri.</b> 1909 tarihli Rider–Waite–Smith
              destesi, Pamela Colman Smith’in çizimleri. Telif süresi dolmuş, kamu malı;
              Wikimedia Commons’tan indirildi.
            </li>
            <li>
              <b className="text-[#ded4f0]">Karıştırma.</b> İsim, doğum tarihi, soru, gün ve tur
              numarası birleştirilip <i>xmur3</i> ile 32 bitlik bir tohuma çevrilir; deste bu
              tohumla beslenen <i>mulberry32</i> üretecinin yönlendirdiği Fisher–Yates
              algoritmasıyla karılır. Fisher–Yates her dizilime eşit şans verir. Aynı girdiyle
              aynı açılım çıkar — “yeniden karıştır” demedikçe sayfayı yenilemek falını
              değiştirmez.
            </li>
          </ul>
        </Panel>

        <Panel className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">
            ✨ Doğum haritası — gökyüzü hesabı
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#c3b8dd]">
            <li>
              <b className="text-[#ded4f0]">Güneş ve Ay.</b> Jean Meeus’un{' '}
              <i>Astronomical Algorithms</i> kitabındaki yöntemlerle hesaplanır. Güneş’in görünen
              boylamı yaklaşık 0,01°, Ay’ınki yaklaşık 0,1° doğrulukta. Burcun, takvim
              aralığından değil, bu boylamın hangi 30°’lik dilime düştüğünden çıkar — bu yüzden
              burç sınırında doğanlar doğru sonucu alır.
            </li>
            <li>
              <b className="text-[#ded4f0]">Yükselen.</b> Doğum anının Greenwich yıldız zamanı
              hesaplanır, doğduğun ilin boylamıyla yerel yıldız zamanına çevrilir; ekliptik
              eğikliği ve enlemle birlikte doğu ufkunda yükselen ekliptik derece bulunur.
            </li>
            <li>
              <b className="text-[#ded4f0]">Saat dilimi.</b> Türkiye 2016 Eylülüne kadar yaz
              saati uyguluyordu. Yerel doğum saatin, tarihe uygun ofsetle evrensel zamana
              çevrilir; 1990 yazında doğan biri UTC+3, aynı yılın kışında doğan biri UTC+2
              üzerinden hesaplanır.
            </li>
            <li>
              <b className="text-[#ded4f0]">İl koordinatları.</b> {ILLER.length} ilin enlem ve
              boylamı Wikidata’dan alındı; plaka kodları resmî listeden eşlendi.
            </li>
            <li>
              <b className="text-[#ded4f0]">Çin zodyağı.</b> Sabit bir tablo kullanılmıyor. Çin
              yılbaşı, kış gündönümünü içeren ay ayından iki ay sonrası olarak — artık ay kuralı
              da uygulanarak — gerçek yeni ay anlarından hesaplanıyor. Ay başlangıçları Çin yerel
              gününe (UTC+8) göre belirleniyor.
            </li>
            <li>
              <b className="text-[#ded4f0]">Numeroloji.</b> Pisagor sistemi, Türkçe alfabeye
              uyarlandı: Ç→C, Ğ→G, İ→I, Ö→O, Ş→S, Ü→U. Sesli harfler A E I İ O Ö U Ü. 11, 22 ve
              33 usta sayı sayılır ve indirgenmez. Her sonucun altında hesap adımları görünür.
            </li>
          </ul>
        </Panel>

        <Panel className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">Doğruluk denetimi</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">
            Hesaplar kendi kendine doğrulanıyor. Gök hesapları Meeus’un kitabındaki referans
            örneklerle sınanıyor: 1992-10-13 için Güneş boylamı 199,90895°, 1992-04-12 için Ay
            boylamı 133,162655°, 1987-04-10 için yıldız zamanı 197,693195°. Çin yılbaşı hesabı
            1984, 2015, 2024 ve artık ay istisnası içeren 2033 gibi bilinen yıllarla
            karşılaştırılıyor. Görüntü analizi ise ölçüleri önceden bilinen sentetik şekillerle
            (dolu daire, çizgi, üçgen, halka) sınanıyor.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">
            Aynı kod hem tarayıcıda hem testlerde çalışır: görüntü analizi ham piksel
            dizisi üzerinde saf hesap yapar, platforma bağlı tek şey fotoğrafın çözülmesidir.
            Denetimler projedeki test takımında duruyor;{' '}
            <code className="rounded bg-gece-900/70 px-1.5 py-0.5 text-xs text-altin-300">
              npm test
            </code>{' '}
            ile çalıştırılabilir.
          </p>
        </Panel>

        <Panel className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">Gizlilik</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">
            Bu sitenin sunucusu yok. Kahve falı, tarot ve doğum haritası hesaplarının tamamı
            tarayıcında çalışır; site yalnızca statik dosyalardan ibarettir. Yüklediğin
            fotoğraf hiçbir yere gönderilmez, ismin ve doğum tarihin hiçbir yere kaydedilmez.
            İstersen sayfayı açtıktan sonra internet bağlantını kesip fal baktırabilirsin —
            yine de çalışır.
          </p>
        </Panel>

        <Panel vurgulu className="p-7 sm:p-8">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">Ve son bir söz</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">
            Ölçümler gerçek, kaynaklar açık, hesaplar denetlenebilir. Ama telvenin şeklinden
            geleceğin okunabileceğine dair bilimsel bir kanıt yok — bunu bilerek eğlen. Fincan
            yol gösterir, yolu yürüyen sensin.
          </p>
        </Panel>
      </div>
    </div>
  )
}
