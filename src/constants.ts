export const APP_NAME = 'Sniffies';

// Where to open the official site from the launch button / quick links.
export const SNIFFIES_URL = 'https://sniffies.com';

// Fallback map center used when geolocation is unavailable or denied.
// (Central London — a neutral default; the "Locate me" button recenters.)
export const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];
export const DEFAULT_ZOOM = 13;

// OpenStreetMap standard raster tiles.
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const SPOTS_STORAGE_KEY = 'sniffies.dash.spots.v1';
