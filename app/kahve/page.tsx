import type { Metadata } from 'next'
import { KahveFormu } from './KahveFormu'
import { Baslik } from '@/components/Panel'

export const metadata: Metadata = {
  title: 'Kahve Falı — Bacı Fal',
  description:
    'Fincanının fotoğrafını yükle. Telvenin şekli gerçekten ölçülüp geleneksel kahve falı sembolleriyle eşleştirilsin.',
}

export default function KahveSayfasi() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Baslik
        etiket="Fincanı kapat, fotoğrafı yükle"
        baslik="Kahve Falı"
        ortala
        aciklama={
          <p>
            Fotoğrafın gri tonlamaya çevrilir, telve ile porselen Otsu eşiklemesiyle ayrılır ve
            her leke ölçülür. Çıkan geometri — dairesellik, uzama, kıvrım, delik sayısı ve
            fincandaki konum — geleneksel sembollerin tarifleriyle eşleştirilir.
          </p>
        }
      />
      <KahveFormu />
    </div>
  )
}
