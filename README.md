# Sniffies Dashboard

A personal, customizable **map dashboard** and launcher for
[sniffies.com](https://sniffies.com) — built with an interactive
**OpenStreetMap** (via Leaflet).

> **Scope & privacy.** This is a *personal* tool. It launches you into the
> **official** sniffies.com and lets you save **your own** map spots (stored
> locally on your device). It is **not affiliated with Sniffies**, does **not**
> connect to any Sniffies account or API, and does **not** show or track any
> other person's location. There is no public Sniffies API, so live Sniffies
> data cannot be displayed here.

## Features

- **Interactive OpenStreetMap** centered on your location (with your
  permission; falls back to a default center otherwise).
- **Save your own spots** — tap the map to drop a pin with a label and note.
  Pins persist locally and are listed in a sidebar you can fly back to.
- **Locate me** — recenter the map on your current position.
- **Enter Sniffies** — one tap opens the official site in a new tab.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) tiles
- [Tailwind CSS](https://tailwindcss.com/)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

> Geolocation and a live map require serving over `http://localhost` (dev) or
> HTTPS (production). Map tiles are fetched from OpenStreetMap at runtime.

## Companion Android app (in-app browser)

The dashboard can be wrapped as a native Android app with
[Capacitor](https://capacitorjs.com/). In the native app, **Enter Sniffies**
(and each spot's **Open in Sniffies**) opens the official site in an in-app
browser (Chrome Custom Tab) so your map and the real app share one shell.

```bash
npm install
npm run build            # produce dist/
npm run cap:add:android  # one-time: generate the native android/ project
npm run cap:sync         # copy the web build into the native project
npm run cap:open:android # open in Android Studio to run / build the APK
```

The generated `android/` folder is not committed; regenerate it with
`cap:add:android`. App identity is set in `capacitor.config.ts`.

## Deep-linking into Sniffies

`Open in Sniffies` hands a saved spot off to the official site. Sniffies' real
URL scheme isn't known in this build, so it defaults to the site root. If you
know the pattern, set `SNIFFIES_MAP_URL_TEMPLATE` in `src/constants.ts`, e.g.
`https://sniffies.com/?lat={lat}&lng={lng}`.

## Project structure

```
index.html
src/
  main.tsx                    # React entry point
  App.tsx                     # Renders the map dashboard
  index.css                   # Tailwind + base styles
  types.ts                    # Spot (a user-saved pin)
  constants.ts                # URLs, map defaults, storage key
  components/
    MapDashboard.tsx          # Leaflet map, spot saving, launcher
    SniffiesLogo.tsx          # Brand wordmark
```
