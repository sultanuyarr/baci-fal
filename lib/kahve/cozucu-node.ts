/**
 * Node tarafı görüntü çözücü — testler ve görsel denetim betiği için.
 *
 * Uygulamanın kendisi bu dosyayı kullanmaz; site tamamen tarayıcıda çalışır.
 * Amacı, analiz motorunu gerçek fotoğraf dosyalarıyla sınayabilmek.
 */
import sharp from 'sharp'
import { fincaniAnalizEt, type FincanAnalizi } from './goruntu.ts'

/** Görüntü dosyasını ham RGBA'ya çevirip analiz eder. */
export async function tamponuAnalizEt(girdi: Buffer): Promise<FincanAnalizi> {
  const { rgba, genislik, yukseklik } = await pikselleriCikar(girdi)
  return fincaniAnalizEt(rgba, genislik, yukseklik)
}

/** Tarayıcıdaki çözücüyle aynı ön işlemi yapar: EXIF yönü + RGBA'ya çevirme. */
export async function pikselleriCikar(girdi: Buffer) {
  const { data, info } = await sharp(girdi)
    .rotate() // EXIF yönünü uygula
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return {
    rgba: new Uint8Array(data.buffer, data.byteOffset, data.length),
    genislik: info.width,
    yukseklik: info.height,
  }
}
