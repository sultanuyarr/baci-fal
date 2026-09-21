'use client'

import { useState } from 'react'
import { haritaCikar, type DogumHaritasi } from '@/lib/dogum/harita'
import { useAiYorumu } from '@/lib/ai/istemci'
import type { DogumGirdisi as AiDogumGirdisi } from '@/lib/ai/tipler'
import { Baslik, Dugme, Hata, Olcum, Panel } from '@/components/Panel'
import { Ihtimaller } from '@/components/Ihtimaller'
import { YorumBolumleri, YorumKapanisi, YorumOzeti } from '@/components/Yorum'

type IlSecenegi = { plaka: number; ad: string }

/** Ondalık dereceyi derece–dakika biçimine çevirir (60'a yuvarlanan dakikayı taşır). */
function DERECE(d: number): string {
  let derece = Math.floor(d)
  let dakika = Math.round((d - derece) * 60)
  if (dakika === 60) {
    derece += 1
    dakika = 0
  }
  return `${derece}°${String(dakika).padStart(2, '0')}′`
}

export function DogumFormu({ iller }: { iller: IlSecenegi[] }) {
  const [isim, setIsim] = useState('')
  const [tarih, setTarih] = useState('')
  const [saat, setSaat] = useState('')
  const [ilPlaka, setIlPlaka] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [harita, setHarita] = useState<DogumHaritasi | null>(null)

  /** Haritayı tarayıcıda hesaplar; gök hesapları saf JavaScript. */
  async function cikar() {
    const temizIsim = isim.trim().slice(0, 80)
    if (temizIsim.length < 2) return setHata('Adını ve soyadını yazar mısın?')

    const yil = Number(tarih.slice(0, 4))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return setHata('Doğum tarihi gerekli.')
    if (yil < 1900 || yil > new Date().getFullYear()) {
      return setHata('Doğum yılı 1900 ile bugün arasında olmalı.')
    }
    // Takvimde olmayan tarihleri (31 Şubat gibi) ele
    const zaman = new Date(`${tarih}T12:00:00Z`)
    if (Number.isNaN(zaman.getTime()) || zaman.toISOString().slice(0, 10) !== tarih) {
      return setHata('Böyle bir tarih yok.')
    }

    setYukleniyor(true)
    setHata(null)
    await new Promise((coz) => requestAnimationFrame(() => coz(null)))
    try {
      setHarita(
        haritaCikar({
          isim: temizIsim,
          tarih,
          saat: saat || undefined,
          ilPlaka: ilPlaka ? Number(ilPlaka) : undefined,
        }),
      )
    } catch {
      setHata('Harita hesaplanamadı. Girdiğin bilgileri kontrol eder misin?')
      setHarita(null)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <Panel vurgulu className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="isim" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Ad ve soyad
            </label>
            <input
              id="isim"
              className="alan"
              value={isim}
              onChange={(e) => setIsim(e.target.value)}
              placeholder="Ayşe Yılmaz"
              maxLength={80}
            />
            <p className="mt-1.5 text-xs text-[#8f84ab]">
              Numeroloji sayıları isminin harflerinden hesaplanır, nüfustaki hâlini yaz.
            </p>
          </div>

          <div>
            <label htmlFor="tarih" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Doğum tarihi
            </label>
            <input
              id="tarih"
              type="date"
              className="alan"
              value={tarih}
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setTarih(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="saat" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Doğum saati <span className="text-[#8f84ab]">(yükselen için)</span>
            </label>
            <input
              id="saat"
              type="time"
              className="alan"
              value={saat}
              onChange={(e) => setSaat(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="il" className="mb-1.5 block text-sm text-[#c3b8dd]">
              Doğduğun il <span className="text-[#8f84ab]">(yükselen için)</span>
            </label>
            <select
              id="il"
              className="alan"
              value={ilPlaka}
              onChange={(e) => setIlPlaka(e.target.value)}
            >
              <option value="">Seçilmedi</option>
              {iller.map((i) => (
                <option key={i.plaka} value={i.plaka}>
                  {String(i.plaka).padStart(2, '0')} · {i.ad}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Dugme onClick={cikar} disabled={yukleniyor || isim.trim().length < 2 || !tarih}>
            {yukleniyor ? 'Gökyüzü hesaplanıyor…' : 'Haritamı çıkar'}
          </Dugme>
          {yukleniyor && (
            <span className="nabiz text-sm text-[#a99ec6]">
              Güneş ve Ay’ın konumu, yükselen ve sayıların bulunuyor…
            </span>
          )}
        </div>

        {hata && <div className="mt-4"><Hata mesaj={hata} /></div>}
      </Panel>

      {harita && <HaritaSonucu harita={harita} />}
    </div>
  )
}

/** Yorumu yazması için modele gönderilen harita özeti. */
function aiGirdisi(h: DogumHaritasi): AiDogumGirdisi {
  return {
    tur: 'dogum',
    isim: h.isim,
    gunes: {
      burc: h.gunes.burc.ad,
      derece: h.gunes.derece,
      element: h.gunes.burc.element,
      nitelik: h.gunes.burc.nitelik,
    },
    ay: {
      burc: h.ay.burc.ad,
      derece: h.ay.derece,
      element: h.ay.burc.element,
      evre: h.ay.evre.ad,
      aydinlanma: h.ay.evre.aydinlanma,
    },
    yukselen: h.yukselen
      ? {
          burc: h.yukselen.burc.ad,
          derece: h.yukselen.derece,
          element: h.yukselen.burc.element,
        }
      : null,
    denge: {
      elementler: h.denge.elementler,
      baskinElement: h.denge.baskinElement,
      baskinNitelik: h.denge.baskinNitelik,
    },
    numeroloji: {
      yasamYolu: { sayi: h.numeroloji.yasamYolu.sayi, baslik: h.numeroloji.yasamYolu.baslik },
      ifade: h.numeroloji.ifade.sayi,
      ruhArzusu: h.numeroloji.ruhArzusu.sayi,
      kisilik: h.numeroloji.kisilik.sayi,
      kisiselYil: { sayi: h.numeroloji.kisiselYil.sayi, yil: h.numeroloji.kisiselYilYili },
    },
    cin: { ad: h.cin.ad, hayvan: h.cin.hayvan.ad, element: h.cin.element },
    ihtimaller: h.ihtimaller,
  }
}

function HaritaSonucu({ harita: h }: { harita: DogumHaritasi }) {
  const sonuc = useAiYorumu(aiGirdisi(h))
  const yerlesimler = [
    { etiket: 'Güneş', simge: '☉', yer: h.gunes, aciklama: 'Özün, iradenin ve hayattaki ana yönün' },
    { etiket: 'Ay', simge: '☽', yer: h.ay, aciklama: 'Duygusal dünyan ve içgüdüsel tepkilerin' },
    ...(h.yukselen
      ? [{ etiket: 'Yükselen', simge: '↑', yer: h.yukselen, aciklama: 'Dışarıya verdiğin ilk izlenim' }]
      : []),
  ]

  return (
    <div className="space-y-6">
      <YorumOzeti sonuc={sonuc} yedek={h.ozet} etiket="Büyük üçlün" />

      {h.notlar.length > 0 && (
        <Panel className="p-5">
          <ul className="space-y-1.5 text-xs text-[#8f84ab]">
            {h.notlar.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Ihtimaller
        ihtimaller={h.ihtimaller}
        aciklama="Zamanı kişisel yılın veriyor; haritanın element dengesi, Güneş-Ay ilişkisi ve Çin elementi bu konuların hangisinin destekli olduğunu belirliyor."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {yerlesimler.map((y, i) => (
          <div key={y.etiket} className="belir" style={{ animationDelay: `${i * 100}ms` }}>
            <Panel className="flex h-full flex-col p-6">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl text-altin-400" aria-hidden>{y.simge}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-altin-500">
                  {y.etiket}
                </span>
              </div>
              <h3 className="mt-2 font-baslik text-3xl font-semibold text-altin-300">
                {y.yer.burc.simge} {y.yer.burc.ad}
              </h3>
              <p className="mt-1 text-xs text-[#8f84ab]">
                {DERECE(y.yer.derece)} · {y.yer.burc.element} · {y.yer.burc.nitelik} ·{' '}
                {y.yer.burc.yonetici}
              </p>
              <p className="mt-1.5 text-xs italic text-[#8f84ab]">{y.aciklama}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#c3b8dd]">{y.yer.metin}</p>
            </Panel>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel className="belir p-6">
          <h3 className="font-baslik text-xl font-semibold text-altin-300">
            {h.ay.evre.simge} Doğduğunda Ay {h.ay.evre.ad.toLocaleLowerCase('tr-TR')}dı
          </h3>
          <p className="mt-1 text-xs text-[#8f84ab]">
            Aydınlanma oranı %{(h.ay.evre.aydinlanma * 100).toFixed(0)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">{h.ay.evre.yorum}</p>
        </Panel>

        <Panel className="belir p-6">
          <h3 className="font-baslik text-xl font-semibold text-altin-300">Element dengen</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(h.denge.elementler).map(([element, sayi]) => {
              const toplam = Object.values(h.denge.elementler).reduce((a, b) => a + b, 0)
              return (
                <div key={element} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-[#b3a8cd]">{element}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gece-900/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-altin-500 to-altin-300"
                      style={{ width: `${(sayi / toplam) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm text-[#8f84ab]">{sayi}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#c3b8dd]">{h.denge.elementMetni}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#c3b8dd]">{h.denge.nitelikMetni}</p>
        </Panel>
      </div>

      <Panel vurgulu className="belir p-6 sm:p-8">
        <Baslik etiket="İsminden ve tarihinden" baslik="Numeroloji" seviye={2} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            h.numeroloji.yasamYolu,
            h.numeroloji.ifade,
            h.numeroloji.ruhArzusu,
            h.numeroloji.kisilik,
            h.numeroloji.kisiselYil,
          ].map((s) => (
            <div key={s.baslik} className="rounded-xl border border-altin-400/12 bg-gece-900/40 p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-baslik text-3xl font-semibold text-altin-300">{s.sayi}</span>
                <span className="text-sm text-[#b3a8cd]">{s.baslik}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#c3b8dd]">{s.metin}</p>
            </div>
          ))}
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-altin-500 hover:text-altin-400">
            Sayılar nasıl çıktı?
          </summary>
          <ul className="mt-3 space-y-1.5 font-mono text-xs text-[#a99ec6]">
            {h.numeroloji.adimlar.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      </Panel>

      <Panel className="belir p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl" aria-hidden>{h.cin.hayvan.emoji}</span>
          <h3 className="font-baslik text-2xl font-semibold text-altin-300">{h.cin.ad}</h3>
          <span className="text-xs text-[#8f84ab]">
            {h.cin.yil} Çin yılı · yılbaşı {h.cin.yilbasi}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#c3b8dd]">{h.cin.hayvan.metin}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#c3b8dd]">{h.cin.elementYorumu}</p>
      </Panel>

      <YorumBolumleri sonuc={sonuc} yedek={[]} />

      <YorumKapanisi sonuc={sonuc} yedek="" />

      <Panel className="p-6">
        <h3 className="font-baslik text-xl font-semibold text-altin-300">Hesabın girdileri</h3>
        <p className="mt-2 text-sm text-[#a99ec6]">
          Gök konumları bu evrensel zaman anı için hesaplandı. Türkiye 2016’ya kadar yaz saati
          uyguladığı için yerel saat dönüşümü tarihe göre değişir.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Olcum etiket="Yerel doğum" deger={`${h.tarih}${h.saat ? ` ${h.saat}` : ''}`} />
          <Olcum etiket="Evrensel zaman" deger={h.utc.slice(0, 16).replace('T', ' ')} />
          <Olcum etiket="Güneş boylamı" deger={`${h.gunes.boylam.toFixed(2)}°`} />
          <Olcum etiket="Ay boylamı" deger={`${h.ay.boylam.toFixed(2)}°`} />
          {h.il && <Olcum etiket="Doğum yeri" deger={h.il.ad} />}
          {h.il && <Olcum etiket="Enlem" deger={`${h.il.enlem.toFixed(3)}°`} />}
          {h.il && <Olcum etiket="Boylam" deger={`${h.il.boylam.toFixed(3)}°`} />}
          {h.gogunOrtasi && (
            <Olcum etiket="Göğün ortası" deger={`${h.gogunOrtasi.burc.ad} ${DERECE(h.gogunOrtasi.derece)}`} />
          )}
        </dl>
      </Panel>
    </div>
  )
}
