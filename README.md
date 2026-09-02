# Sniffies

A standalone **nearby-people radar with person tracking** — built as its own
independent app (no vending-machine / kiosk code).

> **Privacy note:** This is a privacy-safe, on-device **simulation**. The nearby
> people shown on the radar are generated and animated locally in the browser.
> **No real people are detected, located, or tracked.** The UI states this in a
> persistent footer.

## Features

- **Radar view** — an animated radar disc with a rotating sweep line, range
  rings, and a compass. Simulated nearby people appear as live blips positioned
  by distance + bearing around you at the center.
- **List view** — an alternate, distance-sorted list of nearby people with
  status and interest tags.
- **Person tracking** — tap any blip or list row to open a profile card, then
  **Track** to lock on. A tracking banner shows a live distance / bearing /
  compass / last-seen readout, and the tracked blip gets a highlighted, pinging
  marker.
- **Options** — status filter (online / looking / away), interest-tag filters,
  an adjustable range slider, and a wave/ping action.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
index.html
src/
  main.tsx                    # React entry point
  App.tsx                     # Renders the radar as the whole app
  index.css                   # Tailwind + base styles
  types.ts                    # NearbyPerson / PersonStatus
  constants.ts                # Radar config + profile-generation pools
  components/
    SniffiesRadar.tsx         # Radar + list views, filters, tracking, profiles
    SniffiesLogo.tsx          # Brand wordmark
```
