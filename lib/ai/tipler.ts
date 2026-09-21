/**
 * Yapay zekâ yorum katmanının istemci ile sunucu arasında paylaşılan tipleri.
 *
 * Sunucuya gönderilen şey fotoğraf ya da ham girdi değil, tarayıcıda zaten
 * hesaplanmış olan sayılardır: telve oranları, çıkan semboller, kart
 * bileşimi, gök konumları ve yüzdeli ihtimaller. Model bunları yorumlar;
 * kendi başına bir şey hesaplamaz, uydurması da beklenmez.
 */
import type { Ihtimal } from '@/lib/ihtimal'

export type AiBolum = { baslik: string; metin: string }

export type AiYorum = {
  ozet: string
  bolumler: AiBolum[]
  kapanis: string
}

/** Kahve falı için modele verilen özet — fotoğraf gönderilmez. */
export type KahveGirdisi = {
  tur: 'kahve'
  olcumler: {
    doluluk: number
    simetri: number
    hareket: number
    aciklik: number
    lekeSayisi: number
    bolgeler: { kenar: number; orta: number; dip: number }
    yarimlar: { sol: number; sag: number }
  }
  semboller: { ad: string; anlam: string; bolge: string; yon: string; guven: number }[]
  ihtimaller: Ihtimal[]
}

export type TarotGirdisi = {
  tur: 'tarot'
  acilim: string
  soru: string | null
  kartlar: {
    pozisyon: string
    pozisyonAciklamasi: string
    kart: string
    takim: string
    ters: boolean
    anahtar: string[]
    anlam: string
  }[]
  cevap: { deger: string; guc: number } | null
  ihtimaller: Ihtimal[]
}

export type DogumGirdisi = {
  tur: 'dogum'
  isim: string
  gunes: { burc: string; derece: number; element: string; nitelik: string }
  ay: { burc: string; derece: number; element: string; evre: string; aydinlanma: number }
  yukselen: { burc: string; derece: number; element: string } | null
  denge: { elementler: Record<string, number>; baskinElement: string; baskinNitelik: string }
  numeroloji: {
    yasamYolu: { sayi: number; baslik: string }
    ifade: number
    ruhArzusu: number
    kisilik: number
    kisiselYil: { sayi: number; yil: number }
  }
  cin: { ad: string; hayvan: string; element: string }
  ihtimaller: Ihtimal[]
}

export type AiGirdi = KahveGirdisi | TarotGirdisi | DogumGirdisi

export type AiHataKodu =
  | 'anahtar-yok'
  | 'kota'
  | 'zaman-asimi'
  | 'bicim'
  | 'cok-istek'
  | 'sunucu'

export type AiYanit = { yorum: AiYorum } | { hata: string; kod: AiHataKodu }

/** Hata kodunun kullanıcıya gösterilecek karşılığı. */
export const AI_HATA_METNI: Record<AiHataKodu, string> = {
  'anahtar-yok': 'Yapay zekâ yorumu bu kurulumda açık değil; aşağıda hesaplanmış okuma var.',
  kota: 'Bacı bugünlük çok fal baktı, günlük kotası doldu. Aşağıdaki hesaplanmış okuma yerinde duruyor.',
  'zaman-asimi': 'Yapay zekâ yorumu vaktinde yetişmedi. Aşağıdaki hesaplanmış okuma yerinde duruyor.',
  bicim: 'Yapay zekâ yorumu okunabilir gelmedi. Aşağıdaki hesaplanmış okuma yerinde duruyor.',
  'cok-istek': 'Arka arkaya çok istek geldi, biraz bekle. Aşağıdaki hesaplanmış okuma yerinde duruyor.',
  sunucu: 'Yapay zekâ yorumuna şu an ulaşılamadı. Aşağıdaki hesaplanmış okuma yerinde duruyor.',
}
