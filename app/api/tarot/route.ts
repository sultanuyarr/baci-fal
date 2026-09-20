/** Tarot ucu: istenen açılımı çeker. */
import { NextResponse } from 'next/server'
import { ACILIMLAR, acilimYap, type AcilimTuru } from '@/lib/tarot/acilim'

export const runtime = 'nodejs'

export async function POST(istek: Request) {
  let govde: Record<string, unknown>
  try {
    govde = await istek.json()
  } catch {
    return NextResponse.json({ hata: 'İstek okunamadı.' }, { status: 400 })
  }

  const tur = String(govde.tur ?? '') as AcilimTuru
  if (!(tur in ACILIMLAR)) {
    return NextResponse.json({ hata: 'Geçersiz açılım türü.' }, { status: 400 })
  }

  const soru = typeof govde.soru === 'string' ? govde.soru.slice(0, 300) : undefined
  const isim = typeof govde.isim === 'string' ? govde.isim.slice(0, 80) : undefined
  const dogumTarihi = typeof govde.dogumTarihi === 'string' ? govde.dogumTarihi.slice(0, 10) : undefined
  const turNo = Number.isFinite(Number(govde.turNo)) ? Number(govde.turNo) : 0

  if (tur === 'evet-hayir' && !soru?.trim()) {
    return NextResponse.json(
      { hata: 'Evet/Hayır açılımı için net bir soru yazman gerekiyor.' },
      { status: 400 },
    )
  }

  const acilim = acilimYap({ tur, isim, dogumTarihi, soru, tur_no: turNo })
  return NextResponse.json({ acilim })
}
