import type { Metadata } from 'next'
import { ACILIMLAR } from '@/lib/tarot/acilim'
import { Baslik } from '@/components/Panel'
import { TarotFormu } from './TarotFormu'

export const metadata: Metadata = {
  title: 'Tarot — Bacı Fal',
  description:
    '78 kartlık tam Rider–Waite–Smith destesi. Günün kartı, evet/hayır, geçmiş–şimdi–gelecek, ilişki açılımı ve Kelt Haçı.',
}

export default function TarotSayfasi() {
  // Açılım tanımları sunucuda hazır; istemciye sade bir liste olarak geçiyor.
  const acilimlar = Object.values(ACILIMLAR).map((a) => ({
    tur: a.tur,
    ad: a.ad,
    ozet: a.ozet,
    kartSayisi: a.pozisyonlar.length,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Baslik
        etiket="78 kart, tam deste"
        baslik="Tarot"
        ortala
        aciklama={
          <p>
            Deste ismine, doğum tarihine, sorduğun soruya ve güne göre karılır: aynı gün aynı
            soruyu sorarsan aynı açılımı alırsın. Kartların üçte biri kadarı ters gelir ve ters
            kart gölge anlamıyla okunur.
          </p>
        }
      />
      <TarotFormu acilimlar={acilimlar} />
    </div>
  )
}
