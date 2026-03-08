<script lang="ts">
  interface Props {
    schoolDays: number;
  }

  let { schoolDays }: Props = $props();
</script>

<div class="school-days-card">
  <div class="school-days-icon">🏫</div>
  <div class="school-days-content">
    <div class="school-days-number">{schoolDays}</div>
    <div class="school-days-label">School Days Remaining</div>
    <div class="school-days-note">Based on bell schedule calendar</div>
  </div>
</div>

<style>
  .school-days-card {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: white;
    border-radius: var(--radius);
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: var(--shadow);
    transition: box-shadow 0.2s;
  }

  .school-days-card:hover {
    box-shadow: var(--shadow-hover);
  }

  .school-days-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .school-days-content {
    flex: 1;
  }

  .school-days-number {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .school-days-label {
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.95;
    margin-top: 0.2rem;
  }

  .school-days-note {
    font-size: 0.78rem;
    opacity: 0.7;
    margin-top: 0.15rem;
  }
</style>
