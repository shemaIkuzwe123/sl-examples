<script lang="ts">
  import Column from './lib/Column.svelte'
  import { board, STORAGE_KEY } from './lib/board.svelte'

  // Deep-tracking effect: any mutation to the board proxy saves the board.
  $effect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board.columns))
  })
</script>

<header class="app-header">
  <h1>📝 Kanban</h1>
  <button type="button" onclick={() => board.reset()}>Reset board</button>
</header>

<main class="board">
  {#each board.columns as column (column.id)}
    <Column {column} />
  {/each}
</main>

<footer class="hint">
  Drag cards between columns · click a card to edit · state persists in localStorage
</footer>
