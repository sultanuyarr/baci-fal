import type { NextConfig } from 'next'

/**
 * Site tamamen statik dosya olarak dışa aktarılır ve GitHub Pages'ten sunulur.
 * Sunucu yok: kahve falı, tarot ve doğum haritası hesaplarının tamamı
 * kullanıcının tarayıcısında çalışır. Yüklenen fotoğraf cihazdan hiç çıkmaz.
 *
 * GitHub Pages proje sayfaları alt dizinde yayınlandığı için (…/baci-fal/)
 * basePath gerekir. Yerelde çalışırken bu ön ek istenmez, bu yüzden yalnız
 * üretim derlemesinde uygulanır.
 */
const uretim = process.env.NODE_ENV === 'production'
const altYol = process.env.NEXT_PUBLIC_ALT_YOL ?? (uretim ? '/baci-fal' : '')

const nextConfig: NextConfig = {
  output: 'export',
  basePath: altYol,
  // Pages'te /yol/ adresleri /yol/index.html dosyasına düşer.
  trailingSlash: true,
  // Görsel eniyileme sunucu ister; statik dışa aktarımda kapalı olmalı.
  images: { unoptimized: true },
  // Statik dışa aktarımda next/image, basePath ön ekini kendiliğinden
  // uygulamıyor. Bu yüzden alt yolu istemciye de aktarıp public/ altındaki
  // dosyalara verdiğimiz adresleri elle önekliyoruz (bkz. lib/altyol.ts).
  env: { NEXT_PUBLIC_ALT_YOL: altYol },
}

export default nextConfig
