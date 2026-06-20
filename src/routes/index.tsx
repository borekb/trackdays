import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
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
  isFavoriteOrganizer: boolean
  price: PriceView
  sourceUrl: string
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

type OrganizerFilter = 'all' | 'favorites'
type CircuitFilter = 'all' | 'cz' | 'foreign' | 'nordschleife'

const EUR_TO_CZK = 24.175
const MAX_VISIBLE_ROWS = 48

const favoriteOrganizerNames = ['corners.cz', 'BM Racing', 'Special Drive', 'Drivers Club']

const organizerFilters: Array<{ id: OrganizerFilter; label: string }> = [
  { id: 'all', label: 'Všichni' },
  { id: 'favorites', label: 'Oblíbení' },
]

const circuitFilters: Array<{ id: CircuitFilter; label: string }> = [
  { id: 'all', label: 'Všechny okruhy' },
  { id: 'cz', label: 'České okruhy' },
  { id: 'foreign', label: 'Zahraniční' },
  { id: 'nordschleife', label: 'Nordschleife' },
]

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

function Home() {
  const [organizerFilter, setOrganizerFilter] = useState<OrganizerFilter>('all')
  const [circuitFilter, setCircuitFilter] = useState<CircuitFilter>('all')

  const filteredTrackdays = useMemo(
    () =>
      interestingTrackdays
        .filter((event) => matchesOrganizerFilter(event, organizerFilter))
        .filter((event) => matchesCircuitFilter(event, circuitFilter)),
    [organizerFilter, circuitFilter],
  )

  const visibleTrackdays = filteredTrackdays.slice(0, MAX_VISIBLE_ROWS)
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

      <section className="quick-filters" aria-label="Rychlé filtry">
        <div className="filter-group">
          <h2>Pořadatel</h2>
          <div className="filter-chips">
            {organizerFilters.map((filter) => (
              <button
                type="button"
                className={organizerFilter === filter.id ? 'active' : undefined}
                key={filter.id}
                onClick={() => setOrganizerFilter(filter.id)}
                title={filter.id === 'favorites' ? favoriteOrganizerNames.join(', ') : undefined}
              >
                {filter.label}
                <span>{countForOrganizer(filter.id, circuitFilter)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <h2>Okruhy</h2>
          <div className="filter-chips">
            {circuitFilters.map((filter) => (
              <button
                type="button"
                className={circuitFilter === filter.id ? 'active' : undefined}
                key={filter.id}
                onClick={() => setCircuitFilter(filter.id)}
              >
                {filter.label}
                <span>{countForCircuit(filter.id, organizerFilter)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="table-panel" aria-label="Trackday termíny">
        <div className="table-toolbar">
          <div>
            <h2>Termíny</h2>
            <p>
              Seřazeno podle data, omezeno na okruhy v prvním osobním výběru.
            </p>
          </div>
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
                <th aria-label="Detail" />
              </tr>
            </thead>
            <tbody>
              {visibleTrackdays.length > 0 ? (
                visibleTrackdays.map((event) => (
                  <tr
                    className={event.isFavoriteOrganizer ? 'favorite-organizer' : 'muted-organizer'}
                    key={event.id}
                  >
                    <td data-label="Termín">
                      <time dateTime={event.date}>{formatDate(event.date)}</time>
                    </td>
                    <td data-label="Okruh">
                      <strong>{event.circuit}</strong>
                    </td>
                    <td data-label="Pořadatel">{event.organizer}</td>
                    <td data-label="Země">
                      <span className="flag-pill" title={event.country}>
                        {getCountryFlag(event.country)}
                        <span className="sr-only">{event.country}</span>
                      </span>
                    </td>
                    <td data-label="Cena" className="price-cell">
                      <strong>{event.price.primary}</strong>
                      {event.price.original ? <span>{event.price.original}</span> : null}
                    </td>
                    <td className="detail-cell">
                      <a href={event.sourceUrl}>Detail</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={6}>
                    Pro tuhle kombinaci filtrů zatím v importu není žádný termín.
                  </td>
                </tr>
              )}
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
    isFavoriteOrganizer: isFavoriteOrganizer(event.organizer),
    price: formatPrice(event.priceFrom, event.currency),
    sourceUrl: event.sourceUrl,
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

function matchesOrganizerFilter(event: Trackday, filter: OrganizerFilter) {
  return filter === 'all' || event.isFavoriteOrganizer
}

function matchesCircuitFilter(event: Trackday, filter: CircuitFilter) {
  if (filter === 'all') return true
  if (filter === 'cz') return event.country === 'CZ'
  if (filter === 'foreign') return event.country !== 'CZ'

  return normalize(event.circuit).includes('nurburgring nordschleife')
}

function countForOrganizer(filter: OrganizerFilter, circuitFilter: CircuitFilter) {
  return interestingTrackdays
    .filter((event) => matchesOrganizerFilter(event, filter))
    .filter((event) => matchesCircuitFilter(event, circuitFilter)).length
}

function isFavoriteOrganizer(organizer: string) {
  return favoriteOrganizerNames.includes(organizer)
}

function countForCircuit(filter: CircuitFilter, organizerFilter: OrganizerFilter) {
  return interestingTrackdays
    .filter((event) => matchesCircuitFilter(event, filter))
    .filter((event) => matchesOrganizerFilter(event, organizerFilter)).length
}

function interestRank(event: Trackday) {
  if (event.country === 'CZ') return 0
  if (event.country === 'SK' || event.country === 'AT') return 1
  if (normalize(event.circuit).includes('nurburgring nordschleife')) return 2
  return 3
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

function getCountryFlag(country: string) {
  const flags: Record<string, string> = {
    AT: '🇦🇹',
    CZ: '🇨🇿',
    DE: '🇩🇪',
    HU: '🇭🇺',
    PL: '🇵🇱',
    SK: '🇸🇰',
  }

  return flags[country] ?? country
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
