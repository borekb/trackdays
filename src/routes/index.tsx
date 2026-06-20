import { createFileRoute } from '@tanstack/react-router'
import lapvioTrackdays from '../../data/lapvio/trackdays.json'

export const Route = createFileRoute('/')({
  component: Home,
})

type Trackday = {
  id: string
  circuit: string
  country: string
  date: string
  organizer: string
  price: string
  sourceUrl: string
  score: 'fit' | 'maybe' | 'far'
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

const importedTrackdays = lapvioTrackdays as Array<LapvioTrackday>
const trackdays = importedTrackdays.map(toTrackday)
const circuitCount = new Set(trackdays.map((event) => event.circuit)).size
const countryCodes = Array.from(new Set(trackdays.map((event) => event.country))).sort()

const calendarDays = [
  { day: 'Po', date: '13', label: 'Práce', tone: 'muted' },
  { day: 'Út', date: '14', label: 'Volno', tone: 'open' },
  { day: 'St', date: '15', label: 'Rodina', tone: 'blocked' },
  { day: 'Čt', date: '16', label: 'Volno', tone: 'open' },
  { day: 'Pá', date: '17', label: 'Most večer', tone: 'event' },
  { day: 'So', date: '18', label: 'Most', tone: 'event' },
  { day: 'Ne', date: '19', label: 'Rezerva', tone: 'open' },
]

function Home() {
  return (
    <main className="shell">
      <header className="topbar" aria-label="Trackdays overview">
        <div>
          <p className="eyebrow">Pardubice origin planner</p>
          <h1>Trackdays, které dávají časově i geograficky smysl</h1>
        </div>
        <div className="view-switch" aria-label="View mode">
          <button type="button" className="active">
            Kalendář
          </button>
          <button type="button">Mapa</button>
          <button type="button">Seznam</button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Planning summary">
        <article>
          <span>Importováno</span>
          <strong>{trackdays.length}</strong>
          <small>trackdays z Lapvio</small>
        </article>
        <article>
          <span>Okruhy</span>
          <strong>{circuitCount}</strong>
          <small>okruhů v importu</small>
        </article>
        <article>
          <span>Rozsah</span>
          <strong>{countryCodes.length}</strong>
          <small>{countryCodes.join(', ')}</small>
        </article>
      </section>

      <section className="workspace" aria-label="Calendar and map workspace">
        <div className="calendar-panel">
          <div className="section-heading">
            <p>Červenec 2026</p>
            <h2>Kalendář dostupnosti</h2>
          </div>
          <div className="calendar-grid">
            {calendarDays.map((item) => (
              <div className={`day-card ${item.tone}`} key={item.date}>
                <span>{item.day}</span>
                <strong>{item.date}</strong>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="map-panel">
          <div className="section-heading">
            <p>Dojezd z Pardubic</p>
            <h2>Geografický filtr</h2>
          </div>
          <div className="map-canvas" role="img" aria-label="Stylized Central Europe map">
            <span className="pin home">Pardubice</span>
            <span className="pin most">Most</span>
            <span className="pin brno">Brno</span>
            <span className="pin slovakia">Slovakiaring</span>
            <span className="pin ring">Nordschleife</span>
          </div>
        </div>
      </section>

      <section className="event-list" aria-label="Candidate trackdays">
        <div className="section-heading">
          <p>Lapvio import</p>
          <h2>Kandidáti k dalšímu filtrování</h2>
        </div>
        <div className="events">
          {trackdays.map((event) => (
            <article className="event-row" key={event.id}>
              <div>
                <span className={`status ${event.score}`}>
                  {event.country}
                </span>
                <h3>
                  <a href={event.sourceUrl}>{event.circuit}</a>
                </h3>
                <p>
                  {event.country} · {event.organizer}
                </p>
              </div>
              <time dateTime={event.date}>
                {formatDate(event.date)}
              </time>
              <div className="travel">
                <strong>{event.price}</strong>
                <span>Lapvio detail</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function toTrackday(event: LapvioTrackday): Trackday {
  return {
    id: event.sourceSlug,
    circuit: event.circuit,
    country: event.countryCode ?? 'N/A',
    date: event.dateStart,
    organizer: event.organizer,
    price: formatPrice(event.priceFrom, event.currency),
    sourceUrl: event.sourceUrl,
    score: 'fit',
  }
}

function formatDate(value: string) {
  const datePart = value.slice(0, 10)
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${datePart}T12:00:00`))
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
