import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

type Trackday = {
  id: string
  circuit: string
  country: string
  date: string
  organizer: string
  travelTime: string
  distanceKm: number
  score: 'fit' | 'maybe' | 'far'
}

const trackdays: Array<Trackday> = [
  {
    id: 'most-jul',
    circuit: 'Autodrom Most',
    country: 'CZ',
    date: '2026-07-18',
    organizer: 'Lapvio sample',
    travelTime: '2 h 15 min',
    distanceKm: 195,
    score: 'fit',
  },
  {
    id: 'brno-aug',
    circuit: 'Automotodrom Brno',
    country: 'CZ',
    date: '2026-08-03',
    organizer: 'Lapvio sample',
    travelTime: '1 h 55 min',
    distanceKm: 155,
    score: 'fit',
  },
  {
    id: 'slovakiaring-sep',
    circuit: 'Slovakiaring',
    country: 'SK',
    date: '2026-09-12',
    organizer: 'Lapvio sample',
    travelTime: '3 h 10 min',
    distanceKm: 285,
    score: 'maybe',
  },
  {
    id: 'nordschleife-oct',
    circuit: 'Nordschleife',
    country: 'DE',
    date: '2026-10-04',
    organizer: 'Lapvio sample',
    travelTime: '7 h 20 min',
    distanceKm: 690,
    score: 'maybe',
  },
]

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
  const fitCount = trackdays.filter((event) => event.score === 'fit').length
  const maybeCount = trackdays.filter((event) => event.score === 'maybe').length

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
          <span>Relevantní</span>
          <strong>{fitCount}</strong>
          <small>do 2,5 hodiny cesty</small>
        </article>
        <article>
          <span>Na zvážení</span>
          <strong>{maybeCount}</strong>
          <small>delší cesta nebo výjimka</small>
        </article>
        <article>
          <span>Další integrace</span>
          <strong>GCal</strong>
          <small>volno, prázdniny, blokace</small>
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
          <p>Vzorková data</p>
          <h2>Kandidáti k dalšímu filtrování</h2>
        </div>
        <div className="events">
          {trackdays.map((event) => (
            <article className="event-row" key={event.id}>
              <div>
                <span className={`status ${event.score}`}>
                  {event.score === 'fit' ? 'sedí' : 'ověřit'}
                </span>
                <h3>{event.circuit}</h3>
                <p>
                  {event.country} · {event.organizer}
                </p>
              </div>
              <time dateTime={event.date}>
                {new Intl.DateTimeFormat('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(event.date))}
              </time>
              <div className="travel">
                <strong>{event.travelTime}</strong>
                <span>{event.distanceKm} km</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
