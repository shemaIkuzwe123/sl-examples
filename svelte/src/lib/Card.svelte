<script lang="ts">
  import type { Card as CardModel, ColumnId } from './types'
  import { board } from './board.svelte'

  let { card, columnId }: { card: CardModel; columnId: ColumnId } = $props()

  let editing = $state(false)
  let draft = $state('')

  function startEdit() {
    draft = card.text
    editing = true
  }

  function commit() {
    if (!editing) return
    editing = false
    board.setText(columnId, card.id, draft)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      editing = false
    }
  }

  function autofocus(node: HTMLElement) {
    node.focus()
  }
</script>

<article
  class="card"
  class:dragging={board.drag?.cardId === card.id}
  draggable={!editing}
  ondragstart={(event) => board.startDrag(event, columnId, card.id)}
  ondragend={() => board.endDrag()}
>
  {#if editing}
    <textarea
      bind:value={draft}
      rows={2}
      use:autofocus
      onkeydown={handleKeydown}
      onblur={commit}
    ></textarea>
  {:else}
    <button type="button" class="card-text" onclick={startEdit} title="Click to edit">
      {card.text}
    </button>
  {/if}
  <button
    type="button"
    class="card-remove"
    aria-label="Delete card"
    onclick={() => board.removeCard(columnId, card.id)}
  >
    ×
  </button>
</article>
