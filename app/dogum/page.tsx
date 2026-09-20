import type { Metadata } from 'next'
import { ILLER } from '@/lib/dogum/harita'
import { Baslik } from '@/components/Panel'
import { DogumFormu } from './DogumFormu'

export const metadata: Metadata = {
  title: 'Doğum Haritası — Bacı Fal',
  description:
    'Güneş burcun takvimden değil, doğduğun andaki gerçek gök konumundan. Ay burcu, ay evresi, yükselen, numeroloji ve Çin zodyağı.',
}

export default function DogumSayfasi() {
  const iller = ILLER.map((i) => ({ plaka: i.plaka, ad: i.ad }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Baslik
        etiket="İsim, tarih, saat ve yer"
        baslik="Doğum Haritası"
        ortala
        aciklama={
          <p>
            Burcun sabit tarih aralıklarından değil, doğduğun andaki Güneş’in gerçek ekliptik
            boylamından bulunur. Doğum saatini ve ilini de verirsen yükselen burcun hesaplanır;
            üstüne isminden çıkan numeroloji ve gerçek Çin takviminden çıkan yıl hayvanın eklenir.
          </p>
        }
      />
      <DogumFormu iller={iller} />
    </div>
  )
}
