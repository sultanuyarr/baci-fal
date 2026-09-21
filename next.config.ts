import type { NextConfig } from 'next'

/**
 * Site Vercel'de yayınlanır.
 *
 * Kahve falı, tarot ve doğum haritası hesaplarının tamamı hâlâ kullanıcının
 * tarayıcısında çalışır — yüklenen fotoğraf cihazdan hiç çıkmaz. Sunucudan
 * geçen tek şey yapay zekâ yorumudur (app/api/yorum): tarayıcıda hesaplanmış
 * sayılar oraya gidip Gemini'ye iletilir. Gemini anahtarı yalnızca sunucu
 * ortam değişkeninde durur, istemciye hiç gönderilmez.
 *
 * Not: Site eskiden GitHub Pages'e statik dışa aktarılıyordu. Sunucu ucu
 * eklendiği için statik dışa aktarım (`output: 'export'`) artık mümkün değil;
 * lib/altyol.ts'teki alt yol desteği ise duruyor, alt dizinde yayınlamak
 * gerekirse NEXT_PUBLIC_ALT_YOL yeterli.
 */
const altYol = process.env.NEXT_PUBLIC_ALT_YOL ?? ''

const nextConfig: NextConfig = {
  ...(altYol ? { basePath: altYol } : {}),
  // Adresler eskiden beri sonda bölü çizgisiyle; bağlantılar bozulmasın.
  trailingSlash: true,
  env: { NEXT_PUBLIC_ALT_YOL: altYol },
}

export default nextConfig
