'use client'

import Image from 'next/image'
import { useState } from 'react'
import { varlik } from '@/lib/altyol'
import { acilimYap, type Acilim, type AcilimTuru } from '@/lib/tarot/acilim'
import { Baslik, Dugme, Hata, Panel } from '@/components/Panel'

type AcilimSecenegi = { tur: AcilimTuru; ad: string; ozet: string; kartSayisi: number }

const CEVAP_RENGI: Record<string, string> = {
  evet: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  hayir: 'text-gul-400 border-gul-500/40 bg-gul-500/10',
  belki: 'text-altin-300 border-altin-400/40 bg-altin-400/10',
}

const CEVAP_METNI: Record<string, string> = { evet: 'EVET', hayir: 'HAYIR', belki: 'BELKİ' }

export function TarotFormu({ acilimlar }: { acilimlar: AcilimSecenegi[] }) {
  const [tur, setTur] = useState<AcilimTuru>('uclu')
  const [isim, setIsim] = useState('')
  const [dogumTarihi, setDogumTarihi] = useState('')
  const [soru, setSoru] = useState('')
  const [turNo, setTurNo] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [acilim, setAcilim] = useState<Acilim | null>(null)

  const secili = acilimlar.find((a) => a.tur === tur)!

  /** Açılımı tarayıcıda çeker; deste ve karıştırma tamamen istemcide. */
  async function cek(yeniTurNo: number) {
    if (tur === 'evet-hayir' && !soru.trim()) {
      setHata('Evet/Hayır açılımı için net bir soru yazman gerekiyor.')
      setAcilim(null)
      return
    }
    setYukleniyor(true)
    setHata(null)
    await new Promise((coz) => requestAnimationFrame(() => coz(null)))
    try {
      setTurNo(yeniTurNo)
      setAcilim(
        acilimYap({
          tur,
          isim: isim.slice(0, 80),
          dogumTarihi,
          soru: soru.slice(0, 300),
          tur_no: yeniTurNo,
        }),
      )
    } catch {
      setHata('Kartlar çekilemedi. Sayfayı yenileyip tekrar dene.')
      setAcilim(null)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <Panel vurgulu className="p-6 sm:p-8">
        <fieldset>
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-altin-500">
            Açılımı seç
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {acilimlar.map((a) => (
              <label
                key={a.tur}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  tur === a.tur
                    ? 'border-altin-400/60 bg-altin-400/10'
                    : 'border-altin-400/15 bg-gece-900/40 hover:border-altin-400/35'
                }`}
              >
                <input
                  type="radio"
                  name="acilim"
                  value={a.tur}
                  checked={tur === a.tur}
                  onChange={() => {
                    setTur(a.tur)
                    setAcilim(null)
                  }}
                  className="sr-only"
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-baslik text-lg font-semibold text-altin-300">{a.ad}</span>
                  <span className="shrink-0 text-xs text-[#8f84ab]">{a.kartSayisi} kart</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#a99ec6]">{a.ozet}</p>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="isim" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Adın <span className="text-[#8f84ab]">(isteğe bağlı)</span>
            </label>
            <input
              id="isim"
              className="alan"
              value={isim}
              onChange={(e) => setIsim(e.target.value)}
              placeholder="Ayşe"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="dogum" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Doğum tarihin <span className="text-[#8f84ab]">(isteğe bağlı)</span>
            </label>
            <input
              id="dogum"
              type="date"
              className="alan"
              value={dogumTarihi}
              onChange={(e) => setDogumTarihi(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="soru" className="mb-1.5 block text-sm text-[#c3b8dd]">
            Sorun{' '}
            <span className="text-[#8f84ab]">
              {tur === 'evet-hayir' ? '(bu açılım için gerekli)' : '(isteğe bağlı)'}
            </span>
          </label>
          <input
            id="soru"
            className="alan"
            value={soru}
            onChange={(e) => setSoru(e.target.value)}
            placeholder={
              tur === 'evet-hayir' ? 'Bu işe girmeli miyim?' : 'Aklındaki konuyu bir cümleyle yaz'
            }
            maxLength={300}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Dugme onClick={() => cek(0)} disabled={yukleniyor}>
            {yukleniyor ? 'Deste karılıyor…' : `${secili.ad} açılımını çek`}
          </Dugme>
          {acilim && (
            <button
              onClick={() => cek(turNo + 1)}
              disabled={yukleniyor}
              className="rounded-xl border border-altin-400/30 px-5 py-3 text-sm text-altin-300 transition hover:border-altin-400/60 hover:bg-altin-400/10 disabled:opacity-45"
            >
              🔄 Yeniden karıştır
            </button>
          )}
        </div>

        {hata && <div className="mt-4"><Hata mesaj={hata} /></div>}
      </Panel>

      {acilim && <AcilimSonucu acilim={acilim} />}
    </div>
  )
}

function AcilimSonucu({ acilim }: { acilim: Acilim }) {
  return (
    <div className="space-y-6">
      {acilim.cevap && (
        <Panel vurgulu className="belir p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-altin-500">Destenin cevabı</p>
          <p
            className={`mx-auto mt-4 inline-block rounded-2xl border px-8 py-3 font-baslik text-4xl font-semibold ${
              CEVAP_RENGI[acilim.cevap.deger]
            }`}
          >
            {CEVAP_METNI[acilim.cevap.deger]}
          </p>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-[#ded4f0]">
            {acilim.cevap.metin}
          </p>
        </Panel>
      )}

      <Panel vurgulu className="belir p-6 sm:p-8">
        <Baslik etiket={acilim.tanim.ad} baslik="Açılımın geneli" seviye={2} />
        {acilim.soru && (
          <p className="mt-3 font-baslik text-lg italic text-altin-300">“{acilim.soru}”</p>
        )}
        <p className="mt-4 leading-relaxed text-[#ded4f0]">{acilim.ozet}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {acilim.kartlar.map((k, i) => (
          <div key={k.pozisyon.ad} className="cevril" style={{ animationDelay: `${i * 130}ms` }}>
            <Panel className="flex h-full flex-col gap-5 p-6 sm:flex-row">
              <div className="mx-auto shrink-0 sm:mx-0">
                <div
                  className={`overflow-hidden rounded-lg border border-altin-400/30 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.8)] ${
                    k.ters ? 'rotate-180' : ''
                  }`}
                >
                  <Image
                    src={varlik(k.kart.gorsel)}
                    alt={`${k.kart.ad} tarot kartı`}
                    width={130}
                    height={222}
                    className="block h-auto w-[130px]"
                  />
                </div>
                {k.ters && (
                  <p className="mt-2 text-center text-xs uppercase tracking-wider text-gul-400">
                    ters
                  </p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-altin-500">
                  {k.pozisyon.ad}
                </p>
                <h3 className="mt-1 font-baslik text-2xl font-semibold text-altin-300">
                  {k.kart.ad}
                  {k.ters && <span className="text-lg text-gul-400"> (ters)</span>}
                </h3>
                <p className="mt-1 text-xs text-[#8f84ab]">{k.pozisyon.aciklama}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {k.kart.anahtar.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-altin-400/20 bg-gece-900/50 px-2.5 py-0.5 text-xs text-[#b3a8cd]"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#ded4f0]">{k.okuma}</p>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-altin-500 hover:text-altin-400">
                    Kaynak veri
                  </summary>
                  <div className="mt-2.5 space-y-1.5 text-xs text-[#a99ec6]">
                    <p>
                      <span className="text-[#8f84ab]">Özgün ad:</span> {k.kart.kaynak.ad}
                    </p>
                    <p>
                      <span className="text-[#8f84ab]">Anahtar kelimeler:</span>{' '}
                      {k.kart.kaynak.anahtarKelimeler.join(', ')}
                    </p>
                    <p>
                      <span className="text-[#8f84ab]">
                        {k.ters ? 'Gölge anlam' : 'Aydınlık anlam'}:
                      </span>{' '}
                      {k.kaynakCumle}
                    </p>
                  </div>
                </details>
              </div>
            </Panel>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#8f84ab]">
        Kart görselleri: Rider–Waite–Smith destesi (1909), Pamela Colman Smith — kamu malı.
        Kart anlamları: Mark McElroy, <em>A Guide to Tarot Card Meanings</em>.
      </p>
    </div>
  )
}
