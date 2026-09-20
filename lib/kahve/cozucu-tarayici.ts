/**
 * Tarayıcı tarafı görüntü çözücü.
 *
 * Fotoğrafı Canvas ile ham piksellere çevirir ve analiz motoruna verir.
 * Fotoğraf hiçbir zaman ağa çıkmaz; bütün hesap kullanıcının cihazında yapılır.
 */
import { fincaniAnalizEt, type FincanAnalizi } from './goruntu'

/** Çok büyük fotoğrafları çözmeden önce makul bir sınıra indirir. */
const EN_BUYUK_KENAR = 2000

/**
 * Dosyayı çözüp analiz eder.
 * @throws Görüntü çözülemezse anlaşılır bir hata mesajıyla
 */
export async function dosyayiAnalizEt(dosya: Blob): Promise<FincanAnalizi> {
  const { rgba, genislik, yukseklik } = await pikselleriCikar(dosya)
  return fincaniAnalizEt(rgba, genislik, yukseklik)
}

async function pikselleriCikar(dosya: Blob) {
  let resim: ImageBitmap
  try {
    // 'from-image' EXIF yön bilgisini uygular; telefonla çekilen dikey
    // fotoğrafların yan yatmasını engeller.
    resim = await createImageBitmap(dosya, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Bu dosya bir fotoğraf olarak açılamadı.')
  }

  try {
    // Çok büyük fotoğrafları önce ucuzca küçült: analiz zaten 460 pikselde
    // çalışıyor, 12 megapiksellik bir kareyi baştan sona gezmenin anlamı yok.
    const oran = Math.min(1, EN_BUYUK_KENAR / Math.max(resim.width, resim.height))
    const genislik = Math.max(1, Math.round(resim.width * oran))
    const yukseklik = Math.max(1, Math.round(resim.height * oran))

    const tuval = tuvalAc(genislik, yukseklik)
    const baglam = tuval.getContext('2d', { willReadFrequently: true })
    if (!baglam) throw new Error('Tarayıcı 2D çizim bağlamı vermedi.')

    baglam.drawImage(resim, 0, 0, genislik, yukseklik)
    const veri = baglam.getImageData(0, 0, genislik, yukseklik)
    return { rgba: veri.data, genislik, yukseklik }
  } finally {
    resim.close()
  }
}

function tuvalAc(genislik: number, yukseklik: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(genislik, yukseklik)
  const tuval = document.createElement('canvas')
  tuval.width = genislik
  tuval.height = yukseklik
  return tuval
}
