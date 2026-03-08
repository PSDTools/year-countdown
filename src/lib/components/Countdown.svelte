<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { calculateCountdown, pad, formatDate } from '$lib/utils/countdown';
  import type { CountdownData } from '$lib/types';

  interface Props {
    targetDate: Date;
    label: string;
    subtitle?: string;
    accent?: boolean;
  }

  let { targetDate, label, subtitle, accent = false }: Props = $props();

  let countdown = $state<CountdownData>({
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: false
  });
  let interval: ReturnType<typeof setInterval> | null = null;

  function update() { countdown = calculateCountdown(targetDate); }

  onMount(() => { update(); interval = setInterval(update, 1000); });
  onDestroy(() => { if (interval) clearInterval(interval); });
</script>

<div class="card" class:accent>
  <div class="card-top">
    <div class="card-label">{label}</div>
    {#if subtitle}
      <div class="card-sub">{subtitle}</div>
    {/if}
    <div class="card-date">{formatDate(targetDate)}</div>
  </div>

  {#if countdown.isPast}
    <div class="card-past">Event passed</div>
  {:else}
    <div class="units">
      <div class="unit">
        {#key countdown.days}
          <span class="val flip">{countdown.days}</span>
        {/key}
        <span class="lbl">{countdown.days === 1 ? 'Day' : 'Days'}</span>
      </div>
      <span class="sep" aria-hidden="true">:</span>
      <div class="unit">
        {#key countdown.hours}
          <span class="val flip">{pad(countdown.hours)}</span>
        {/key}
        <span class="lbl">Hrs</span>
      </div>
      <span class="sep" aria-hidden="true">:</span>
      <div class="unit">
        {#key countdown.minutes}
          <span class="val flip">{pad(countdown.minutes)}</span>
        {/key}
        <span class="lbl">Min</span>
      </div>
      <span class="sep" aria-hidden="true">:</span>
      <div class="unit">
        {#key countdown.seconds}
          <span class="val flip">{pad(countdown.seconds)}</span>
        {/key}
        <span class="lbl">Sec</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-top: 2px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
    transition: background 0.2s, border-top-color 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }
  .card:hover {
    background: var(--surface-hover);
    border-top-color: rgba(200, 146, 42, 0.4);
    box-shadow: 0 0 24px rgba(200, 146, 42, 0.06);
  }
  .card.accent {
    border-top-color: var(--gold);
    background: rgba(200, 146, 42, 0.04);
  }

  .card-top { margin-bottom: 1rem; }

  .card-label {
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 600;
    color: var(--cream);
    margin-bottom: 0.15rem;
    line-height: 1.3;
  }
  .accent .card-label { color: var(--gold-light); }

  .card-sub {
    font-family: var(--font-serif);
    font-size: 0.8rem;
    font-style: italic;
    color: var(--muted);
    margin-bottom: 0.1rem;
  }
  .card-date {
    font-family: var(--font-mono);
    font-size: 0.58rem;
    color: var(--muted);
    letter-spacing: 0.07em;
    opacity: 0.65;
  }

  .units {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 2.8rem;
  }
  .val {
    font-family: var(--font-display);
    font-size: 2.1rem;
    line-height: 0.9;
    color: var(--cream);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    display: block;
  }
  .accent .val { color: var(--gold-light); }
  .lbl {
    font-family: var(--font-mono);
    font-size: 0.48rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-top: 0.2rem;
  }
  .sep {
    font-family: var(--font-display);
    font-size: 1.4rem;
    color: rgba(255, 255, 255, 0.1);
    align-self: flex-start;
    margin-top: 0.05rem;
    line-height: 1;
    flex-shrink: 0;
  }
  .card-past {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--muted);
    font-size: 0.9rem;
  }

  /* Flip-in animation when digits update */
  .flip {
    animation: flipCard 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes flipCard {
    from { transform: translateY(-12px) scaleY(0.65); opacity: 0; }
    to   { transform: translateY(0)     scaleY(1);    opacity: 1; }
  }
</style>
