import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const baslik = Cormorant_Garamond({
  variable: '--font-baslik',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
})

const govde = Inter({
  variable: '--font-govde',
  subsets: ['latin', 'latin-ext'],
})

/** Yayın adresi — paylaşım görsellerinin mutlak adrese çözülmesi için gerekir. */
const SITE_ADRESI = process.env.NEXT_PUBLIC_SITE_ADRESI ?? 'https://sultanuyarr.github.io/baci-fal'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ADRESI),
  title: {
    default: 'Bacı Fal — kahve falı, tarot ve doğum haritası',
    template: '%s',
  },
  description:
    'Fincanının fotoğrafını yükle, gerçek görüntü analiziyle okunsun. 78 kartlık tarot destesi ve doğum anındaki gerçek gökyüzü hesabıyla doğum haritası.',
  openGraph: {
    title: 'Bacı Fal — kahve falı, tarot ve doğum haritası',
    description:
      'Fincanın gerçekten ölçülüyor, burcun gerçek gök konumundan hesaplanıyor. Kahve falı, tarot ve doğum haritası.',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

const BAGLANTILAR = [
  { yol: '/kahve', ad: 'Kahve Falı', simge: '☕' },
  { yol: '/tarot', ad: 'Tarot', simge: '🔮' },
  { yol: '/dogum', ad: 'Doğum Haritası', simge: '✨' },
  { yol: '/nasil', ad: 'Nasıl Çalışıyor', simge: '📐' },
]

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="tr" className={`${baslik.variable} ${govde.variable} h-full antialiased`}>
      <body className="yildizli flex min-h-full flex-col">
        <header className="relative z-10 border-b border-altin-400/12 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="text-2xl transition-transform group-hover:rotate-12">🌙</span>
              <span className="font-baslik text-2xl font-semibold tracking-wide text-altin-300">
                Bacı Fal
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:ml-auto">
              {BAGLANTILAR.map((b) => (
                <Link
                  key={b.yol}
                  href={b.yol}
                  className="text-[#cfc4e8] transition-colors hover:text-altin-300"
                >
                  <span aria-hidden className="mr-1.5">{b.simge}</span>
                  {b.ad}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main className="relative z-10 flex-1">{children}</main>

        <footer className="relative z-10 border-t border-altin-400/12 px-4 py-8 text-center text-sm text-[#9b90b8] sm:px-6">
          <p className="mx-auto max-w-2xl">
            Bacı Fal eğlence amaçlıdır. Hesaplar gerçek ama kararların senin:
            sağlık, hukuk ve para konularında lütfen bir uzmana danış.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs">
            Her şey tarayıcında hesaplanır — fotoğrafın ve bilgilerin hiçbir yere gönderilmez.
          </p>
          <p className="mt-3">
            <Link href="/nasil" className="text-altin-400/80 underline-offset-4 hover:underline">
              Verilerin ve yöntemin kaynakları
            </Link>
          </p>
        </footer>
      </body>
    </html>
  )
}
