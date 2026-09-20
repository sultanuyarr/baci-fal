'use client'

import { useEffect, useRef } from 'react'
import type { FincanAnalizi } from '@/lib/kahve/goruntu'

/**
 * Analizin gerçekten ne gördüğünü çizer: kırmızı çember tespit edilen fincan
 * ağzı, yeşil alan telve maskesi. Okumanın uydurma olmadığının görsel kanıtı.
 */
export function TelveHaritasi({ analiz }: { analiz: FincanAnalizi }) {
  const tuvalRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const tuval = tuvalRef.current
    if (!tuval) return
    const baglam = tuval.getContext('2d')
    if (!baglam) return

    const { genislik: g, yukseklik: y, gorsel, fincan } = analiz
    tuval.width = g
    tuval.height = y

    const resim = baglam.createImageData(g, y)
    const { merkez, yaricap } = fincan

    for (let j = 0; j < y; j++) {
      for (let i = 0; i < g; i++) {
        const p = j * g + i
        const k = p * 4
        const ton = gorsel.gri[p]
        const uzaklik = Math.hypot(i - merkez.x, j - merkez.y)

        let r = ton
        let ye = ton
        let m = ton
        if (Math.abs(uzaklik - yaricap) < 1.2) {
          // Fincan ağzı
          r = 244
          ye = 223
          m = 164
        } else if (uzaklik > yaricap) {
          // Disk dışı: soluklaştır
          r = Math.round(ton * 0.35)
          ye = Math.round(ton * 0.32)
          m = Math.round(ton * 0.45)
        } else if (gorsel.maske[p]) {
          // Telve
          r = Math.round(ton * 0.35 + 30)
          ye = Math.round(ton * 0.45 + 140)
          m = Math.round(ton * 0.4 + 90)
        }

        resim.data[k] = r
        resim.data[k + 1] = ye
        resim.data[k + 2] = m
        resim.data[k + 3] = 255
      }
    }
    baglam.putImageData(resim, 0, 0)
  }, [analiz])

  return (
    <figure className="m-0">
      <canvas
        ref={tuvalRef}
        className="w-full max-w-[320px] rounded-xl border border-altin-400/25"
        aria-label="Fotoğrafta tespit edilen fincan ağzı ve telve maskesi"
      />
      <figcaption className="mt-2 max-w-[320px] text-xs leading-relaxed text-[#8f84ab]">
        <span className="text-altin-300">Altın çember</span> tespit edilen fincan ağzı,{' '}
        <span className="text-emerald-300">yeşil alan</span> telve maskesi. Okuma bu maskenin
        şekillerinden çıktı.
      </figcaption>
    </figure>
  )
}
