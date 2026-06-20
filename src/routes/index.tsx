import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import lapvioTrackdays from '../../data/lapvio/trackdays.json'

export const Route = createFileRoute('/')({
  component: Home,
})

type Trackday = {
  id: string
  title: string
  circuit: string
  country: string
  date: string
  organizer: string
  price: string
  sourceUrl: string
  imageUrl: string | null
  address: string | null
  monthKey: string
  monthLabel: string
  day: string
  monthShort: string
  travelHint: string
  score: 'fit' | 'maybe' | 'far'
}

type LapvioTrackday = {
  sourceSlug: string
  sourceUrl: string
  title: string
  dateStart: string
  organizer: string
  circuit: string
  countryCode: string | null
  address: string | null
  priceFrom: number | null
  currency: string | null
  imageUrl: string | null
}

type MonthGroup = {
  key: string
  label: string
  events: Array<Trackday>
}

const importedTrackdays = lapvioTrackdays as Array<LapvioTrackday>
const trackdays = importedTrackdays
  .map(toTrackday)
  .sort((a, b) => a.date.localeCompare(b.date))

const featuredTrackdays = trackdays.slice(0, 36)
const monthGroups = groupByMonth(featuredTrackdays)
const circuitCount = new Set(trackdays.map((event) => event.circuit)).size
const countryStats = Array.from(
  trackdays.reduce((counts, event) => {
    counts.set(event.country, (counts.get(event.country) ?? 0) + 1)
    return counts
  }, new Map<string, number>()),
)
  .sort(([a], [b]) => a.localeCompare(b))

const primaryCountries = countryStats.slice(0, 8)
const czechCandidates = trackdays.filter((event) => event.country === 'CZ').length

const planningFilters = [
  'Open pitlane',
  'Sessions / skupiny',
  'Do 3 h z Pardubic',
  'Volný víkend',
  'CZ / SK / AT',
  'Nordschleife výjimka',
]

function Home() {
  return (
    <main className="lapvio-shell">
      <header className="site-nav" aria-label="Trackdays planner navigation">
        <a className="brand" href="/">
          <span className="brand-mark">TD</span>
          <span>Trackdays</span>
        </a>
        <nav aria-label="Primary">
          <a href="#events">Trackdays</a>
          <a href="#calendar">Kalendář</a>
          <a href="#map">Mapa</a>
        </nav>
        <div className="nav-actions">
          <button type="button">GCal</button>
          <button type="button" className="primary-action">
            Aktualizovat import
          </button>
        </div>
      </header>

      <section className="hero-panel" aria-label="Trackday overview">
        <div className="hero-copy">
          <p className="eyebrow">Pardubice origin planner</p>
          <h1>
            Nadcházející
            <span>trackdays.</span>
          </h1>
          <p className="hero-text">
            Soukromý pohled na Lapvio import, dostupnost v kalendáři a geografii
            okruhů, které dávají smysl pro cestu z Pardubic.
          </p>
        </div>

        <div className="hero-stats" aria-label="Import summary">
          <article>
            <strong>{trackdays.length}</strong>
            <span>Importováno</span>
          </article>
          <article>
            <strong>{czechCandidates}</strong>
            <span>České akce</span>
          </article>
          <article>
            <strong>{circuitCount}</strong>
            <span>Okruhy</span>
          </article>
        </div>
      </section>

      <section className="filter-rail" aria-label="Event filters">
        <div className="country-strip" aria-label="Countries">
          <button type="button" className="chip active">
            Vše
          </button>
          {primaryCountries.map(([country, count]) => (
            <button type="button" className="chip" key={country}>
              {country}
              <span>{count}</span>
            </button>
          ))}
        </div>

        <div className="type-strip" aria-label="Planning filters">
          {planningFilters.map((filter) => (
            <button type="button" className="chip ghost" key={filter}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="planning-grid" aria-label="Planning workspace">
        <article className="calendar-card" id="calendar">
          <div className="panel-heading">
            <span>GCal overlay</span>
            <h2>Červenec 2026</h2>
          </div>
          <div className="calendar-mini" aria-label="Availability calendar">
            {calendarDays.map((item) => (
              <div className={`calendar-day ${item.tone}`} key={item.date}>
                <span>{item.day}</span>
                <strong>{item.date}</strong>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="map-card" id="map">
          <div className="panel-heading">
            <span>Dojezd</span>
            <h2>Praktické okruhy</h2>
          </div>
          <div className="route-map" role="img" aria-label="Stylized Central Europe map">
            <span className="map-node home">Pardubice</span>
            <span className="map-node north">Most</span>
            <span className="map-node south">Brno</span>
            <span className="map-node east">Slovakiaring</span>
            <span className="map-node west">Nordschleife</span>
          </div>
        </article>

        <article className="decision-card">
          <div className="panel-heading">
            <span>Priorita</span>
            <h2>Osobní scoring</h2>
          </div>
          <div className="score-list">
            <p>
              <strong>CZ/SK/AT</strong>
              Kandidáti k ručnímu ověření v kalendáři.
            </p>
            <p>
              <strong>DE západ</strong>
              Spíš vyřadit, pokud nejde o výjimečný okruh.
            </p>
            <p>
              <strong>Nordschleife</strong>
              Samostatná výjimka i přes dojezd.
            </p>
          </div>
        </article>
      </section>

      <section className="event-board" id="events" aria-label="Candidate events">
        <div className="event-board-heading">
          <div>
            <p className="eyebrow">Lapvio import</p>
            <h2>Kandidáti k filtrování</h2>
          </div>
          <div className="view-toggle" aria-label="View mode">
            <button type="button" className="active" aria-label="Grid view">
              ▦
            </button>
            <button type="button" aria-label="List view">
              ≡
            </button>
          </div>
        </div>

        {monthGroups.map((group) => (
          <section className="month-section" key={group.key} aria-label={group.label}>
            <h3>
              {group.label}
              <span>{group.events.length} akcí</span>
            </h3>
            <div className="event-grid">
              {group.events.map((event) => (
                <article className="trackday-card" key={event.id}>
                  <a href={event.sourceUrl} aria-label={`${event.circuit} detail`}>
                    <div
                      className="trackday-art"
                      style={getEventImageStyle(event.imageUrl)}
                    >
                      <time dateTime={event.date}>
                        <strong>{event.day}</strong>
                        <span>{event.monthShort}</span>
                      </time>
                    </div>
                    <div className="trackday-body">
                      <div className="card-meta">
                        <span className={`score ${event.score}`}>{event.country}</span>
                        <span>{event.travelHint}</span>
                      </div>
                      <h4>{event.circuit}</h4>
                      <p>{event.organizer}</p>
                      <div className="card-footer">
                        <strong>{event.price}</strong>
                        <span>Detail →</span>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}

const calendarDays = [
  { day: 'Po', date: '13', label: 'Práce', tone: 'muted' },
  { day: 'Út', date: '14', label: 'Volno', tone: 'open' },
  { day: 'St', date: '15', label: 'Rodina', tone: 'blocked' },
  { day: 'Čt', date: '16', label: 'Volno', tone: 'open' },
  { day: 'Pá', date: '17', label: 'Most večer', tone: 'event' },
  { day: 'So', date: '18', label: 'Most', tone: 'event' },
  { day: 'Ne', date: '19', label: 'Rezerva', tone: 'open' },
]

function toTrackday(event: LapvioTrackday): Trackday {
  const date = parseDate(event.dateStart)
  const country = event.countryCode ?? 'N/A'

  return {
    id: event.sourceSlug,
    title: event.title,
    circuit: event.circuit,
    country,
    date: event.dateStart,
    organizer: event.organizer,
    price: formatPrice(event.priceFrom, event.currency),
    sourceUrl: event.sourceUrl,
    imageUrl: event.imageUrl,
    address: event.address,
    monthKey: event.dateStart.slice(0, 7),
    monthLabel: formatMonth(date),
    day: new Intl.DateTimeFormat('cs-CZ', { day: '2-digit' }).format(date),
    monthShort: new Intl.DateTimeFormat('cs-CZ', { month: 'short' })
      .format(date)
      .replace('.', ''),
    travelHint: getTravelHint(country),
    score: getScore(country),
  }
}

function groupByMonth(events: Array<Trackday>): Array<MonthGroup> {
  const groups = new Map<string, MonthGroup>()

  for (const event of events) {
    const group = groups.get(event.monthKey) ?? {
      key: event.monthKey,
      label: event.monthLabel,
      events: [],
    }
    group.events.push(event)
    groups.set(event.monthKey, group)
  }

  return Array.from(groups.values())
}

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase()
}

function getTravelHint(country: string) {
  if (country === 'CZ') return 'blízko'
  if (country === 'SK' || country === 'AT' || country === 'PL') return 'rozumné'
  if (country === 'DE') return 'prověřit'
  return 'dlouhé'
}

function getScore(country: string): Trackday['score'] {
  if (country === 'CZ' || country === 'SK' || country === 'AT') return 'fit'
  if (country === 'PL' || country === 'HU' || country === 'DE') return 'maybe'
  return 'far'
}

function formatPrice(price: number | null, currency: string | null) {
  if (price === null || currency === null) {
    return 'Cena na dotaz'
  }

  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

function getEventImageStyle(imageUrl: string | null): CSSProperties | undefined {
  if (!imageUrl) return undefined

  return { '--event-image': `url(${imageUrl})` } as CSSProperties
}
