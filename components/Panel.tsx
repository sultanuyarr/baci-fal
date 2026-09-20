import type { ReactNode } from 'react'

/** Sitedeki ortak cam panel görünümü. */
export function Panel({
  children,
  className = '',
  vurgulu = false,
}: {
  children: ReactNode
  className?: string
  vurgulu?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm ${
        vurgulu
          ? 'border-altin-400/35 bg-gece-700/60 shadow-[0_0_40px_-12px_rgba(233,196,104,0.25)]'
          : 'border-altin-400/15 bg-gece-800/50'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Bölüm başlığı: küçük üst etiket + büyük serif başlık.
 * Sayfada tek bir h1 bulunması için sayfa başlıkları dışında `seviye={2}` verilir.
 */
export function Baslik({
  etiket,
  baslik,
  aciklama,
  ortala = false,
  seviye = 1,
}: {
  etiket?: string
  baslik: string
  aciklama?: ReactNode
  ortala?: boolean
  seviye?: 1 | 2
}) {
  const BaslikEtiketi = seviye === 1 ? 'h1' : 'h2'
  return (
    <div className={ortala ? 'text-center' : ''}>
      {etiket && (
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-altin-500">
          {etiket}
        </p>
      )}
      <BaslikEtiketi className="font-baslik text-3xl font-semibold text-altin-300 sm:text-4xl">
        {baslik}
      </BaslikEtiketi>
      {aciklama && (
        <div className={`mt-3 text-[#c3b8dd] ${ortala ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
          {aciklama}
        </div>
      )}
    </div>
  )
}

/** İşlem düğmesi. */
export function Dugme({
  children,
  ...ozellikler
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', disabled, ...kalan } = ozellikler
  return (
    <button
      {...kalan}
      disabled={disabled}
      className={`rounded-xl bg-gradient-to-b from-altin-400 to-altin-500 px-6 py-3 font-medium text-gece-900 transition hover:from-altin-300 hover:to-altin-400 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:from-altin-400 disabled:hover:to-altin-500 ${className}`}
    >
      {children}
    </button>
  )
}

/** Hata kutusu. */
export function Hata({ mesaj }: { mesaj: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-gul-500/40 bg-gul-500/10 px-4 py-3 text-sm text-gul-400"
    >
      {mesaj}
    </p>
  )
}

/** Sayısal bir ölçümü gösteren küçük kutu. */
export function Olcum({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-lg border border-altin-400/12 bg-gece-900/50 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-[#8f84ab]">{etiket}</dt>
      <dd className="mt-0.5 font-baslik text-lg text-altin-300">{deger}</dd>
    </div>
  )
}
