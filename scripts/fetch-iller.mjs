/**
 * Türkiye'nin 81 ilinin gerçek koordinatlarını Wikidata'dan çeker.
 * Yükselen burç hesabı için enlem/boylam gerekir.
 *
 * Kullanım: node scripts/fetch-iller.mjs
 */
import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Resmî plaka kodu → il adı listesi. Wikidata'nın P395 alanı bazı illerde
 * hatalı (Konya 53, Uşak 62 görünüyor), bu yüzden plakalar buradan alınır;
 * Wikidata yalnızca koordinat kaynağı olarak kullanılır.
 */
const PLAKALAR = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
]

/** Wikidata etiketleriyle resmî adları eşlemek için bilinen karşılıklar. */
const TAKMA_ADLAR = {
  'Hakkari': 'Hakkâri',
  'İçel': 'Mersin',
  'Afyon': 'Afyonkarahisar',
  'Maraş': 'Kahramanmaraş',
  'Urfa': 'Şanlıurfa',
  'Hakkâri Province': 'Hakkâri',
}

const anahtarla = (ad) => ad.trim().toLocaleLowerCase('tr-TR')

const SORGU = `
SELECT ?ilLabel ?plaka ?lat ?lon WHERE {
  ?il wdt:P31 wd:Q48336 .
  ?il wdt:P625 ?coord .
  OPTIONAL { ?il wdt:P395 ?plaka }
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en" }
}`

const url = new URL('https://query.wikidata.org/sparql')
url.searchParams.set('query', SORGU)
url.searchParams.set('format', 'json')

const res = await fetch(url, { headers: { 'user-agent': 'BaciFal/1.0 (il koordinatlari)' } })
if (!res.ok) throw new Error(`Wikidata ${res.status}`)
const json = await res.json()

// Wikidata etiketini resmî ada göre indeksle
const koordinatlar = new Map()
for (const b of json.results.bindings) {
  const ham = b.ilLabel.value.replace(/ (Province|ili)$/i, '')
  const ad = TAKMA_ADLAR[ham] ?? ham
  koordinatlar.set(anahtarla(ad), {
    enlem: Number(Number(b.lat.value).toFixed(4)),
    boylam: Number(Number(b.lon.value).toFixed(4)),
  })
}

const iller = PLAKALAR.map((ad, i) => {
  const koordinat = koordinatlar.get(anahtarla(ad))
  if (!koordinat) throw new Error(`Wikidata'da koordinatı bulunamadı: ${ad}`)
  return { ad, plaka: i + 1, ...koordinat }
})

if (iller.length !== 81) throw new Error(`81 il bekleniyordu, ${iller.length} geldi`)
if (new Set(iller.map((i) => i.plaka)).size !== 81) throw new Error('Plaka kodları tekil değil')
for (const il of iller) {
  // Türkiye kabaca 36–42 K, 26–45 D arasındadır
  if (il.enlem < 35.5 || il.enlem > 42.5) throw new Error(`Şüpheli enlem: ${il.ad} ${il.enlem}`)
  if (il.boylam < 25.5 || il.boylam > 45.5) throw new Error(`Şüpheli boylam: ${il.ad} ${il.boylam}`)
}

await writeFile(
  join(ROOT, 'data', 'iller.json'),
  JSON.stringify(
    {
      kaynak: 'Koordinatlar: Wikidata (Q48336, P625). Plaka kodları: resmî liste.',
      cekilmeTarihi: new Date().toISOString().slice(0, 10),
      saatDilimi: 'Europe/Istanbul',
      iller,
    },
    null,
    2,
  ) + '\n',
)
console.log(`✓ ${iller.length} il yazıldı → data/iller.json`)
