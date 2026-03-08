# Year Countdown

A SvelteKit application that tracks school events and remaining school days by integrating with two ICS calendars from Parkway High School.

## Features

- 🎓 **Live Countdowns** — Real-time countdowns to the last day of school and upcoming events
- 📅 **School Days Counter** — Actual school days remaining based on the bell schedule calendar
- 📋 **Event List** — Upcoming events from the school calendar
- 📱 **Responsive Design** — Works on all devices
- ⚡ **Auto-updating** — Countdown timers update every second

## Calendars Used

- **Main Events**: [PHS School Calendar](https://phs.psdr3.org/calendar/calendar_362.ics)
- **Bell Schedule**: [Google Calendar (Bell Schedule)](https://calendar.google.com/calendar/ical/c_ihdnrdu2e4s0d01qeinmvbjms4%40group.calendar.google.com/public/basic.ics)

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```sh
npm install
```

### Development

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```sh
npm run build
```

The static output will be in the `build/` directory.

### Preview

```sh
npm run preview
```

## Deployment

This project uses `@sveltejs/adapter-static` to generate a fully static site.

### GitHub Pages

Add a GitHub Actions workflow that runs `npm run build` and deploys the `build/` folder.

Set the `BASE_PATH` environment variable if deploying to a subdirectory:

```sh
BASE_PATH=/year-countdown npm run build
```

### Vercel / Netlify

The static build can be deployed directly. Set the build command to `npm run build` and the publish directory to `build`.

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) with TypeScript
- [ical.js](https://github.com/niccokunzmann/ical.js) for ICS calendar parsing
- `@sveltejs/adapter-static` for static site generation
