export type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

/**
 * In-memory store. Data lives for as long as the server process does —
 * it resets on every restart or redeploy. No database, no env vars.
 */
const notes = new Map<string, Note>()

let counter = 0

function nextId(): string {
  counter += 1
  return counter.toString(36) + Math.random().toString(36).slice(2, 6)
}

function seed() {
  const now = Date.now()
  const samples: Array<Pick<Note, 'title' | 'content'>> = [
    { title: 'Hello TanStack Start', content: 'This note is served by a server function and rendered on the server.' },
    { title: 'Second note', content: 'Try editing or deleting this one. Everything is type-safe end to end.' },
  ]
  samples.forEach((sample, i) => {
    const id = nextId()
    notes.set(id, { id, ...sample, createdAt: now - i * 1000, updatedAt: now - i * 1000 })
  })
}

seed()

export type NoteInput = {
  title?: unknown
  content?: unknown
}

export function listNotes(): Array<Note> {
  return [...notes.values()].sort((a, b) => b.createdAt - a.createdAt)
}

export function getNote(id: string): Note | undefined {
  return notes.get(id)
}

export function createNote(input: { title?: unknown; content?: unknown }): Note {
  const now = Date.now()
  const note: Note = {
    id: nextId(),
    title: String(input.title ?? '').trim() || 'Untitled',
    content: String(input.content ?? ''),
    createdAt: now,
    updatedAt: now,
  }
  notes.set(note.id, note)
  return note
}

export function updateNote(
  id: string,
  input: { title?: unknown; content?: unknown },
): Note | undefined {
  const note = notes.get(id)
  if (!note) return undefined
  const updated: Note = {
    ...note,
    title: String(input.title ?? note.title).trim() || 'Untitled',
    content: String(input.content ?? note.content),
    updatedAt: Date.now(),
  }
  notes.set(id, updated)
  return updated
}

export function deleteNote(id: string): boolean {
  return notes.delete(id)
}
