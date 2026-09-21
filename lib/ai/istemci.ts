'use client'

/**
 * Yapay zekâ yorumunu isteyen istemci tarafı.
 *
 * Yorum gelmezse hata fırlatılmaz: `durum` "yedek"e düşer ve sayfa tarayıcıda
 * hesaplanmış okumayı göstermeye devam eder. Yani AI bir katman, bağımlılık
 * değil — anahtar tanımsızken ya da kota dolduğunda site çalışmaya devam eder.
 */
import { useCallback, useEffect, useState } from 'react'
import { AI_HATA_METNI, type AiGirdi, type AiYanit, type AiYorum } from './tipler'

export type AiDurumu = 'bekliyor' | 'yazıyor' | 'hazır' | 'yedek'

export type AiSonucu = {
  durum: AiDurumu
  yorum: AiYorum | null
  /** Yedeğe düşüldüyse kullanıcıya gösterilecek kısa açıklama */
  not: string | null
  tekrarDene: () => void
}

type Kayit = {
  /** Sonucun hangi isteğe ait olduğu; istek değişince kayıt bayatlar. */
  istek: string | null
  yorum: AiYorum | null
  not: string | null
}

const BOS: Kayit = { istek: null, yorum: null, not: null }

/**
 * Girdi değiştiğinde yorumu yeniden ister. `girdi` null iken hiçbir şey
 * yapmaz; böylece kullanıcı henüz fal baktırmadan istek gitmez.
 */
export function useAiYorumu(girdi: AiGirdi | null): AiSonucu {
  const [kayit, setKayit] = useState<Kayit>(BOS)
  const [tur, setTur] = useState(0)

  // Girdinin kendisi her çizimde yeni bir nesnedir; isteği içeriğine göre
  // kimliklendiriyoruz. Tur numarası "tekrar dene"yi de ayrı bir istek yapar.
  const govde = girdi ? JSON.stringify(girdi) : null
  const istek = govde ? `${tur}|${govde}` : null

  useEffect(() => {
    if (!govde || !istek) return

    const durdurucu = new AbortController()
    ;(async () => {
      try {
        const yanit = await fetch('./api/yorum', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: govde,
          signal: durdurucu.signal,
        })
        const veri = (await yanit.json()) as AiYanit
        if (durdurucu.signal.aborted) return
        setKayit(
          'yorum' in veri
            ? { istek, yorum: veri.yorum, not: null }
            : { istek, yorum: null, not: AI_HATA_METNI[veri.kod] ?? AI_HATA_METNI.sunucu },
        )
      } catch (sorun) {
        if (durdurucu.signal.aborted) return
        console.error('Yapay zekâ yorumu alınamadı', sorun)
        setKayit({ istek, yorum: null, not: AI_HATA_METNI.sunucu })
      }
    })()

    return () => durdurucu.abort()
  }, [govde, istek])

  const tekrarDene = useCallback(() => setTur((t) => t + 1), [])

  // Elimizdeki kayıt bu isteğe ait değilse yanıt hâlâ yolda demektir; durumu
  // efektte değil, burada türetiyoruz.
  const guncel = kayit.istek === istek
  const durum: AiDurumu = !istek
    ? 'bekliyor'
    : !guncel
      ? 'yazıyor'
      : kayit.yorum
        ? 'hazır'
        : 'yedek'

  return {
    durum,
    yorum: guncel ? kayit.yorum : null,
    not: guncel ? kayit.not : null,
    tekrarDene,
  }
}
