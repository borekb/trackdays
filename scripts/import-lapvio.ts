import { mkdir, rename, writeFile } from 'node:fs/promises'

const BASE_URL = 'https://www.lapvio.com'
const TARGET_COUNTRIES = ['CZ', 'SK', 'AT', 'DE', 'PL', 'HU'] as const
const OUTPUT_FILE = 'data/lapvio/trackdays.json'
const MAX_PAGES = 20
const REQUEST_DELAY_MS = 150

type JsonObject = Record<string, unknown>

type SchemaEvent = JsonObject & {
  name?: string
  url?: string
  startDate?: string
  endDate?: string
  eventStatus?: string
  eventAttendanceMode?: string
  image?: string | Array<string>
  organizer?: JsonObject
  location?: JsonObject
  offers?: JsonObject | Array<JsonObject>
}

type LapvioTrackday = {
  source: 'lapvio'
  listingCountryCode: string
  sourceUrl: string
  sourceSlug: string
  title: string
  dateStart: string
  dateEnd: string | null
  organizer: string
  organizerUrl: string | null
  circuit: string
  circuitUrl: string | null
  countryCode: string | null
  address: string | null
  priceFrom: number | null
  currency: string | null
  bookingUrl: string | null
  imageUrl: string | null
  status: string | null
  attendanceMode: string | null
}

async function main() {
  const eventUrls = await collectEventUrls()
  const trackdays: Array<LapvioTrackday> = []

  console.log(`Found ${eventUrls.length} event URLs`)

  for (const [index, eventRef] of eventUrls.entries()) {
    await delay(REQUEST_DELAY_MS)
    console.log(
      `[${index + 1}/${eventUrls.length}] ${eventRef.countryCode} ${eventRef.url}`,
    )
    trackdays.push(await importEvent(eventRef.url, eventRef.countryCode))
  }

  trackdays.sort((a, b) =>
    [a.dateStart, a.countryCode ?? a.listingCountryCode, a.circuit, a.organizer, a.sourceUrl]
      .join('\t')
      .localeCompare(
        [
          b.dateStart,
          b.countryCode ?? b.listingCountryCode,
          b.circuit,
          b.organizer,
          b.sourceUrl,
        ].join('\t'),
      ),
  )

  await writeTrackdayFile(OUTPUT_FILE, trackdays)

  for (const countryCode of TARGET_COUNTRIES) {
    const countryTrackdays = trackdays.filter(
      (event) => (event.countryCode ?? event.listingCountryCode) === countryCode,
    )
    await writeTrackdayFile(countryOutputFile(countryCode), countryTrackdays)
  }

  console.log(`Wrote ${trackdays.length} trackdays to ${OUTPUT_FILE}`)
}

async function collectEventUrls() {
  const eventUrls = new Map<string, { countryCode: string; url: string }>()

  for (const countryCode of TARGET_COUNTRIES) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const listingUrl = new URL('/cs/trackdays', BASE_URL)
      listingUrl.searchParams.set('country', countryCode)

      if (page > 1) {
        listingUrl.searchParams.set('page', String(page))
      }

      const html = await fetchText(listingUrl.href)
      const pageUrls = extractTrackdayUrls(html)
      const beforeSize = eventUrls.size

      for (const url of pageUrls) {
        eventUrls.set(url, { countryCode, url })
      }

      console.log(
        `${countryCode} listing page ${page}: ${pageUrls.length} links, ${
          eventUrls.size - beforeSize
        } new`,
      )

      if (!html.includes('Další akce')) {
        break
      }

      await delay(REQUEST_DELAY_MS)
    }
  }

  return Array.from(eventUrls.values()).sort((a, b) =>
    [a.countryCode, a.url].join('\t').localeCompare([b.countryCode, b.url].join('\t')),
  )
}

async function importEvent(
  sourceUrl: string,
  listingCountryCode: string,
): Promise<LapvioTrackday> {
  const html = await fetchText(sourceUrl)
  const event = extractSchemaEvent(html)
  const sourceSlug = new URL(sourceUrl).pathname.replace(/^\/cs\/trackdays\//, '')
  const offer = firstObject(event.offers)
  const location = objectValue(event.location)
  const address = objectValue(location?.address)
  const organizer = objectValue(event.organizer)

  return {
    source: 'lapvio',
    listingCountryCode,
    sourceUrl,
    sourceSlug,
    title: stringValue(event.name) ?? titleFromSlug(sourceSlug),
    dateStart: requiredString(event.startDate, sourceUrl, 'startDate'),
    dateEnd: stringValue(event.endDate),
    organizer: stringValue(organizer?.name) ?? organizerFromSlug(sourceSlug),
    organizerUrl: stringValue(organizer?.url),
    circuit: stringValue(location?.name) ?? circuitFromSlug(sourceSlug),
    circuitUrl: extractCircuitUrl(html),
    countryCode: stringValue(address?.addressCountry),
    address: formatAddress(address),
    priceFrom: numberValue(offer?.price),
    currency: stringValue(offer?.priceCurrency),
    bookingUrl: bookingUrl(stringValue(offer?.url), html),
    imageUrl: firstString(event.image),
    status: stringValue(event.eventStatus),
    attendanceMode: stringValue(event.eventAttendanceMode),
  }
}

async function writeTrackdayFile(filePath: string, trackdays: Array<LapvioTrackday>) {
  await mkdir('data/lapvio', { recursive: true })
  await writeFile(`${filePath}.tmp`, `${JSON.stringify(trackdays, null, 2)}\n`)
  await rename(`${filePath}.tmp`, filePath)
}

function countryOutputFile(countryCode: string) {
  return `data/lapvio/trackdays.${countryCode.toLowerCase()}.json`
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'cs,en;q=0.8',
      'user-agent': 'trackdays-importer/0.1 (+https://github.com/borekb/trackdays)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function extractTrackdayUrls(html: string) {
  const matches = html.matchAll(
    /\/cs\/trackdays\/[a-z0-9-]+\/20\d{2}-\d{2}-\d{2}-[^"'\\<\],]+/g,
  )
  const urls = new Set<string>()

  for (const match of matches) {
    urls.add(new URL(match[0], BASE_URL).href)
  }

  return Array.from(urls).sort()
}

function extractSchemaEvent(html: string): SchemaEvent {
  for (const object of extractJsonLdObjects(html)) {
    const event = findSchemaEvent(object)

    if (event) {
      return event
    }
  }

  throw new Error('Schema.org Event JSON-LD not found')
}

function extractJsonLdObjects(html: string) {
  const objects: Array<unknown> = []

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    objects.push(JSON.parse(decodeHtmlEntities(match[1].trim())))
  }

  for (const match of html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g)) {
    let flightChunk: unknown

    try {
      flightChunk = JSON.parse(match[1])
    } catch {
      continue
    }

    if (!Array.isArray(flightChunk)) {
      continue
    }

    for (const value of flightChunk) {
      if (typeof value !== 'string' || !value.includes('https://schema.org')) {
        continue
      }

      objects.push(...extractBalancedJsonObjects(value, '"@context":"https://schema.org"'))
    }
  }

  return objects
}

function extractBalancedJsonObjects(text: string, marker: string) {
  const objects: Array<unknown> = []
  let cursor = 0

  while (cursor < text.length) {
    const markerIndex = text.indexOf(marker, cursor)

    if (markerIndex === -1) {
      break
    }

    const start = text.lastIndexOf('{', markerIndex)
    const end = findBalancedObjectEnd(text, start)

    if (start !== -1 && end !== -1) {
      objects.push(JSON.parse(text.slice(start, end + 1)))
      cursor = end + 1
    } else {
      cursor = markerIndex + marker.length
    }
  }

  return objects
}

function findBalancedObjectEnd(text: string, start: number) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function findSchemaEvent(object: unknown): SchemaEvent | null {
  if (!isObject(object)) {
    return null
  }

  if (isSchemaType(object, 'Event')) {
    return object as SchemaEvent
  }

  const graph = object['@graph']

  if (Array.isArray(graph)) {
    for (const item of graph) {
      if (isObject(item) && isSchemaType(item, 'Event')) {
        return item as SchemaEvent
      }
    }
  }

  return null
}

function isSchemaType(object: JsonObject, typeName: string) {
  const type = object['@type']
  return Array.isArray(type) ? type.includes(typeName) : type === typeName
}

function extractCircuitUrl(html: string) {
  const match = html.match(/href\\?":\\?"(\/cs\/circuits\/[^"\\]+)\\?"/)
  return match ? new URL(match[1], BASE_URL).href : null
}

function extractBookingUrl(html: string) {
  const urls = new Set<string>()

  for (const match of html.matchAll(/href(?:\\?":\\?"|=["'])(https?:\/\/[^"'\\]+|mailto:[^"'\\]+)/g)) {
    urls.add(match[1].replaceAll('\\/', '/'))
  }

  return (
    Array.from(urls).find(
      (url) => !url.includes('lapvio.com') && !url.startsWith('mailto:'),
    ) ?? null
  )
}

function bookingUrl(offerUrl: string | null, html: string) {
  const externalUrl = extractBookingUrl(html)

  if (externalUrl) {
    return externalUrl
  }

  return offerUrl
}

function formatAddress(address: JsonObject | undefined) {
  if (!address) {
    return null
  }

  const street = stringValue(address.streetAddress)
  const postalCode = stringValue(address.postalCode)
  const locality = stringValue(address.addressLocality)

  if (street) {
    return street
  }

  return [postalCode, locality].filter(Boolean).join(' ') || null
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function objectValue(value: unknown): JsonObject | undefined {
  return isObject(value) ? value : undefined
}

function firstObject(value: unknown): JsonObject | undefined {
  if (Array.isArray(value)) {
    return objectValue(value[0])
  }

  return objectValue(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function requiredString(value: unknown, url: string, fieldName: string) {
  const parsed = stringValue(value)

  if (!parsed) {
    throw new Error(`${fieldName} missing for ${url}`)
  }

  return parsed
}

function firstString(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return stringValue(value.find((item) => typeof item === 'string'))
  }

  return null
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function titleFromSlug(sourceSlug: string) {
  return circuitFromSlug(sourceSlug)
}

function organizerFromSlug(sourceSlug: string) {
  return sourceSlug.split('/')[0]
}

function circuitFromSlug(sourceSlug: string) {
  const eventSlug = sourceSlug.split('/')[1] ?? sourceSlug
  return eventSlug.replace(/^20\d{2}-\d{2}-\d{2}-/, '').replaceAll('-', ' ')
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
