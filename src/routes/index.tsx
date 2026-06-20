import { createFileRoute } from '@tanstack/react-router'
import lapvioTrackdays from '../../data/lapvio/trackdays.json'

export const Route = createFileRoute('/')({
  component: Home,
})

type Trackday = {
  id: string
  date: string
  circuit: string
  country: string
  organizer: string
  price: PriceView
  sourceUrl: string
  relevance: string
  note: string
}

type PriceView = {
  primary: string
  original: string | null
  sortValue: number | null
}

type LapvioTrackday = {
  sourceSlug: string
  sourceUrl: string
  dateStart: string
  organizer: string
  circuit: string
  countryCode: string | null
  priceFrom: number | null
  currency: string | null
}

const EUR_TO_CZK = 24.175
const MAX_VISIBLE_ROWS = 48

const interestingCircuitNames = [
  'autodrom most',
  'most',
  'creditas autodrom brno',
  'autodrom brno',
  'automotodrom brno',
  'autodrom sosnova',
  'sosnova',
  'vysoke myto',
  'pisek',
  'autoklub hradiste',
  'slovakiaring',
  'red bull ring',
  'wachauring melk',
  'pannonia ring',
  'nurburgring nordschleife',
]

const importedTrackdays = lapvioTrackdays as Array<LapvioTrackday>
const trackdays = importedTrackdays.map(toTrackday).sort(compareTrackdays)
const interestingTrackdays = trackdays.filter(isInterestingTrackday)
const visibleTrackdays = interestingTrackdays.slice(0, MAX_VISIBLE_ROWS)
const visibleCircuits = new Set(visibleTrackdays.map((event) => event.circuit))
const priceKnownCount = visibleTrackdays.filter((event) => event.price.sortValue !== null).length
const earliestEvent = visibleTrackdays.at(0)

function Home() {
  return (
    <main className="page-shell">
      <header className="app-header">
        <div>
          <p className="kicker">Trackdays planner</p>
          <h1>Nejbližší relevantní termíny</h1>
        </div>
        <div className="header-meta">
          <span>Start: Pardubice</span>
          <span>Kurz EUR: {formatRate(EUR_TO_CZK)} Kč</span>
        </div>
      </header>

      <section className="summary-strip" aria-label="Přehled importu">
        <div>
          <span>Zobrazeno</span>
          <strong>{visibleTrackdays.length}</strong>
        </div>
        <div>
          <span>Okruhy</span>
          <strong>{visibleCircuits.size}</strong>
        </div>
        <div>
          <span>S cenou</span>
          <strong>{priceKnownCount}</strong>
        </div>
        <div>
          <span>Nejbližší</span>
          <strong>{earliestEvent ? formatCompactDate(earliestEvent.date) : 'N/A'}</strong>
        </div>
      </section>

      <section className="criteria-bar" aria-label="Aktuální výběr">
        <span>Primárně CZ, SK, AT a vybrané okolní okruhy</span>
        <span>Nordschleife ponechaná jako výjimka</span>
        <span>Ceny v Kč jsou orientační</span>
      </section>

      <section className="table-panel" aria-label="Trackday termíny">
        <div className="table-toolbar">
          <div>
            <h2>Termíny</h2>
            <p>
              Seřazeno podle data, omezeno na okruhy v prvním osobním výběru.
            </p>
          </div>
          <a href="https://www.lapvio.com/cs/trackdays?country=CZ">Lapvio CZ</a>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Termín</th>
                <th>Okruh</th>
                <th>Pořadatel</th>
                <th>Země</th>
                <th>Cena</th>
                <th>Poznámka</th>
                <th aria-label="Detail" />
              </tr>
            </thead>
            <tbody>
              {visibleTrackdays.map((event) => (
                <tr key={event.id}>
                  <td data-label="Termín">
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                  </td>
                  <td data-label="Okruh">
                    <strong>{event.circuit}</strong>
                    <span>{event.relevance}</span>
                  </td>
                  <td data-label="Pořadatel">{event.organizer}</td>
                  <td data-label="Země">
                    <span className="country-pill">{event.country}</span>
                  </td>
                  <td data-label="Cena" className="price-cell">
                    <strong>{event.price.primary}</strong>
                    {event.price.original ? <span>{event.price.original}</span> : null}
                  </td>
                  <td data-label="Poznámka">{event.note}</td>
                  <td className="detail-cell">
                    <a href={event.sourceUrl}>Detail</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function toTrackday(event: LapvioTrackday): Trackday {
  const country = event.countryCode ?? 'N/A'

  return {
    id: event.sourceSlug,
    date: event.dateStart,
    circuit: event.circuit,
    country,
    organizer: event.organizer,
    price: formatPrice(event.priceFrom, event.currency),
    sourceUrl: event.sourceUrl,
    relevance: getRelevance(event.circuit, country),
    note: getNote(event.circuit, country),
  }
}

function isInterestingTrackday(event: Trackday) {
  if (event.country === 'CZ' || event.country === 'SK' || event.country === 'AT') {
    return true
  }

  const normalizedCircuit = normalize(event.circuit)

  return interestingCircuitNames.some((name) => normalizedCircuit.includes(name))
}

function compareTrackdays(a: Trackday, b: Trackday) {
  const dateDiff = a.date.localeCompare(b.date)
  if (dateDiff !== 0) return dateDiff

  return interestRank(a) - interestRank(b)
}

function interestRank(event: Trackday) {
  if (event.country === 'CZ') return 0
  if (event.country === 'SK' || event.country === 'AT') return 1
  if (normalize(event.circuit).includes('nurburgring nordschleife')) return 2
  return 3
}

function getRelevance(circuit: string, country: string) {
  const normalizedCircuit = normalize(circuit)

  if (country === 'CZ') return 'domácí priorita'
  if (country === 'SK' || country === 'AT') return 'rozumný dojezd'
  if (normalizedCircuit.includes('nurburgring nordschleife')) return 'výjimka'
  if (country === 'DE') return 'ověřit dojezd'

  return 'okolní země'
}

function getNote(circuit: string, country: string) {
  const normalizedCircuit = normalize(circuit)

  if (normalizedCircuit.includes('most')) return 'vhodné na víkend / večer'
  if (normalizedCircuit.includes('brno')) return 'ověřit kalendář'
  if (normalizedCircuit.includes('sosnova')) return 'krátký okruh'
  if (normalizedCircuit.includes('slovakiaring')) return 'delší cesta, pořád relevantní'
  if (normalizedCircuit.includes('nurburgring nordschleife')) return 'ponechat jako výjimku'
  if (country === 'AT') return 'počítat s cestou den předem'

  return 'k ručnímu posouzení'
}

function formatPrice(price: number | null, currency: string | null): PriceView {
  if (price === null || currency === null) {
    return {
      primary: 'Cena na dotaz',
      original: null,
      sortValue: null,
    }
  }

  if (currency === 'CZK') {
    return {
      primary: formatCzk(price),
      original: null,
      sortValue: price,
    }
  }

  if (currency === 'EUR') {
    const converted = Math.round(price * EUR_TO_CZK)

    return {
      primary: formatCzk(converted),
      original: `(${formatEur(price)})`,
      sortValue: converted,
    }
  }

  return {
    primary: `${formatNumber(price)} ${currency}`,
    original: null,
    sortValue: null,
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(value))
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(value))
}

function formatCzk(value: number) {
  return `${formatNumber(value)} Kč`
}

function formatEur(value: number) {
  return `€${formatNumber(value)}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRate(value: number) {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
