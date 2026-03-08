<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { calculateCountdown, pad, formatDate } from '$lib/utils/countdown';
  import type { CountdownData } from '$lib/types';

  interface Props {
    targetDate: Date;
    label: string;
    subtitle?: string;
    accent?: boolean;
  }

  let { targetDate, label, subtitle, accent = false }: Props = $props();

  let countdown: CountdownData = $state<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isPast: false
  });
  let interval: ReturnType<typeof setInterval> | null = null;

  function update() {
    countdown = calculateCountdown(targetDate);
  }

  onMount(() => {
    update();
    interval = setInterval(update, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="countdown-card" class:accent>
  <div class="countdown-label">{label}</div>
  {#if subtitle}
    <div class="countdown-subtitle">{subtitle}</div>
  {/if}
  <div class="countdown-date">{formatDate(targetDate)}</div>

  {#if countdown.isPast}
    <div class="countdown-past">This event has passed!</div>
  {:else}
    <div class="countdown-units">
      <div class="unit">
        <span class="unit-value">{countdown.days}</span>
        <span class="unit-label">{countdown.days === 1 ? 'Day' : 'Days'}</span>
      </div>
      <div class="separator">:</div>
      <div class="unit">
        <span class="unit-value">{pad(countdown.hours)}</span>
        <span class="unit-label">Hours</span>
      </div>
      <div class="separator">:</div>
      <div class="unit">
        <span class="unit-value">{pad(countdown.minutes)}</span>
        <span class="unit-label">Min</span>
      </div>
      <div class="separator">:</div>
      <div class="unit">
        <span class="unit-value">{pad(countdown.seconds)}</span>
        <span class="unit-label">Sec</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .countdown-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
    border-top: 4px solid var(--primary);
    transition: box-shadow 0.2s;
  }

  .countdown-card:hover {
    box-shadow: var(--shadow-hover);
  }

  .countdown-card.accent {
    border-top-color: var(--accent);
    background: linear-gradient(135deg, #fff8f0, #ffffff);
  }

  .countdown-label {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 0.25rem;
  }

  .accent .countdown-label {
    color: var(--accent);
  }

  .countdown-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .countdown-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .countdown-units {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 3.5rem;
  }

  .unit-value {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--primary-dark);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .accent .unit-value {
    color: var(--warning);
  }

  .unit-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }

  .separator {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--border);
    align-self: flex-start;
    margin-top: 0.1rem;
    line-height: 1;
  }

  .countdown-past {
    font-size: 1.1rem;
    color: var(--text-secondary);
    font-style: italic;
  }
</style>
