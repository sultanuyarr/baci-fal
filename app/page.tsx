import Link from 'next/link'
import { Panel } from '@/components/Panel'

const BOLUMLER = [
  {
    yol: '/kahve',
    simge: '☕',
    ad: 'Kahve Falı',
    ozet: 'Fincanının fotoğrafını yükle. Telvenin şekli gerçekten ölçülür: lekelerin daireselliği, uzunluğu, kıvrımı ve fincandaki yeri hesaplanıp geleneksel sembollerle eşleştirilir.',
    temel: 'Görüntü işleme — Otsu eşikleme, bağlı bileşen analizi',
  },
  {
    yol: '/tarot',
    simge: '🔮',
    ad: 'Tarot',
    ozet: '78 kartlık tam deste, kamu malı Rider–Waite–Smith görselleriyle. Günün kartından on kartlık Kelt Haçı’na kadar beş açılım; isim ve doğum tarihine bağlı, tekrarlanabilir karıştırma.',
    temel: 'Gerçek anlam veri seti + tohumlanmış karıştırma',
  },
  {
    yol: '/dogum',
    simge: '✨',
    ad: 'Doğum Haritası',
    ozet: 'Burcun takvimden değil, doğduğun andaki Güneş’in gerçek konumundan bulunur. Ay burcu, ay evresi, yükselen, numeroloji ve Çin zodyağı bir arada.',
    temel: 'Meeus astronomi algoritmaları + Pisagor numerolojisi',
  },
]

export default function AnaSayfa() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <section className="belir text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-altin-500">
          Hesaplanmış kehanet
        </p>
        <h1 className="mt-5 font-baslik text-5xl font-semibold leading-tight text-altin-300 sm:text-7xl">
          Bacı Fal
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#c3b8dd]">
          Fal bakarken uydurmuyoruz. Fincanındaki telve gerçekten ölçülüyor, tarot destesi
          gerçek bir anlam veri setinden geliyor, burcun doğduğun andaki gökyüzünden
          hesaplanıyor. Yorum geleneksel — ama altındaki sayılar gerçek.
        </p>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {BOLUMLER.map((b, i) => (
          <Link key={b.yol} href={b.yol} className="belir group" style={{ animationDelay: `${i * 90}ms` }}>
            <Panel className="flex h-full flex-col p-7 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-altin-400/40 group-hover:bg-gece-700/60">
              <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                {b.simge}
              </span>
              <h2 className="mt-4 font-baslik text-2xl font-semibold text-altin-300">{b.ad}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#b3a8cd]">{b.ozet}</p>
              <p className="mt-5 border-t border-altin-400/12 pt-4 text-[11px] uppercase tracking-wider text-[#8f84ab]">
                {b.temel}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-altin-400">
                Başla
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Panel>
          </Link>
        ))}
      </section>

      <section className="mt-20">
        <Panel className="p-8 sm:p-10">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">
            Neden “gerçek veri”?
          </h2>
          <div className="mt-5 grid gap-6 text-sm leading-relaxed text-[#b3a8cd] sm:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium text-[#ded4f0]">Fotoğrafın okunuyor</h3>
              <p>
                Yüklediğin kare gri tonlamaya çevrilir, Otsu yöntemiyle telve ile porselen
                ayrılır, sonra her leke için dairesellik, uzama, doluluk ve delik sayısı
                hesaplanır. Aynı fotoğraf her zaman aynı falı verir.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-[#ded4f0]">Kaynaklar açık</h3>
              <p>
                Tarot anlamları Mark McElroy’un rehberinden, kart görselleri 1909 tarihli
                kamu malı Rider–Waite–Smith destesinden, il koordinatları Wikidata’dan
                geliyor. Hepsi sitede tek tek belirtiliyor.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-[#ded4f0]">Hesap denetlenebilir</h3>
              <p>
                Gök hesapları Jean Meeus’un <em>Astronomical Algorithms</em> kitabındaki
                yöntemlerle yapılıp kitaptaki referans değerlerle sınanıyor. Her sonucun
                altında kullanılan sayıları görebilirsin.
              </p>
            </div>
          </div>
          <Link
            href="/nasil"
            className="mt-7 inline-flex items-center gap-1.5 text-sm text-altin-400 underline-offset-4 hover:underline"
          >
            Yöntemin tamamını oku →
          </Link>
        </Panel>
      </section>
    </div>
  )
}
