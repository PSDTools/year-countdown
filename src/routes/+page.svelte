<script lang="ts">
  import '../app.css';
  import Countdown from '$lib/components/Countdown.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import SchoolDaysCounter from '$lib/components/SchoolDaysCounter.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const calendar = $derived(data.calendar);
  const error = $derived(data.error);
  const schoolName = 'Parkway High School';
  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>School Countdown — {schoolName}</title>
  <meta name="description" content="Live countdown to the last day of school and upcoming events for {schoolName}." />
</svelte:head>

<header class="site-header">
  <div class="container">
    <div class="header-content">
      <div class="header-logo">🎓</div>
      <div>
        <h1 class="header-title">{schoolName}</h1>
        <p class="header-subtitle">School Year Countdown — {currentYear}</p>
      </div>
    </div>
  </div>
</header>

<main class="main-content">
  <div class="container">

    {#if error}
      <div class="error-banner">
        <span class="error-icon">⚠️</span>
        <div>
          <strong>Calendar Unavailable</strong>
          <p>{error}</p>
        </div>
      </div>
    {/if}

    {#if !calendar && !error}
      <div class="loading-section">
        <div class="loading-spinner"></div>
        <p>Loading calendar data…</p>
      </div>
    {/if}

    {#if calendar}
      <!-- School Days Remaining -->
      {#if calendar.schoolDaysRemaining > 0}
        <section class="section">
          <SchoolDaysCounter schoolDays={calendar.schoolDaysRemaining} />
        </section>
      {/if}

      <!-- Main Countdowns -->
      {#if calendar.lastDayOfSchool}
        <section class="section">
          <h2 class="section-title">⏱️ Countdowns</h2>
          <div class="countdown-grid">
            <Countdown
              targetDate={calendar.lastDayOfSchool.start}
              label="Last Day of School"
              subtitle={calendar.lastDayOfSchool.summary}
              accent={true}
            />
            {#each calendar.events.slice(0, 2) as event (event.id)}
              {#if event.id !== calendar.lastDayOfSchool?.id}
                <Countdown
                  targetDate={event.start}
                  label={event.summary}
                />
              {/if}
            {/each}
          </div>
        </section>
      {:else if calendar.events.length > 0}
        <section class="section">
          <h2 class="section-title">⏱️ Upcoming Events</h2>
          <div class="countdown-grid">
            {#each calendar.events.slice(0, 3) as event (event.id)}
              <Countdown
                targetDate={event.start}
                label={event.summary}
              />
            {/each}
          </div>
        </section>
      {/if}

      <!-- Upcoming Events List -->
      {#if calendar.events.length > 0}
        <section class="section">
          <h2 class="section-title">📅 Upcoming Events</h2>
          <div class="events-list">
            {#each calendar.events as event (event.id)}
              <EventCard {event} />
            {/each}
          </div>
        </section>
      {:else}
        <div class="empty-state">
          <p>No upcoming events found in the next 60 days.</p>
        </div>
      {/if}

      <p class="fetch-note">
        Data fetched at {calendar.fetchedAt.toLocaleTimeString()}. Refresh the page to update.
      </p>
    {/if}

  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <p>
      Calendar data from <a href="https://phs.psdr3.org" target="_blank" rel="noopener">PHS School Calendar</a>
      and <a href="https://calendar.google.com" target="_blank" rel="noopener">Google Calendar</a>.
    </p>
  </div>
</footer>

<style>
  .site-header {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary));
    color: white;
    padding: 1.5rem 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-logo {
    font-size: 2.5rem;
    line-height: 1;
  }

  .header-title {
    font-size: 1.6rem;
    color: white;
    margin: 0;
  }

  .header-subtitle {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 0.15rem;
  }

  .main-content {
    padding: 2rem 0 3rem;
    min-height: calc(100vh - 200px);
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-size: 1.25rem;
    color: var(--primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--border);
  }

  .countdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: #fff3e0;
    border: 1px solid #ffe0b2;
    border-left: 4px solid var(--accent);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
  }

  .error-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .error-banner strong {
    display: block;
    color: var(--warning);
    margin-bottom: 0.25rem;
  }

  .error-banner p {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .loading-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 1rem;
    color: var(--text-secondary);
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }

  .fetch-note {
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-align: right;
    margin-top: 1rem;
  }

  .site-footer {
    background: var(--primary-dark);
    color: rgba(255, 255, 255, 0.7);
    padding: 1.25rem 0;
    font-size: 0.85rem;
    text-align: center;
  }

  .site-footer a {
    color: rgba(255,255,255,0.9);
  }
</style>
