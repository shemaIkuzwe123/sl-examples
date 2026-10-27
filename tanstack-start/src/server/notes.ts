import { createServerFn } from '@tanstack/react-start'
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from '#/db/notes'

export const listNotesFn = createServerFn({ method: 'GET' }).handler(() =>
  listNotes(),
)

export const getNoteFn = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data: id }) => getNote(id))

export const createNoteFn = createServerFn({ method: 'POST' })
  .validator((input: { title?: unknown; content?: unknown }) => input)
  .handler(({ data }) => createNote(data))

export const updateNoteFn = createServerFn({ method: 'POST' })
  .validator((input: { id: string; title?: unknown; content?: unknown }) => input)
  .handler(({ data }) => updateNote(data.id, data))

export const deleteNoteFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data: id }) => deleteNote(id))
