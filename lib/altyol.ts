/**
 * Sitenin yayınlandığı alt yol.
 *
 * GitHub Pages proje sayfaları "…/baci-fal/" gibi bir alt dizinde yayınlanır.
 * Next.js sayfa bağlantılarını kendisi önekler, ama statik dışa aktarımda
 * public/ altındaki dosyalara verdiğimiz adresleri öneklemez. Bu yüzden o
 * adresleri `varlik()` üzerinden geçiriyoruz.
 */
export const ALT_YOL = process.env.NEXT_PUBLIC_ALT_YOL ?? ''

/** public/ altındaki bir dosyanın yayın adresini verir. */
export function varlik(yol: string): string {
  return `${ALT_YOL}${yol.startsWith('/') ? yol : `/${yol}`}`
}
