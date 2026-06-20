# Trackdays

Personal trackday planner built with TanStack Start, React, and TypeScript.

## Development

```sh
pnpm install
pnpm dev:portless
```

Portless starts the app behind a stable HTTPS URL:
`https://<branch>.trackdays.localhost/`, for example
<https://main.trackdays.localhost/>.

Plain dev server URLs such as <http://localhost:3000> are not the primary
workflow because that port may belong to another local app.

## Data Import

```sh
pnpm import:lapvio
```

The importer reads public Lapvio HTML pages for Czech and neighboring-country
trackdays and writes normalized data to
[data/lapvio/trackdays.json](data/lapvio/trackdays.json). Country-specific
snapshots are written next to it, for example
[data/lapvio/trackdays.cz.json](data/lapvio/trackdays.cz.json).

## Product Direction

See [docs/product-notes.md](docs/product-notes.md) for the initial product notes and planned integrations.
