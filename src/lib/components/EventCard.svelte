<script lang="ts">
  import { formatRelativeDate } from '$lib/utils/countdown';
  import type { CalendarEvent } from '$lib/types';

  interface Props { event: CalendarEvent; }
  let { event }: Props = $props();

  const rel = $derived(formatRelativeDate(event.start));

  function fmtDate(ev: CalendarEvent): string {
    return ev.start.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }
</script>

<div class="row">
  <div class="date-col">
    <span class="month">{event.start.toLocaleDateString('en-US', { month: 'short' })}</span>
    <span class="day">{event.start.getDate()}</span>
  </div>
  <div class="content">
    <span class="title">{event.summary}</span>
    {#if event.description}
      <span class="desc">{event.description}</span>
    {/if}
  </div>
  <div class="meta">
    <span class="full-date">{fmtDate(event)}</span>
    <span
      class="rel"
      class:today={rel === 'Today'}
      class:soon={rel === 'Tomorrow' || rel.startsWith('In')}
    >{rel}</span>
  </div>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 3.2rem 1fr auto;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 0.5rem;
    border-bottom: 1px solid var(--rule);
    transition: background 0.15s, padding-left 0.15s;
    border-radius: 2px;
  }
  .row:first-child { border-top: 1px solid var(--rule); }
  .row:hover {
    background: rgba(255, 255, 255, 0.018);
    padding-left: 0.85rem;
  }

  .date-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .month {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.7;
  }
  .day {
    font-family: var(--font-display);
    font-size: 1.75rem;
    line-height: 1;
    color: var(--cream);
    opacity: 0.8;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .title {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--cream);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .desc {
    font-family: var(--font-serif);
    font-size: 0.76rem;
    font-style: italic;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    flex-shrink: 0;
  }
  .full-date {
    font-family: var(--font-mono);
    font-size: 0.52rem;
    color: var(--muted);
    letter-spacing: 0.07em;
    opacity: 0.55;
  }
  .rel {
    font-family: var(--font-mono);
    font-size: 0.56rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0.12rem 0.45rem;
    border: 1px solid var(--rule);
    border-radius: 2px;
  }
  .rel.today {
    color: var(--gold-light);
    border-color: rgba(200, 146, 42, 0.3);
    background: rgba(200, 146, 42, 0.08);
  }
  .rel.soon {
    color: var(--cream);
    opacity: 0.65;
  }

  @media (max-width: 480px) {
    .row { grid-template-columns: 2.5rem 1fr; grid-template-rows: auto auto; }
    .meta { grid-column: 2; flex-direction: row; align-items: center; gap: 0.5rem; }
  }
</style>
