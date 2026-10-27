import { Link, HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Notes · TanStack Start',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link to="/">📝 Notes</Link>
        </header>
        {children}

        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>
        That note doesn't exist (or the server restarted — data is in-memory).{' '}
        <Link to="/">Back to all notes</Link>
      </p>
    </main>
  )
}
