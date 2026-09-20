/** Kahve falı ucu: yüklenen fincan fotoğrafını analiz eder. */
import { NextResponse } from 'next/server'
import { fincaniAnalizEt } from '@/lib/kahve/goruntu'
import { faliYorumla } from '@/lib/kahve/yorum'

// sharp yalnızca Node ortamında çalışır.
export const runtime = 'nodejs'

const EN_BUYUK_BOYUT = 12 * 1024 * 1024 // 12 MB
const KABUL_EDILEN = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(istek: Request) {
  let form: FormData
  try {
    form = await istek.formData()
  } catch {
    return NextResponse.json({ hata: 'Fotoğraf okunamadı.' }, { status: 400 })
  }

  const dosya = form.get('fotograf')
  if (!(dosya instanceof File)) {
    return NextResponse.json({ hata: 'Fincan fotoğrafı gerekli.' }, { status: 400 })
  }
  if (dosya.size === 0) {
    return NextResponse.json({ hata: 'Dosya boş görünüyor.' }, { status: 400 })
  }
  if (dosya.size > EN_BUYUK_BOYUT) {
    return NextResponse.json(
      { hata: 'Fotoğraf 12 MB’den küçük olmalı. Telefonundan biraz küçülterek dene.' },
      { status: 413 },
    )
  }
  if (dosya.type && !KABUL_EDILEN.includes(dosya.type)) {
    return NextResponse.json(
      { hata: 'Yalnızca JPEG, PNG, WebP veya HEIC fotoğraflar okunabiliyor.' },
      { status: 415 },
    )
  }

  try {
    const veri = Buffer.from(await dosya.arrayBuffer())
    const analiz = await fincaniAnalizEt(veri)
    const fal = faliYorumla(analiz)
    return NextResponse.json({ fal })
  } catch (hata) {
    console.error('Kahve falı analizi başarısız:', hata)
    return NextResponse.json(
      { hata: 'Fotoğraf çözümlenemedi. Fincanın içi net görünen başka bir kare dene.' },
      { status: 422 },
    )
  }
}
