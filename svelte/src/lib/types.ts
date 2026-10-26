export type ColumnId = 'todo' | 'doing' | 'done'

export type Card = {
  id: string
  text: string
}

export type Column = {
  id: ColumnId
  title: string
  cards: Card[]
}
