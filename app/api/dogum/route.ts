/** Doğum haritası ucu: isim ve doğum bilgisinden harita çıkarır. */
import { NextResponse } from 'next/server'
import { haritaCikar, ilBul } from '@/lib/dogum/harita'

export const runtime = 'nodejs'

const TARIH_KALIBI = /^\d{4}-\d{2}-\d{2}$/
const SAAT_KALIBI = /^\d{2}:\d{2}$/

export async function POST(istek: Request) {
  let govde: Record<string, unknown>
  try {
    govde = await istek.json()
  } catch {
    return NextResponse.json({ hata: 'İstek okunamadı.' }, { status: 400 })
  }

  const isim = String(govde.isim ?? '').trim().slice(0, 80)
  const tarih = String(govde.tarih ?? '').trim()
  const saatHam = String(govde.saat ?? '').trim()
  const plakaHam = Number(govde.ilPlaka)

  if (isim.length < 2) {
    return NextResponse.json({ hata: 'Adını ve soyadını yazar mısın?' }, { status: 400 })
  }
  if (!TARIH_KALIBI.test(tarih)) {
    return NextResponse.json({ hata: 'Doğum tarihi gerekli.' }, { status: 400 })
  }

  const yil = Number(tarih.slice(0, 4))
  if (yil < 1900 || yil > new Date().getFullYear()) {
    return NextResponse.json(
      { hata: 'Doğum yılı 1900 ile bugün arasında olmalı.' },
      { status: 400 },
    )
  }
  const zaman = new Date(`${tarih}T12:00:00Z`)
  if (Number.isNaN(zaman.getTime()) || zaman.toISOString().slice(0, 10) !== tarih) {
    return NextResponse.json({ hata: 'Böyle bir tarih yok.' }, { status: 400 })
  }

  const saat = SAAT_KALIBI.test(saatHam) ? saatHam : undefined
  const ilPlaka = Number.isInteger(plakaHam) && ilBul(plakaHam) ? plakaHam : undefined

  try {
    const harita = haritaCikar({ isim, tarih, saat, ilPlaka })
    return NextResponse.json({ harita })
  } catch (hata) {
    console.error('Doğum haritası çıkarılamadı:', hata)
    return NextResponse.json({ hata: 'Harita hesaplanamadı.' }, { status: 500 })
  }
}
