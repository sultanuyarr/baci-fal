import { ALAN_SIMGESI, olasilikEtiketi, yuzde, type Ihtimal } from '@/lib/ihtimal'
import { Panel } from './Panel'

/** Olasılık çubuğunun rengi; yüksek ihtimal altın, düşük ihtimal soluk mor. */
function cubukRengi(olasilik: number): string {
  if (olasilik >= 0.6) return 'from-altin-500 to-altin-300'
  if (olasilik >= 0.4) return 'from-altin-600/80 to-altin-400/80'
  return 'from-[#6b5f8c] to-[#9a8cc2]'
}

/**
 * Ölçümlerden türeyen somut olay tahminlerini, en olasıdan aza doğru
 * yüzdeleriyle listeler.
 */
export function Ihtimaller({
  ihtimaller,
  baslik = 'En olası gelişmeler',
  aciklama,
}: {
  ihtimaller: Ihtimal[]
  baslik?: string
  aciklama?: string
}) {
  if (ihtimaller.length === 0) return null

  return (
    <Panel vurgulu className="belir p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-baslik text-2xl font-semibold text-altin-300">{baslik}</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-altin-500">
          en olasıdan aza
        </span>
      </div>
      {aciklama && <p className="mt-2 max-w-2xl text-sm text-[#a99ec6]">{aciklama}</p>}

      <ol className="mt-5 space-y-5">
        {ihtimaller.map((i, sira) => (
          <li key={i.id} className="belir" style={{ animationDelay: `${sira * 70}ms` }}>
            <div className="flex items-baseline gap-3">
              <span className="text-lg" aria-hidden>
                {ALAN_SIMGESI[i.alan]}
              </span>
              <p className="min-w-0 flex-1 leading-relaxed text-[#ded4f0]">{i.olay}</p>
              <span className="shrink-0 font-baslik text-xl font-semibold tabular-nums text-altin-300">
                {yuzde(i.olasilik)}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-gece-900/70"
              role="img"
              aria-label={`${yuzde(i.olasilik)} ihtimal — ${olasilikEtiketi(i.olasilik)}`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${cubukRengi(i.olasilik)}`}
                style={{ width: `${Math.round(i.olasilik * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[#8f84ab]">
              <span className="text-altin-500">{i.vade}</span> · {olasilikEtiketi(i.olasilik)}{' '}
              ihtimal — {i.gerekce}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-altin-400/12 pt-4 text-xs leading-relaxed text-[#8f84ab]">
        Yüzdeler falın kendi ölçümlerinden hesaplanır; bilimsel bir tahmin değil, okumanın
        hangi konuya ne kadar ağırlık verdiğinin sayıya dökülmüş hâlidir.
      </p>
    </Panel>
  )
}
