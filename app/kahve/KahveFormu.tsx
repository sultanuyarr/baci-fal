'use client'

import { useRef, useState } from 'react'
import { dosyayiAnalizEt } from '@/lib/kahve/cozucu-tarayici'
import type { FincanAnalizi } from '@/lib/kahve/goruntu'
import { faliYorumla, type KahveFali } from '@/lib/kahve/yorum'
import { Baslik, Dugme, Hata, Olcum, Panel } from '@/components/Panel'
import { TelveHaritasi } from '@/components/TelveHaritasi'

const YUZDE = (o: number) => `%${(o * 100).toFixed(0)}`

export function KahveFormu() {
  const [onizleme, setOnizleme] = useState<string | null>(null)
  const [dosya, setDosya] = useState<File | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [fal, setFal] = useState<KahveFali | null>(null)
  const [analiz, setAnaliz] = useState<FincanAnalizi | null>(null)
  const girdiRef = useRef<HTMLInputElement>(null)

  function dosyaSec(secilen: File | null) {
    setHata(null)
    setFal(null)
    setAnaliz(null)
    setDosya(secilen)
    if (onizleme) URL.revokeObjectURL(onizleme)
    setOnizleme(secilen ? URL.createObjectURL(secilen) : null)
  }

  /**
   * Falı tarayıcıda hesaplar. Fotoğraf hiçbir yere gönderilmez; çözümleme
   * Canvas üzerinden okunan piksellerle burada, cihazda yapılır.
   */
  async function bak() {
    if (!dosya) return
    setYukleniyor(true)
    setHata(null)
    setFal(null)
    setAnaliz(null)
    // Tarayıcının yükleniyor durumunu çizmesine fırsat ver.
    await new Promise((coz) => requestAnimationFrame(() => coz(null)))
    try {
      const sonuc = await dosyayiAnalizEt(dosya)
      setAnaliz(sonuc)
      setFal(faliYorumla(sonuc))
    } catch (sorun) {
      setHata(
        sorun instanceof Error && sorun.message
          ? `${sorun.message} Fincanın içi net görünen başka bir kare dene.`
          : 'Fotoğraf çözümlenemedi. Fincanın içi net görünen başka bir kare dene.',
      )
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <Panel vurgulu className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <label
              htmlFor="fincan-fotografi"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-altin-400/30 bg-gece-900/40 px-6 py-10 text-center transition hover:border-altin-400/55 hover:bg-gece-900/60"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                dosyaSec(e.dataTransfer.files?.[0] ?? null)
              }}
            >
              <span className="text-4xl" aria-hidden>
                {onizleme ? '🔁' : '📷'}
              </span>
              <span className="font-baslik text-xl text-altin-300">
                {dosya ? 'Başka bir fotoğraf seç' : 'Fincan fotoğrafını yükle'}
              </span>
              <span className="text-sm text-[#a99ec6]">
                Sürükleyip bırakabilir ya da tıklayıp seçebilirsin — JPEG, PNG, WebP veya HEIC
              </span>
              {dosya && (
                <span className="text-xs text-[#8f84ab]">
                  {dosya.name} · {(dosya.size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </label>
            <input
              id="fincan-fotografi"
              ref={girdiRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => dosyaSec(e.target.files?.[0] ?? null)}
            />

            <details className="mt-4 text-sm text-[#a99ec6]">
              <summary className="cursor-pointer text-altin-400/90 hover:text-altin-300">
                İyi bir fincan fotoğrafı nasıl çekilir?
              </summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Fincanı tam tepeden çek; içi baştan sona görünsün.</li>
                <li>Gölge düşürme — ışık yandan değil üstten gelsin.</li>
                <li>Fincan kareyi doldursun, arkada masa kalabalığı olmasın.</li>
                <li>Telve kurumuş olsun; ıslak telve parlar ve ölçümü şaşırtır.</li>
              </ul>
            </details>
          </div>

          {onizleme && (
            <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full border-2 border-altin-400/35 shadow-[0_0_30px_-8px_rgba(233,196,104,0.35)]">
              {/* Kullanıcının seçtiği yerel dosya; next/image optimizasyonu gerekmiyor. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={onizleme} alt="Yüklenen fincan fotoğrafı" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Dugme onClick={bak} disabled={!dosya || yukleniyor}>
            {yukleniyor ? 'Telve okunuyor…' : 'Falıma bak'}
          </Dugme>
          {yukleniyor && (
            <span className="nabiz text-sm text-[#a99ec6]">
              Lekeler ölçülüyor, sembollerle eşleştiriliyor…
            </span>
          )}
        </div>

        {hata && <div className="mt-4"><Hata mesaj={hata} /></div>}
      </Panel>

      {fal && analiz && <FalSonucu fal={fal} analiz={analiz} />}
    </div>
  )
}

function FalSonucu({ fal, analiz }: { fal: KahveFali; analiz: FincanAnalizi }) {
  return (
    <div className="space-y-6">
      <Panel vurgulu className="belir p-6 sm:p-8">
        <Baslik etiket="Fincanın söyledikleri" baslik="Okuma" seviye={2} />
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <p className="flex-1 leading-relaxed text-[#ded4f0]">{fal.ozet}</p>
          <div className="shrink-0">
            <TelveHaritasi analiz={analiz} />
          </div>
        </div>
      </Panel>

      {fal.semboller.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-baslik text-2xl font-semibold text-altin-300">
            Çıkan semboller
          </h2>
          {fal.semboller.map((s, i) => (
            <div key={s.id} className="belir" style={{ animationDelay: `${i * 80}ms` }}>
              <Panel className="p-6">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl" aria-hidden>{s.emoji}</span>
                  <h3 className="font-baslik text-2xl font-semibold text-altin-300">{s.ad}</h3>
                  <span className="rounded-full border border-altin-400/25 px-2.5 py-0.5 text-xs text-[#a99ec6]">
                    eşleşme gücü {YUZDE(s.guven)}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-[#ded4f0]">{s.anlam}</p>
                <p className="mt-2 text-sm text-[#a99ec6]">Konumu: {s.konum}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-altin-500 hover:text-altin-400">
                    Bu lekenin ölçüleri
                  </summary>
                  <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Olcum etiket="Dairesellik" deger={s.olculer.dairesellik.toFixed(2)} />
                    <Olcum etiket="Uzama" deger={`${s.olculer.uzama.toFixed(1)}×`} />
                    <Olcum etiket="Doluluk" deger={s.olculer.doluluk.toFixed(2)} />
                    <Olcum etiket="Kıvrım" deger={s.olculer.kivrim.toFixed(2)} />
                    <Olcum etiket="Delik" deger={String(s.olculer.delik)} />
                    <Olcum etiket="Fincanın" deger={`%${s.olculer.alanYuzdesi.toFixed(1)}`} />
                  </dl>
                </details>
              </Panel>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {fal.bolumler.map((b) => (
          <Panel key={b.baslik} className="belir p-6">
            <h3 className="font-baslik text-xl font-semibold text-altin-300">{b.baslik}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[#c3b8dd]">{b.metin}</p>
          </Panel>
        ))}
      </section>

      <Panel className="p-6">
        <h3 className="font-baslik text-xl font-semibold text-altin-300">Fincanın ölçüleri</h3>
        <p className="mt-2 text-sm text-[#a99ec6]">
          Yorum bu sayılardan türetildi. Aynı fotoğrafı tekrar yüklersen aynı sonucu alırsın.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Olcum etiket="Telve doluluğu" deger={YUZDE(fal.olcumler.doluluk)} />
          <Olcum etiket="Simetri" deger={YUZDE(fal.olcumler.simetri)} />
          <Olcum etiket="Hareket" deger={YUZDE(fal.olcumler.hareket)} />
          <Olcum etiket="Açıklık" deger={YUZDE(fal.olcumler.aciklik)} />
          <Olcum etiket="Kenar" deger={YUZDE(fal.olcumler.bolgeler.kenar)} />
          <Olcum etiket="Orta" deger={YUZDE(fal.olcumler.bolgeler.orta)} />
          <Olcum etiket="Dip" deger={YUZDE(fal.olcumler.bolgeler.dip)} />
          <Olcum etiket="Leke sayısı" deger={String(fal.olcumler.lekeSayisi)} />
        </dl>
      </Panel>

      <Panel vurgulu className="belir p-6 text-center">
        <p className="font-baslik text-lg italic text-altin-300">{fal.kapanis}</p>
      </Panel>
    </div>
  )
}
