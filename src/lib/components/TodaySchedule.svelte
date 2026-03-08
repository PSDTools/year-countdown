<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TodaySchedule } from '$lib/types';

  interface Props {
    schedule: TodaySchedule;
  }
  let { schedule }: Props = $props();

  // Re-evaluate active period every 30 seconds so the highlight stays live
  let activePeriodIndex = $state(-1);

  function refreshActive() {
    const now = new Date();
    const todayBase = new Date(now);
    let found = -1;
    for (let i = 0; i < schedule.periods.length; i++) {
      const p = schedule.periods[i];
      const [sh, sm] = p.start.split(':').map(Number);
      const [eh, em] = p.end.split(':').map(Number);
      const start = new Date(todayBase);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(todayBase);
      end.setHours(eh, em, 0, 0);
      if (now >= start && now < end) { found = i; break; }
    }
    activePeriodIndex = found;
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;
  onMount(() => {
    refreshActive();
    intervalId = setInterval(refreshActive, 30_000);
  });
  onDestroy(() => { if (intervalId) clearInterval(intervalId); });

  /** Generate ordinal suffix for any positive integer */
  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  }
  function fmt(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  const DAY_COLORS: Record<string, string> = {
    A: '#c8922a',
    B: '#2a7ac8',
    C: '#2ac87a',
    X: '#c82a7a',
  };
  const dayColor = $derived(DAY_COLORS[schedule.dayType] ?? '#c8922a');

  /** Non-lunch periods only, for the primary list */
  const mainPeriods = $derived(schedule.periods.filter(p => !p.isLunch));
  /** Lunch periods grouped */
  const lunchPeriods = $derived(schedule.periods.filter(p => p.isLunch));
</script>

<div class="today-card">
  <!-- Badge -->
  <div class="card-header">
    <div class="day-badge" style="--day-color:{dayColor}">
      <span class="badge-letter">{schedule.dayType}</span>
      <span class="badge-label">Day</span>
    </div>
    <div class="card-meta">
      <span class="today-label">Today's Schedule</span>
      <span class="today-source">{schedule.label}</span>
    </div>
    {#if activePeriodIndex >= 0}
      {@const ap = schedule.periods[activePeriodIndex]}
      <div class="now-badge">
        <span class="now-dot"></span>
        <span>{ap.label}</span>
      </div>
    {:else}
      <div class="now-badge now-badge--idle">
        <span>No active period</span>
      </div>
    {/if}
  </div>

  <!-- Period table -->
  <div class="periods-grid">
    {#each mainPeriods as period, i}
      {@const isActive = schedule.periods.indexOf(period) === activePeriodIndex}
      <div class="period-row" class:active={isActive} style="--day-color:{dayColor}" aria-current={isActive ? 'true' : undefined}>
        <span class="p-label">{period.label}</span>
        <span class="p-time">{fmt(period.start)}<span class="p-dash"> – </span>{fmt(period.end)}</span>
        {#if isActive}
          <span class="p-now" aria-hidden="true">● NOW</span>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Lunch info strip -->
  {#if lunchPeriods.length > 0}
    <div class="lunch-strip">
      <span class="lunch-label">Lunches</span>
      <div class="lunch-times">
        {#each lunchPeriods as lp, i}
            <span class="lunch-item">
              <span class="lunch-n">{ordinal(i + 1)}</span>
              {fmt(lp.start)}–{fmt(lp.end)}
            </span>
          {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .today-card {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    overflow: hidden;
    animation: slideIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ─────────────────────────────────────────── */
  .card-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid var(--rule);
    flex-wrap: wrap;
  }

  .day-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 4px;
    background: var(--day-color, var(--gold));
    flex-shrink: 0;
    box-shadow: 0 0 22px color-mix(in srgb, var(--day-color, var(--gold)) 45%, transparent);
    animation: badgePulse 3s ease-in-out infinite;
  }
  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 18px color-mix(in srgb, var(--day-color, var(--gold)) 35%, transparent); }
    50%       { box-shadow: 0 0 32px color-mix(in srgb, var(--day-color, var(--gold)) 60%, transparent); }
  }
  .badge-letter {
    font-family: var(--font-display);
    font-size: 1.6rem;
    line-height: 1;
    color: #08080c;
  }
  .badge-label {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(8, 8, 12, 0.7);
    margin-top: -0.1rem;
  }

  .card-meta {
    flex: 1;
    min-width: 0;
  }
  .today-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.15rem;
  }
  .today-source {
    font-family: var(--font-serif);
    font-size: 0.92rem;
    font-style: italic;
    color: var(--cream);
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .now-badge {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.3rem 0.7rem;
    border: 1px solid rgba(200, 146, 42, 0.25);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold-light);
    flex-shrink: 0;
  }
  .now-badge--idle {
    color: var(--muted);
    border-color: var(--rule);
  }
  .now-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold-light);
    animation: dotBlink 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes dotBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }

  /* ── Periods grid ──────────────────────────────────── */
  .periods-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  @media (max-width: 480px) {
    .periods-grid { grid-template-columns: 1fr; }
  }

  .period-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.4rem;
    border-bottom: 1px solid var(--rule);
    transition: background 0.15s;
    position: relative;
  }
  .period-row:nth-child(odd):not(.active) {
    background: rgba(255,255,255,0.012);
  }
  .period-row.active {
    background: color-mix(in srgb, var(--day-color, var(--gold)) 9%, transparent);
    border-left: 2px solid var(--day-color, var(--gold));
  }

  .p-label {
    font-family: var(--font-serif);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--cream);
    min-width: 5rem;
    flex-shrink: 0;
  }
  .active .p-label {
    color: color-mix(in srgb, var(--day-color, var(--gold)) 80%, #f2ede4);
  }
  .p-time {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.05em;
    flex: 1;
  }
  .p-dash { opacity: 0.5; margin: 0 0.1em; }
  .p-now {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    color: var(--day-color, var(--gold));
    animation: nowPulse 1s ease-in-out infinite;
    margin-left: auto;
    flex-shrink: 0;
  }
  @keyframes nowPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* ── Lunch strip ────────────────────────────────────── */
  .lunch-strip {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.65rem 1.4rem;
    background: rgba(255, 255, 255, 0.018);
    flex-wrap: wrap;
  }
  .lunch-label {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    flex-shrink: 0;
  }
  .lunch-times {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .lunch-item {
    font-family: var(--font-mono);
    font-size: 0.58rem;
    color: var(--muted);
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .lunch-n {
    color: var(--gold);
    opacity: 0.7;
    font-size: 0.52rem;
  }
</style>
