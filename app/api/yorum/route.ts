/**
 * Yapay zekâ yorumunu üreten sunucu ucu.
 *
 * Gemini anahtarı yalnızca burada, sunucu ortam değişkeninde durur; istemciye
 * hiç gitmez. İstemci sadece tarayıcıda hesaplanmış sayıları gönderir —
 * fincan fotoğrafı buraya gelmez.
 *
 * Ücretsiz katman günlük istek sayısıyla sınırlı olduğu için iki koruma var:
 * kaba bir hız sınırı ve Google 429 dönerse istemciye "kota" kodu. İki
 * durumda da istemci, tarayıcıda hesaplanmış okumayı göstermeye devam eder.
 */
import { NextResponse } from 'next/server'
import { istemKur, SISTEM_TALIMATI } from '@/lib/ai/istem'
import type { AiGirdi, AiHataKodu, AiYanit, AiYorum } from '@/lib/ai/tipler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'
const UC = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

/** Modelin serbest metin yerine doğrudan bu yapıyı döndürmesini istiyoruz. */
const YANIT_SEMASI = {
  type: 'object',
  properties: {
    ozet: { type: 'string' },
    bolumler: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: {
        type: 'object',
        properties: { baslik: { type: 'string' }, metin: { type: 'string' } },
        required: ['baslik', 'metin'],
      },
    },
    kapanis: { type: 'string' },
  },
  required: ['ozet', 'bolumler', 'kapanis'],
}

const ZAMAN_ASIMI_MS = 45_000

/**
 * Kaba hız sınırı. Sunucusuz ortamda her örnek kendi belleğini tuttuğu için
 * bu kesin bir sınır değil, kötüye kullanımı yavaşlatan bir frendir; asıl
 * koruma Google'ın kendi kotası ve aşağıdaki 429 yakalaması.
 */
const PENCERE_MS = 60_000
const PENCERE_BASINA = 6
const gecmis = new Map<string, number[]>()

function hizliMi(kimlik: string): boolean {
  const simdi = Date.now()
  const damgalar = (gecmis.get(kimlik) ?? []).filter((t) => simdi - t < PENCERE_MS)
  damgalar.push(simdi)
  gecmis.set(kimlik, damgalar)

  // Bellek sızdırmasın: ara sıra eskimiş kayıtları at.
  if (gecmis.size > 500) {
    for (const [k, v] of gecmis) {
      if (v.every((t) => simdi - t >= PENCERE_MS)) gecmis.delete(k)
    }
  }
  return damgalar.length > PENCERE_BASINA
}

function hata(kod: AiHataKodu, durum: number, mesaj: string) {
  return NextResponse.json<AiYanit>({ kod, hata: mesaj }, { status: durum })
}

/** Gövdenin beklediğimiz üç fal türünden biri olduğunu doğrular. */
function girdiGecerliMi(g: unknown): g is AiGirdi {
  if (typeof g !== 'object' || g === null) return false
  const tur = (g as { tur?: unknown }).tur
  return tur === 'kahve' || tur === 'tarot' || tur === 'dogum'
}

function yorumGecerliMi(y: unknown): y is AiYorum {
  if (typeof y !== 'object' || y === null) return false
  const a = y as AiYorum
  return (
    typeof a.ozet === 'string' &&
    a.ozet.length > 40 &&
    Array.isArray(a.bolumler) &&
    a.bolumler.length > 0 &&
    a.bolumler.every(
      (b) => typeof b?.baslik === 'string' && typeof b?.metin === 'string' && b.metin.length > 40,
    ) &&
    typeof a.kapanis === 'string'
  )
}

export async function POST(istek: Request) {
  const anahtar = process.env.GEMINI_API_KEY
  if (!anahtar) return hata('anahtar-yok', 503, 'GEMINI_API_KEY tanımlı değil.')

  const kimlik =
    istek.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    istek.headers.get('x-real-ip') ||
    'bilinmeyen'
  if (hizliMi(kimlik)) return hata('cok-istek', 429, 'Dakikada en fazla 6 yorum.')

  let girdi: unknown
  try {
    girdi = await istek.json()
  } catch {
    return hata('bicim', 400, 'Gövde okunamadı.')
  }
  if (!girdiGecerliMi(girdi)) return hata('bicim', 400, 'Tanınmayan fal türü.')

  const durdurucu = new AbortController()
  const sayac = setTimeout(() => durdurucu.abort(), ZAMAN_ASIMI_MS)

  try {
    const yanit = await fetch(UC, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': anahtar },
      signal: durdurucu.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEM_TALIMATI }] },
        contents: [{ role: 'user', parts: [{ text: istemKur(girdi) }] }],
        generationConfig: {
          temperature: 1,
          responseMimeType: 'application/json',
          responseSchema: YANIT_SEMASI,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (yanit.status === 429) return hata('kota', 429, 'Günlük ücretsiz kota doldu.')
    if (!yanit.ok) {
      const govde = await yanit.text()
      console.error('Gemini hatası', yanit.status, govde.slice(0, 500))
      return hata('sunucu', 502, `Model ${yanit.status} döndü.`)
    }

    const veri = await yanit.json()
    const metin = veri?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof metin !== 'string') return hata('bicim', 502, 'Model boş yanıt verdi.')

    const yorum = JSON.parse(metin)
    if (!yorumGecerliMi(yorum)) return hata('bicim', 502, 'Model beklenen yapıyı vermedi.')

    return NextResponse.json<AiYanit>({ yorum })
  } catch (sorun) {
    if (sorun instanceof Error && sorun.name === 'AbortError') {
      return hata('zaman-asimi', 504, 'Model vaktinde yanıt vermedi.')
    }
    console.error('Yorum üretilemedi', sorun)
    return hata('sunucu', 502, 'Yorum üretilemedi.')
  } finally {
    clearTimeout(sayac)
  }
}
