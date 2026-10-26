<script lang="ts">
  import { flip } from 'svelte/animate'
  import { scale } from 'svelte/transition'
  import type { Column as ColumnModel } from './types'
  import { board } from './board.svelte'
  import Card from './Card.svelte'

  let { column }: { column: ColumnModel } = $props()

  let listEl: HTMLElement | null = $state(null)
  let adding = $state(false)
  let draft = $state('')

  const hovered = $derived(board.hover?.columnId === column.id)
  const hoverIndex = $derived(hovered ? (board.hover?.index ?? -1) : -1)

  /** Insertion index under the cursor, from card midpoints. */
  function dropIndex(event: DragEvent): number {
    if (!listEl) return column.cards.length
    const cards = [...listEl.querySelectorAll<HTMLElement>('[data-card]')]
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      if (event.clientY < rect.top + rect.height / 2) return i
    }
    return cards.length
  }

  function handleDragOver(event: DragEvent) {
    if (!board.drag) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    board.hover = { columnId: column.id, index: dropIndex(event) }
  }

  function handleDrop(event: DragEvent) {
    if (!board.drag) return
    event.preventDefault()
    board.move(board.drag, column.id, dropIndex(event))
    board.endDrag()
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    board.addCard(column.id, draft)
    draft = ''
  }

  function autofocus(node: HTMLElement) {
    node.focus()
  }
</script>

<section
  class="column"
  class:over={hovered}
  ondragover={handleDragOver}
  ondrop={handleDrop}
  aria-label={column.title}
>
  <header class="column-header">
    <h2>{column.title}</h2>
    <span class="count">{column.cards.length}</span>
  </header>

  <div
    class="cards"
    class:empty-over={column.cards.length === 0 && hovered}
    bind:this={listEl}
  >
    {#each column.cards as card, i (card.id)}
      <div
        data-card
        class="card-slot"
        class:drop-before={hoverIndex === i}
        class:drop-after={hoverIndex === column.cards.length && i === column.cards.length - 1}
        animate:flip={{ duration: 180 }}
        in:scale={{ duration: 140, start: 0.92 }}
        out:scale={{ duration: 120, start: 0.92 }}
      >
        <Card {card} columnId={column.id} />
      </div>
    {/each}
  </div>

  <footer>
    {#if adding}
      <form onsubmit={submit}>
        <textarea
          bind:value={draft}
          rows={2}
          placeholder="Card text…"
          use:autofocus
          onkeydown={(event) => {
            if (event.key === 'Escape') {
              adding = false
              draft = ''
            }
          }}
        ></textarea>
        <div class="row">
          <button type="submit" class="primary" disabled={!draft.trim()}>Add</button>
          <button
            type="button"
            onclick={() => {
              adding = false
              draft = ''
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    {:else}
      <button type="button" class="add-card" onclick={() => (adding = true)}>
        + Add card
      </button>
    {/if}
  </footer>
</section>
