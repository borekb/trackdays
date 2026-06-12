import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  })
}

function NotFound() {
  return (
    <main className="shell">
      <p className="eyebrow">Nenalezeno</p>
      <h1>Tenhle úsek tratě zatím v plánu není</h1>
    </main>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
