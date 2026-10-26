import type { Card, Column, ColumnId } from './types'

export const STORAGE_KEY = 'svelte-kanban-v1'

export type DragSource = { columnId: ColumnId; cardId: string }
export type DropTarget = { columnId: ColumnId; index: number } | null

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function seed(): Column[] {
  return [
    {
      id: 'todo',
      title: 'To do',
      cards: [
        { id: uid(), text: 'Design the onboarding flow' },
        { id: uid(), text: 'Write the deploy guide' },
        { id: uid(), text: 'Plan the launch post' },
      ],
    },
    {
      id: 'doing',
      title: 'In progress',
      cards: [{ id: uid(), text: 'Build the Kanban demo' }],
    },
    {
      id: 'done',
      title: 'Done',
      cards: [{ id: uid(), text: 'Scaffold the project' }],
    },
  ]
}

function load(): Column[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || data.length !== 3) return null
    for (const col of data) {
      if (
        typeof (col as Column)?.id !== 'string' ||
        typeof (col as Column)?.title !== 'string' ||
        !Array.isArray((col as Column)?.cards)
      ) {
        return null
      }
      for (const card of (col as Column).cards) {
        if (typeof (card as Card)?.id !== 'string' || typeof (card as Card)?.text !== 'string') {
          return null
        }
      }
    }
    return data as Column[]
  } catch {
    return null
  }
}

/**
 * Runes-based store. `columns`, `drag` and `hover` are deep-reactive
 * `$state` — mutations through the methods below update the UI directly.
 */
class Board {
  columns: Column[] = $state(load() ?? seed())
  drag: DragSource | null = $state(null)
  hover: DropTarget = $state(null)

  private find(columnId: ColumnId): Column | undefined {
    return this.columns.find((c) => c.id === columnId)
  }

  addCard(columnId: ColumnId, text: string) {
    const value = text.trim()
    if (!value) return
    this.find(columnId)?.cards.push({ id: uid(), text: value })
  }

  setText(columnId: ColumnId, cardId: string, text: string) {
    const card = this.find(columnId)?.cards.find((c) => c.id === cardId)
    if (!card) return
    const value = text.trim()
    if (value) card.text = value
    else this.removeCard(columnId, cardId)
  }

  removeCard(columnId: ColumnId, cardId: string) {
    const column = this.find(columnId)
    if (!column) return
    const index = column.cards.findIndex((c) => c.id === cardId)
    if (index !== -1) column.cards.splice(index, 1)
  }

  /** Move a card to `toColumnId` at insertion position `toIndex`. */
  move(source: DragSource, toColumnId: ColumnId, toIndex: number) {
    const from = this.find(source.columnId)
    const fromIndex = from?.cards.findIndex((c) => c.id === source.cardId) ?? -1
    if (!from || fromIndex === -1) return
    const [card] = from.cards.splice(fromIndex, 1)

    const to = this.find(toColumnId)
    if (!to) {
      from.cards.splice(fromIndex, 0, card)
      return
    }
    let index = toIndex
    if (to.id === from.id && fromIndex < index) index -= 1
    to.cards.splice(Math.min(Math.max(index, 0), to.cards.length), 0, card)
  }

  startDrag(event: DragEvent, columnId: ColumnId, cardId: string) {
    this.drag = { columnId, cardId }
    this.hover = null
    event.dataTransfer?.setData('text/plain', cardId)
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }

  endDrag() {
    this.drag = null
    this.hover = null
  }

  reset() {
    this.columns = seed()
  }
}

export const board = new Board()
