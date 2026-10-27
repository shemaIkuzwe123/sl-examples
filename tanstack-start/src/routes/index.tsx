import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { Note } from '#/db/notes'
import { createNoteFn, listNotesFn } from '#/server/notes'

type NotesSearch = {
  q?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): NotesSearch => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
  }),
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ deps }) =>
    listNotesFn().then((notes) => filterNotes(notes, deps.q)),
  component: Home,
})

function filterNotes(notes: Array<Note>, q?: string) {
  if (!q) return notes
  const needle = q.toLowerCase()
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(needle) ||
      note.content.toLowerCase().includes(needle),
  )
}

function Home() {
  const notes = Route.useLoaderData()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setPending(true)
    try {
      await createNoteFn({
        data: {
          title: String(data.get('title') ?? ''),
          content: String(data.get('content') ?? ''),
        },
      })
      form.reset()
      await router.invalidate()
    } finally {
      setPending(false)
    }
  }

  return (
    <main>
      <h1>Notes</h1>

      <form className="create" onSubmit={handleCreate}>
        <input name="title" placeholder="Title" required />
        <textarea name="content" placeholder="Write something…" rows={3} />
        <button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </form>

      <form
        className="filter"
        onSubmit={(event) => {
          event.preventDefault()
          const q = String(new FormData(event.currentTarget).get('q') ?? '')
          navigate({ search: q ? { q } : {} })
        }}
      >
        <input name="q" placeholder="Filter notes…" defaultValue={q} />
        <button type="submit">Filter</button>
        {q ? (
          <button type="button" onClick={() => navigate({ search: {} })}>
            Clear
          </button>
        ) : null}
      </form>

      {notes.length === 0 ? (
        <p className="empty">No notes{q ? ` matching “${q}”` : ' yet'}.</p>
      ) : (
        <ul className="notes">
          {notes.map((note) => (
            <li key={note.id}>
              <Link to="/notes/$id" params={{ id: note.id }}>
                <strong>{note.title}</strong>
                <span className="meta">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
