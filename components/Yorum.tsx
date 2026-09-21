'use client'

import type { ReactNode } from 'react'
import type { AiSonucu } from '@/lib/ai/istemci'
import type { AiBolum } from '@/lib/ai/tipler'
import { Baslik, Panel } from './Panel'

/**
 * Okuma metninin üç parçası: özet, bölümler ve kapanış.
 *
 * Her parça yapay zekâ yorumu geldiyse onu, gelmediyse tarayıcıda hesaplanmış
 * yedek okumayı gösterir — ikisi de aynı biçimde çizilir ki kullanıcı için
 * yüzey değişmesin. Parçalar ayrı ayrı durur, çünkü sayfalarda aralarına
 * ihtimal listesi ve sembol kartları giriyor.
 */

function yapayZekaMi(sonuc: AiSonucu): boolean {
  return sonuc.durum === 'hazır' && sonuc.yorum !== null
}

export function YorumOzeti({
  sonuc,
  yedek,
  etiket,
  yan,
}: {
  sonuc: AiSonucu
  yedek: string
  etiket: string
  /** Özetin yanına konacak görsel (telve haritası gibi) */
  yan?: ReactNode
}) {
  const ai = yapayZekaMi(sonuc)

  return (
    <Panel vurgulu className="belir p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Baslik etiket={etiket} baslik="Okuma" seviye={2} />
        {ai && (
          <span className="rounded-full border border-altin-400/25 bg-gece-900/50 px-3 py-1 text-xs text-[#a99ec6]">
            ✨ Bacı’nın uzun yorumu
          </span>
        )}
      </div>

      {sonuc.durum === 'yazıyor' ? (
        <YaziliyorIskeleti />
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <p className="flex-1 leading-relaxed whitespace-pre-line text-[#ded4f0]">
            {ai ? sonuc.yorum!.ozet : yedek}
          </p>
          {yan && <div className="shrink-0">{yan}</div>}
        </div>
      )}

      {sonuc.durum === 'yedek' && sonuc.not && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-altin-400/12 pt-4">
          <p className="flex-1 text-xs text-[#8f84ab]">{sonuc.not}</p>
          <button
            onClick={sonuc.tekrarDene}
            className="rounded-lg border border-altin-400/30 px-3 py-1.5 text-xs text-altin-300 transition hover:border-altin-400/60 hover:bg-altin-400/10"
          >
            Tekrar dene
          </button>
        </div>
      )}
    </Panel>
  )
}

export function YorumBolumleri({ sonuc, yedek }: { sonuc: AiSonucu; yedek: AiBolum[] }) {
  if (sonuc.durum === 'yazıyor') return null
  const bolumler = yapayZekaMi(sonuc) ? sonuc.yorum!.bolumler : yedek

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {bolumler.map((b, i) => (
        <Panel key={`${b.baslik}-${i}`} className="belir p-6">
          <h3 className="font-baslik text-xl font-semibold text-altin-300">{b.baslik}</h3>
          <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-[#c3b8dd]">
            {b.metin}
          </p>
        </Panel>
      ))}
    </section>
  )
}

export function YorumKapanisi({ sonuc, yedek }: { sonuc: AiSonucu; yedek: string }) {
  if (sonuc.durum === 'yazıyor') return null
  const kapanis = yapayZekaMi(sonuc) ? sonuc.yorum!.kapanis : yedek
  if (!kapanis) return null

  return (
    <Panel vurgulu className="belir p-6 text-center">
      <p className="font-baslik text-lg italic text-altin-300">{kapanis}</p>
    </Panel>
  )
}

/** Yorum yazılırken gösterilen bekleme iskeleti. */
function YaziliyorIskeleti() {
  return (
    <div className="mt-4">
      <p className="nabiz text-sm text-[#a99ec6]">
        Bacı bakıyor, yorumunu yazıyor… bu yarım dakikayı bulabilir.
      </p>
      <div className="mt-4 space-y-2.5" aria-hidden>
        {[100, 96, 88, 94, 62].map((en, i) => (
          <div
            key={i}
            className="nabiz h-3 rounded bg-gece-700/70"
            style={{ width: `${en}%`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
