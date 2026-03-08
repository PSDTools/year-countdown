<script lang="ts">
  import { formatRelativeDate } from '$lib/utils/countdown';
  import type { CalendarEvent } from '$lib/types';

  interface Props {
    event: CalendarEvent;
  }

  let { event }: Props = $props();

  const relativeDate = $derived(formatRelativeDate(event.start));

  function formatEventDate(event: CalendarEvent): string {
    if (event.allDay) {
      return event.start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    return event.start.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
</script>

<div class="event-card">
  <div class="event-date-badge">
    <span class="event-month">
      {event.start.toLocaleDateString('en-US', { month: 'short' })}
    </span>
    <span class="event-day">
      {event.start.getDate()}
    </span>
  </div>
  <div class="event-content">
    <div class="event-title">{event.summary}</div>
    <div class="event-meta">
      <span class="event-full-date">{formatEventDate(event)}</span>
      <span class="event-relative" class:today={relativeDate === 'Today'} class:tomorrow={relativeDate === 'Tomorrow'}>
        {relativeDate}
      </span>
    </div>
    {#if event.description}
      <div class="event-description">{event.description}</div>
    {/if}
    {#if event.location}
      <div class="event-location">📍 {event.location}</div>
    {/if}
  </div>
</div>

<style>
  .event-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transition: box-shadow 0.2s, transform 0.2s;
    border-left: 3px solid var(--primary-light);
  }

  .event-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-1px);
  }

  .event-date-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 3rem;
    background: var(--primary);
    color: white;
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    flex-shrink: 0;
  }

  .event-month {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.9;
  }

  .event-day {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1;
  }

  .event-content {
    flex: 1;
    min-width: 0;
  }

  .event-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text);
    margin-bottom: 0.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-meta {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .event-full-date {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .event-relative {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--primary-light);
    background: rgba(57, 73, 171, 0.1);
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
  }

  .event-relative.today {
    color: var(--success);
    background: rgba(46, 125, 50, 0.1);
  }

  .event-relative.tomorrow {
    color: var(--warning);
    background: rgba(230, 81, 0, 0.1);
  }

  .event-description {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.35rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .event-location {
    font-size: var(--font-size-small);
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
</style>
