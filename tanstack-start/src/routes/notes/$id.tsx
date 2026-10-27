import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { deleteNoteFn, getNoteFn, updateNoteFn } from '#/server/notes'

export const Route = createFileRoute('/notes/$id')({
  loader: async ({ params }) => {
    const note = await getNoteFn({ data: params.id })
    if (!note) throw notFound()
    return note
  },
  component: NoteDetail,
})

function NoteDetail() {
  const note = Route.useLoaderData()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [saving, setSaving] = useState(false)

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await updateNoteFn({
        data: {
          id: note.id,
          title: String(data.get('title') ?? ''),
          content: String(data.get('content') ?? ''),
        },
      })
      await router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    await deleteNoteFn({ data: note.id })
    await navigate({ to: '/' })
  }

  return (
    <main>
      <p className="crumbs">
        <Link to="/">← All notes</Link>
      </p>

      <form className="editor" onSubmit={handleSave}>
        <input name="title" defaultValue={note.title} required />
        <textarea
          name="content"
          defaultValue={note.content}
          rows={8}
          placeholder="Write something…"
        />
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </form>

      <p className="meta">
        Created {new Date(note.createdAt).toLocaleString()} · Updated{' '}
        {new Date(note.updatedAt).toLocaleString()}
      </p>
    </main>
  )
}
