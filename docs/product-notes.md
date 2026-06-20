# Product Notes

The app is a personal alternative to broad public trackday listings. The first useful version should answer three questions:

- Which trackdays are compatible with my Google Calendar events, vacations, and blocked dates?
- Which circuits are realistically reachable from Pardubice?
- Which events are worth deeper inspection before registering?

## Planned Data Sources

- Trackdays: start with manual or scraped/imported Lapvio-like event data, then normalize by circuit, organizer, date, price, and booking URL.
- Calendar: Google Calendar read-only import for availability overlays.
- Travel: route estimates from Pardubice, ideally cached server-side because map APIs are paid and rate-limited.

## Local Data Storage

- Imported Lapvio data lives in `data/lapvio/trackdays.json`.
- The importer currently targets `CZ`, `SK`, `AT`, `DE`, `PL`, and `HU`; add nearby countries in `scripts/import-lapvio.ts` as needed.
- Refresh with `pnpm import:lapvio`; review the JSON diff before committing.
- Raw HTML caches should stay out of Git, for example under `.cache/lapvio/`.

## Initial Views

- Calendar: month/week view with trackdays and personal availability in one timeline.
- Map: circuits plotted with distance and travel-time bands.
- List: ranked candidates with filters for country, circuit, distance, date window, and organizer.
