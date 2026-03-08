<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import '../app.css';
  import Countdown from '$lib/components/Countdown.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import TodaySchedule from '$lib/components/TodaySchedule.svelte';
  import type { PageData } from './$types';
  import { calculateCountdown, pad, formatDate } from '$lib/utils/countdown';
  import type { CountdownData, CalendarEvent } from '$lib/types';

  interface Props { data: PageData; }
  let { data }: Props = $props();

  const calendar = $derived(data.calendar);
  const error = $derived(data.error);
  const schoolName = 'Pattonville High School';
  const currentYear = new Date().getFullYear();
  // School year: Aug–Dec shows currentYear–(+1), Jan–Jul shows (−1)–currentYear
  const now = new Date();
  const schoolYearStart = now.getMonth() >= 7 ? currentYear : currentYear - 1;

  // ── Phase: 'countdown' → 'celebrating' → 'next-year' ──
  type Phase = 'countdown' | 'celebrating' | 'next-year';
  let phase = $state<Phase>('countdown');
  let nextYearTarget = $state<CalendarEvent | null>(null);

  // ── Hero countdown state ───────────────────────────────
  let heroCountdown = $state<CountdownData>({
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: false
  });

  // ── Active countdown target (switches to next-year after celebration) ──
  const activeTarget = $derived<CalendarEvent | null>(
    phase === 'next-year' && nextYearTarget
      ? nextYearTarget
      : phase === 'countdown' || phase === 'celebrating'
        ? (calendar?.lastDayOfSchool ?? null)
        : null
  );

  // ── Urgency level (drives CSS animations) ─────────────
  const urgency = $derived((() => {
    if (heroCountdown.isPast) return 'past';
    if (heroCountdown.days <= 3)  return 'critical';
    if (heroCountdown.days <= 7)  return 'urgent';
    if (heroCountdown.days <= 30) return 'soon';
    return 'normal';
  })());

  // ── Countdown interval ─────────────────────────────────
  $effect(() => {
    const lastDay = activeTarget;
    if (!lastDay) return;
    const target: Date = lastDay.start;
    function tick() { heroCountdown = calculateCountdown(target); }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });

  // ── Trigger explosion when countdown hits zero ─────────
  $effect(() => {
    if (heroCountdown.isPast && phase === 'countdown') {
      phase = 'celebrating';
      launchConfetti();
      setTimeout(() => {
        phase = 'next-year';
        computeNextYear();
      }, 7000);
    }
  });

  // ── Compute the "next year" target date ────────────────
  function computeNextYear() {
    const cal = calendar;
    if (cal?.events.length) {
      const keywords = ['last day', 'end of school', 'graduation', 'school ends', 'end of year'];
      const found = cal.events.find(
        e => keywords.some(kw => e.summary.toLowerCase().includes(kw)) && e.start > new Date()
      );
      if (found) { nextYearTarget = found; return; }
    }
    // Fallback: approx. last day of next school year (around May 22)
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setMonth(4);  // May
    d.setDate(22);  // typical last-day-of-school date
    d.setHours(15, 0, 0, 0); // 3 PM — after school hours
    nextYearTarget = { id: 'next-year-fallback', summary: 'Last Day for Students',
      start: d, end: d, allDay: true };
  }

  // ── Ambient CSS dots (random, client-only, no SSR jitter risk) ──
  const dots = Array.from({ length: 24 }, () => ({
    x:     +(Math.random() * 100).toFixed(1),
    size:  +(Math.random() * 2.5 + 0.8).toFixed(1),
    dur:   +(Math.random() * 18 + 12).toFixed(1),
    delay: +(Math.random() * -30).toFixed(1),
    opac:  +(Math.random() * 0.18 + 0.04).toFixed(2),
    drift: Math.round((Math.random() - 0.5) * 100),
  }));

  // ── Confetti canvas ────────────────────────────────────
  let confettiCanvas: HTMLCanvasElement | undefined = $state();

  function launchConfetti() {
    const canvas = confettiCanvas;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const COLORS = [
      '#e8b14e','#c8922a','#ffd166','#f2ede4',
      '#e74c3c','#27ae60','#2980b9','#9b59b6','#ff6b6b','#74b9ff'
    ];

    interface CP {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number;
      rot: number; rotV: number;
      gravity: number; op: number; decay: number;
      shape: 'rect' | 'circle';
    }
    let parts: CP[] = [];

    function burst(cx: number, cy: number, n: number) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 24 + 6;
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - Math.random() * 14,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size:  Math.random() * 10 + 4,
          rot:   Math.random() * 360,
          rotV:  (Math.random() - 0.5) * 16,
          gravity: 0.45, op: 1,
          decay: Math.random() * 0.009 + 0.004,
          shape: Math.random() < 0.55 ? 'rect' : 'circle',
        });
      }
    }

    const W = canvas.width, H = canvas.height;
    // Staggered bursts across screen
    [
      [W*0.15, H*0.4], [W*0.35, H*0.3], [W*0.5, H*0.22],
      [W*0.65, H*0.3], [W*0.85, H*0.4],
      [W*0.25, H*0.58],[W*0.75, H*0.58],
    ].forEach(([x,y],i) => setTimeout(() => burst(x, y, 60), i * 110));

    // Continuous rain from top
    const spawnId = setInterval(() => {
      for (let i = 0; i < 7; i++) {
        parts.push({
          x: Math.random() * W, y: -10,
          vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 3,
          rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8,
          gravity: 0.06, op: 1,
          decay: Math.random() * 0.004 + 0.002,
          shape: Math.random() < 0.55 ? 'rect' : 'circle',
        });
      }
    }, 35);

    let rafId: number;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(p => p.op > 0 && p.y < H + 60);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity; p.vx *= 0.993;
        p.rot += p.rotV; p.op -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.op);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size * 0.28, p.size, p.size * 0.56);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    setTimeout(() => clearInterval(spawnId), 3500);
    setTimeout(() => { cancelAnimationFrame(rafId); ctx.clearRect(0,0,W,H); }, 9000);
  }
</script>

<svelte:head>
  <title>School Countdown — {schoolName}</title>
  <meta name="description" content="Live countdown to the last day of school for {schoolName}." />
</svelte:head>

<!-- ─── Ambient floating gold dots ──────────────────────── -->
<div class="ambient" aria-hidden="true">
  {#each dots as d}
    <span class="dot" style="
      left:{d.x}%;
      width:{d.size}px; height:{d.size}px;
      --dur:{d.dur}s; --delay:{d.delay}s;
      --opac:{d.opac}; --drift:{d.drift}px;
    "></span>
  {/each}
</div>

<!-- ─── Confetti canvas ─────────────────────────────────── -->
<canvas bind:this={confettiCanvas} class="confetti-canvas" aria-hidden="true"></canvas>

<!-- ─── Celebration overlay ────────────────────────────── -->
{#if phase === 'celebrating'}
  <div class="cel-overlay">
    <!-- Shockwave ring -->
    <div class="shockwave" aria-hidden="true"></div>
    <div class="cel-inner">
      <span class="cel-emoji">🎓</span>
      <div class="cel-title">SCHOOL'S OUT!</div>
      <div class="cel-sub">Have an incredible summer — you earned it.</div>
    </div>
  </div>
{/if}

<!-- ─── Header ──────────────────────────────────────────── -->
<header class="site-header anim-rise">
  <div class="container header-row">
    <span class="h-rule"></span>
    <span class="h-name">{schoolName}</span>
    <span class="h-dot" aria-hidden="true">·</span>
    <span class="h-year">{schoolYearStart}–{schoolYearStart + 1}</span>
    <span class="h-rule"></span>
  </div>
</header>

<main>
  <div class="container">

    {#if error}
      <div class="error-banner anim-rise">
        <span aria-hidden="true">⚠</span>
        <div>
          <strong>Calendar Unavailable</strong>
          <p>{error}</p>
        </div>
      </div>
    {/if}

    {#if !calendar && !error}
      <div class="loading">
        <div class="loading-ring"></div>
        <span>Loading calendar…</span>
      </div>
    {/if}

    {#if calendar && phase !== 'celebrating'}
      <!-- ─── HERO ─────────────────────────────────────── -->
      {#if activeTarget}
        <section class="hero anim-rise" data-urgency={urgency}>
          <!-- Eyebrow label -->
          <div class="hero-eyebrow">
            <span class="e-rule"></span>
            <span class="e-text">
              {phase === 'next-year' ? 'NEXT YEAR COUNTDOWN' : activeTarget.summary}
            </span>
            <span class="e-rule"></span>
          </div>

          <!-- Target date -->
          <div class="hero-date anim-rise delay-2">{formatDate(activeTarget.start)}</div>

          <!-- Countdown digits or "Past" state -->
          {#if heroCountdown.isPast}
            <div class="countdown-past">SCHOOL'S OUT! 🎉</div>
          {:else}
            <div class="countdown-wrap anim-rise delay-3">
              <!-- Dominant DAYS block -->
              <div class="days-block">
                <div class="days-digit-wrap" class:tremble={urgency === 'critical'}>
                  {#key heroCountdown.days}
                    <span class="digit-days flip-big">{heroCountdown.days}</span>
                  {/key}
                </div>
                <span class="unit-lbl">Days</span>
              </div>

              <!-- Vertical rule separator -->
              <div class="v-rule" aria-hidden="true"></div>

              <!-- HRS : MIN : SEC -->
              <div class="hms-block">
                <div class="hms-unit">
                  {#key heroCountdown.hours}
                    <span class="digit-hms flip-sm">{pad(heroCountdown.hours)}</span>
                  {/key}
                  <span class="hms-lbl">Hrs</span>
                </div>
                <span class="hms-colon" aria-hidden="true">:</span>
                <div class="hms-unit">
                  {#key heroCountdown.minutes}
                    <span class="digit-hms flip-sm">{pad(heroCountdown.minutes)}</span>
                  {/key}
                  <span class="hms-lbl">Min</span>
                </div>
                <span class="hms-colon" aria-hidden="true">:</span>
                <div class="hms-unit">
                  {#key heroCountdown.seconds}
                    <span class="digit-hms digit-sec flip-sm">{pad(heroCountdown.seconds)}</span>
                  {/key}
                  <span class="hms-lbl">Sec</span>
                </div>
              </div>
            </div>

            <!-- School days strip -->
            {#if calendar.schoolDaysRemaining > 0 && phase === 'countdown'}
              <div class="days-strip anim-rise delay-4">
                <span class="strip-diamond" aria-hidden="true">◆</span>
                <strong class="strip-count">{calendar.schoolDaysRemaining}</strong>
                <span class="strip-label">attendance days remaining</span>
                <span class="strip-diamond" aria-hidden="true">◆</span>
              </div>
            {/if}
          {/if}
        </section>
      {/if}

      <!-- ─── Today's bell schedule ───────────────────── -->
      {#if calendar.todaySchedule && phase === 'countdown'}
        <section class="section anim-rise delay-5">
          <h2 class="section-heading"><span>Today's Bell Schedule</span></h2>
          <TodaySchedule schedule={calendar.todaySchedule} />
        </section>
      {/if}

      <!-- ─── Secondary countdowns ───────────────────── -->
      {#if calendar.lastDayOfSchool && phase === 'countdown'}
        {@const secondary = calendar.events
          .filter(e => e.id !== calendar.lastDayOfSchool!.id)
          .slice(0, 3)}
        {#if secondary.length > 0}
          <section class="section anim-rise delay-6">
            <h2 class="section-heading"><span>Upcoming Countdowns</span></h2>
            <div class="card-grid">
              {#each secondary as event (event.id)}
                <Countdown targetDate={event.start} label={event.summary} />
              {/each}
            </div>
          </section>
        {/if}
      {/if}

      <!-- ─── Events list ──────────────────────────────── -->
      {#if calendar.events.length > 0}
        <section class="section anim-rise delay-7">
          <h2 class="section-heading"><span>School Calendar</span></h2>
          <div class="events-list">
            {#each calendar.events as event (event.id)}
              <EventCard {event} />
            {/each}
          </div>
        </section>
      {:else}
        <div class="empty">No upcoming events found in the next 60 days.</div>
      {/if}

      <p class="fetch-note">
        Updated {calendar.fetchedAt.toLocaleTimeString()} ·
        <button class="refresh-btn" onclick={() => location.reload()}>refresh</button>
      </p>
    {/if}

  </div>
</main>

<footer class="site-footer">
  <div class="container footer-row">
    <p>
      Calendar via
      <a href="https://phs.psdr3.org" target="_blank" rel="noopener">PHS Calendar</a>
      &amp;
      <a href="https://calendar.google.com" target="_blank" rel="noopener">Google Calendar</a>
    </p>
  </div>
</footer>

<style>
  /* ─── Ambient floating dots ───────────────────────────── */
  .ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .dot {
    position: absolute;
    bottom: -10px;
    border-radius: 50%;
    background: var(--gold);
    animation: floatUp var(--dur, 15s) ease-in infinite var(--delay, 0s);
  }
  @keyframes floatUp {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    5%   { opacity: var(--opac, 0.1); }
    95%  { opacity: var(--opac, 0.1); }
    100% { transform: translateY(calc(-100vh - 20px)) translateX(var(--drift, 0px)); opacity: 0; }
  }

  /* ─── Confetti canvas ─────────────────────────────────── */
  .confetti-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 90;
    width: 100%;
    height: 100%;
  }

  /* ─── Celebration overlay ─────────────────────────────── */
  .cel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 12, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 95;
    animation: fadeIn 0.4s ease both;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .shockwave {
    position: absolute;
    top: 50%; left: 50%;
    width: 120px; height: 120px;
    border-radius: 50%;
    border: 4px solid var(--gold-bright);
    transform: translate(-50%, -50%) scale(0);
    animation: shockwave 1s cubic-bezier(0.2, 0.8, 0.4, 1) 0.05s forwards;
    pointer-events: none;
  }
  @keyframes shockwave {
    0%   { transform: translate(-50%, -50%) scale(0);  opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(22); opacity: 0; }
  }

  .cel-inner {
    text-align: center;
    padding: 2rem;
    position: relative;
    z-index: 1;
  }
  .cel-emoji {
    font-size: clamp(3.5rem, 10vw, 7rem);
    display: block;
    margin-bottom: 0.75rem;
    animation: bounce 0.55s ease-in-out infinite alternate;
  }
  @keyframes bounce {
    from { transform: translateY(0) scale(1); }
    to   { transform: translateY(-22px) scale(1.08); }
  }
  .cel-title {
    font-family: var(--font-display);
    font-size: clamp(3.5rem, 15vw, 13rem);
    line-height: 0.88;
    letter-spacing: 0.04em;
    animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both,
               rainbow 2s linear 0.7s infinite;
    text-shadow: 0 0 80px rgba(255, 209, 102, 0.5);
  }
  @keyframes popIn {
    from { transform: scale(0.25) rotate(-6deg); opacity: 0; }
    to   { transform: scale(1) rotate(0deg);     opacity: 1; }
  }
  @keyframes rainbow {
    0%   { color: var(--gold-bright); }
    20%  { color: #ff6b6b; }
    40%  { color: #4ecb71; }
    60%  { color: #74b9ff; }
    80%  { color: #fd79a8; }
    100% { color: var(--gold-bright); }
  }
  .cel-sub {
    font-family: var(--font-serif);
    font-size: clamp(1rem, 2.5vw, 1.6rem);
    font-style: italic;
    color: var(--cream);
    opacity: 0.8;
    margin-top: 1rem;
    animation: fadeInUp 0.5s ease 0.55s both;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 0.8; transform: translateY(0); }
  }

  /* ─── Header ──────────────────────────────────────────── */
  .site-header {
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--rule);
    position: relative;
    z-index: 2;
  }
  .header-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
  }
  .h-rule {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--rule));
  }
  .h-rule:last-child {
    background: linear-gradient(to left, transparent, var(--rule));
  }
  .h-name {
    font-family: var(--font-serif);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-style: italic;
    color: var(--cream);
    white-space: nowrap;
  }
  .h-dot { color: var(--gold); font-size: 0.85rem; }
  .h-year {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    white-space: nowrap;
  }

  /* ─── Hero ────────────────────────────────────────────── */
  .hero {
    padding: 4rem 0 2.5rem;
    text-align: center;
    position: relative;
  }
  /* Subtle CRT scanlines over hero */
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.035) 2px,
      rgba(0, 0, 0, 0.035) 4px
    );
    pointer-events: none;
    z-index: 0;
  }
  .hero > * { position: relative; z-index: 1; }

  /* ── Urgency escalation ───── */
  .hero[data-urgency='soon'] .digit-days {
    animation: pulseGold 2s ease-in-out infinite;
  }
  .hero[data-urgency='urgent'] .digit-days {
    color: #ff8c42;
    text-shadow: 0 0 80px rgba(255, 100, 40, 0.45), 0 4px 20px rgba(0,0,0,0.5);
    animation: pulseUrgent 0.9s ease-in-out infinite;
  }
  .hero[data-urgency='critical'] .digit-days {
    color: var(--urgent);
    text-shadow: 0 0 100px rgba(224, 85, 48, 0.7), 0 4px 20px rgba(0,0,0,0.5);
    animation: pulseUrgent 0.35s ease-in-out infinite;
  }
  .tremble {
    animation: tremble 0.12s ease-in-out infinite !important;
  }
  @keyframes tremble {
    0%, 100% { transform: translate(0,      0); }
    25%       { transform: translate(-3px, 1px); }
    75%       { transform: translate( 3px,-1px); }
  }

  /* Eyebrow */
  .hero-eyebrow {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 0.75rem;
  }
  .e-rule {
    flex: 1;
    max-width: 100px;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(200, 146, 42, 0.3));
  }
  .e-rule:last-child {
    background: linear-gradient(to left, transparent, rgba(200, 146, 42, 0.3));
  }
  .e-text {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
  }

  .hero-date {
    font-family: var(--font-serif);
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    font-style: italic;
    color: var(--muted);
    margin-bottom: 3rem;
  }

  /* ── Countdown layout ──────── */
  .countdown-wrap {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: clamp(1.5rem, 4vw, 4rem);
    margin-bottom: 2.5rem;
  }
  .days-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .days-digit-wrap {
    overflow: hidden;
    position: relative;
  }
  .digit-days {
    font-family: var(--font-display);
    font-size: clamp(6.5rem, 22vw, 20rem);
    line-height: 0.88;
    color: var(--gold-light);
    text-shadow:
      0 0 80px rgba(200, 146, 42, 0.25),
      0 4px 20px rgba(0, 0, 0, 0.5);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    display: block;
    animation: pulseGold 4s ease-in-out infinite;
  }
  .v-rule {
    width: 1px;
    height: 8rem;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(255, 255, 255, 0.07),
      transparent
    );
    flex-shrink: 0;
    margin-bottom: 2.5rem;
  }
  .hms-block {
    display: flex;
    align-items: flex-end;
    gap: clamp(0.3rem, 1vw, 0.7rem);
    padding-bottom: 0.35rem;
  }
  .hms-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }
  .digit-hms {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 7vw, 6.5rem);
    line-height: 0.88;
    color: var(--cream);
    opacity: 0.85;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    display: block;
  }
  .hms-colon {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 5vw, 4.5rem);
    color: rgba(255, 255, 255, 0.12);
    padding-bottom: 1.8rem;
    flex-shrink: 0;
    line-height: 1;
  }
  .unit-lbl, .hms-lbl {
    font-family: var(--font-mono);
    font-size: 0.52rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── Digit flip animations ─── */
  .flip-big {
    animation: flipBig 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .flip-sm {
    animation: flipSm 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes flipBig {
    from { transform: translateY(-32px) scaleY(0.45); opacity: 0; }
    to   { transform: translateY(0)     scaleY(1);    opacity: 1; }
  }
  @keyframes flipSm {
    from { transform: translateY(-16px) scaleY(0.55); opacity: 0; }
    to   { transform: translateY(0)     scaleY(1);    opacity: 0.85; }
  }

  /* ── Glow pulses ─────────── */
  @keyframes pulseGold {
    0%, 100% { text-shadow: 0 0 60px rgba(200,146,42,0.2), 0 4px 20px rgba(0,0,0,0.5); }
    50%       { text-shadow: 0 0 130px rgba(200,146,42,0.55), 0 0 40px rgba(232,177,78,0.3), 0 4px 20px rgba(0,0,0,0.5); }
  }
  @keyframes pulseUrgent {
    0%, 100% { text-shadow: 0 0 60px rgba(224,85,48,0.3), 0 4px 20px rgba(0,0,0,0.5); }
    50%       { text-shadow: 0 0 140px rgba(224,85,48,0.85), 0 0 50px rgba(224,85,48,0.45), 0 4px 20px rgba(0,0,0,0.5); }
  }

  /* School days strip */
  .days-strip {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.55rem 1.75rem;
    border: 1px solid rgba(200, 146, 42, 0.2);
    border-radius: 2px;
    background: rgba(200, 146, 42, 0.04);
    animation: stripPulse 3s ease-in-out infinite;
  }
  @keyframes stripPulse {
    0%, 100% { box-shadow: 0 0 0   rgba(200,146,42,0); }
    50%       { box-shadow: 0 0 18px rgba(200,146,42,0.18); }
  }
  .strip-diamond { color: var(--gold); font-size: 0.45rem; opacity: 0.7; }
  .strip-count {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--cream);
    line-height: 1;
    letter-spacing: 0.05em;
  }
  .strip-label {
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .countdown-past {
    font-family: var(--font-serif);
    font-size: clamp(2rem, 6vw, 4rem);
    font-style: italic;
    color: var(--gold-light);
    padding: 4rem 0;
  }

  /* Mobile countdown */
  @media (max-width: 600px) {
    .hero { padding: 2.5rem 0 1.5rem; }
    .countdown-wrap {
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .v-rule {
      width: 60%;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent);
      margin-bottom: 0;
    }
    .hms-block { gap: 0.25rem; }
  }

  /* ─── Page-load animations ────────────────────────────── */
  .anim-rise { animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.4s; }
  .delay-4 { animation-delay: 0.6s; }
  .delay-5 { animation-delay: 0.8s; }
  .delay-6 { animation-delay: 1s;   }
  .delay-7 { animation-delay: 1.2s; }
  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ─── Sections ────────────────────────────────────────── */
  .section {
    padding: 2rem 0;
    border-top: 1px solid var(--rule);
  }
  .section-heading {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
    font-family: var(--font-mono);
    font-size: 0.58rem;
    font-weight: 400;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .section-heading::before,
  .section-heading::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--rule);
  }
  .section-heading span { white-space: nowrap; }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  .events-list { display: flex; flex-direction: column; }

  /* ─── States ──────────────────────────────────────────── */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 6rem 1rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
  }
  .loading-ring {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid var(--rule);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: rgba(192, 57, 43, 0.07);
    border: 1px solid rgba(192, 57, 43, 0.25);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin: 2rem 0;
    font-family: var(--font-serif);
    color: var(--cream);
  }
  .error-banner strong { color: #e74c3c; display: block; margin-bottom: 0.2rem; }
  .error-banner p { font-size: 0.875rem; color: var(--muted); }

  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .fetch-note {
    text-align: right;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.05em;
    padding: 1.5rem 0 2rem;
    opacity: 0.55;
  }
  .refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .refresh-btn:hover { color: var(--gold-light); }

  /* ─── Footer ──────────────────────────────────────────── */
  .site-footer {
    border-top: 1px solid var(--rule);
    padding: 1.5rem 0;
    position: relative;
    z-index: 2;
  }
  .footer-row {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--muted);
    letter-spacing: 0.07em;
  }
  .footer-row a { color: var(--gold); opacity: 0.65; }
  .footer-row a:hover { opacity: 1; }
</style>
