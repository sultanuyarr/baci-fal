/**
 * Tarot verisini ve kamu malı kart görsellerini indirir.
 *
 * Kaynaklar:
 *  - Anlamlar: dariusk/corpora  -> data/divination/tarot_interpretations.json
 *    (Mark McElroy, "A Guide to Tarot Card Meanings")
 *  - Görseller: Wikimedia Commons, Rider-Waite-Smith destesi (1909, kamu malı)
 *
 * Kullanim: node scripts/fetch-tarot.mjs
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
const IMGDIR = join(ROOT, 'public', 'tarot')

const INTERP_URL =
  'https://raw.githubusercontent.com/dariusk/corpora/master/data/divination/tarot_interpretations.json'

const MAJOR_FILES = [
  'RWS Tarot 00 Fool.jpg',
  'RWS Tarot 01 Magician.jpg',
  'RWS Tarot 02 High Priestess.jpg',
  'RWS Tarot 03 Empress.jpg',
  'RWS Tarot 04 Emperor.jpg',
  'RWS Tarot 05 Hierophant.jpg',
  'RWS Tarot 06 Lovers.jpg',
  'RWS Tarot 07 Chariot.jpg',
  'RWS Tarot 08 Strength.jpg',
  'RWS Tarot 09 Hermit.jpg',
  'RWS Tarot 10 Wheel of Fortune.jpg',
  'RWS Tarot 11 Justice.jpg',
  'RWS Tarot 12 Hanged Man.jpg',
  'RWS Tarot 13 Death.jpg',
  'RWS Tarot 14 Temperance.jpg',
  'RWS Tarot 15 Devil.jpg',
  'RWS Tarot 16 Tower.jpg',
  'RWS Tarot 17 Star.jpg',
  'RWS Tarot 18 Moon.jpg',
  'RWS Tarot 19 Sun.jpg',
  'RWS Tarot 20 Judgement.jpg',
  'RWS Tarot 21 World.jpg',
]

const SUIT_PREFIX = { wands: 'Wands', cups: 'Cups', swords: 'Swords', coins: 'Pents' }
const RANK_NUM = { page: 11, knight: 12, queen: 13, king: 14 }

function rankNumber(rank) {
  return typeof rank === 'number' ? rank : RANK_NUM[rank]
}

/** Karti kimlige ve Commons dosya adina cevirir. */
function describe(card) {
  if (card.suit === 'major') {
    const n = card.rank
    return { id: `major-${String(n).padStart(2, '0')}`, file: MAJOR_FILES[n] }
  }
  const n = rankNumber(card.rank)
  return {
    id: `${card.suit}-${String(n).padStart(2, '0')}`,
    file: `${SUIT_PREFIX[card.suit]}${String(n).padStart(2, '0')}.jpg`,
  }
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/** Commons imageinfo API'sinden kucultulmus gorsel adreslerini toplu ceker. */
async function thumbUrls(files, width) {
  const out = new Map()
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40)
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('format', 'json')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|extmetadata')
    url.searchParams.set('iiurlwidth', String(width))
    url.searchParams.set('titles', chunk.map((f) => `File:${f}`).join('|'))
    const res = await fetch(url, { headers: { 'user-agent': 'BaciFal/1.0 (tarot deck fetch)' } })
    if (!res.ok) throw new Error(`Commons API ${res.status}`)
    const json = await res.json()
    for (const page of Object.values(json.query.pages)) {
      if (page.missing !== undefined) throw new Error(`Commons'ta yok: ${page.title}`)
      out.set(page.title.replace(/^File:/, ''), page.imageinfo[0].thumburl)
    }
  }
  return out
}

async function main() {
  await mkdir(DATA, { recursive: true })
  await mkdir(IMGDIR, { recursive: true })

  const interpPath = join(DATA, 'tarot_interpretations.json')
  let interp
  if (await exists(interpPath)) {
    interp = JSON.parse(await readFile(interpPath, 'utf8'))
    console.log('· anlam verisi zaten var, atlaniyor')
  } else {
    const res = await fetch(INTERP_URL)
    if (!res.ok) throw new Error(`corpora ${res.status}`)
    interp = await res.json()
    await writeFile(interpPath, JSON.stringify(interp, null, 2))
    console.log(`✓ anlam verisi indirildi (${interp.tarot_interpretations.length} kart)`)
  }

  const cards = interp.tarot_interpretations
  if (cards.length !== 78) throw new Error(`78 kart bekleniyordu, ${cards.length} geldi`)

  const described = cards.map((c) => ({ ...describe(c), name: c.name, suit: c.suit, rank: c.rank }))
  const missing = described.filter((d) => !d.file)
  if (missing.length) throw new Error(`Dosya adi cozulemedi: ${JSON.stringify(missing)}`)

  const needed = []
  for (const d of described) {
    if (!(await exists(join(IMGDIR, `${d.id}.jpg`)))) needed.push(d)
  }

  if (needed.length) {
    console.log(`· ${needed.length} gorsel indirilecek…`)
    const urls = await thumbUrls(needed.map((d) => d.file), 420)
    for (const d of needed) {
      const url = urls.get(d.file)
      if (!url) throw new Error(`Adres bulunamadi: ${d.file}`)
      const res = await fetch(url, { headers: { 'user-agent': 'BaciFal/1.0 (tarot deck fetch)' } })
      if (!res.ok) throw new Error(`${d.file}: HTTP ${res.status}`)
      await writeFile(join(IMGDIR, `${d.id}.jpg`), Buffer.from(await res.arrayBuffer()))
      process.stdout.write('.')
    }
    console.log(`\n✓ ${needed.length} kart gorseli indirildi`)
  } else {
    console.log('· tum kart gorselleri zaten mevcut')
  }

  // Kimlik -> kaynak eslemesini kaydet, uygulama bunu kullanir.
  await writeFile(
    join(DATA, 'tarot_images.json'),
    JSON.stringify(
      {
        source: 'Wikimedia Commons — Rider-Waite-Smith Tarot (1909), kamu mali',
        width: 420,
        cards: Object.fromEntries(described.map((d) => [d.id, { name: d.name, commonsFile: d.file }])),
      },
      null,
      2,
    ),
  )
  console.log('✓ data/tarot_images.json yazildi')
}

main().catch((err) => {
  console.error('HATA:', err.message)
  process.exit(1)
})
