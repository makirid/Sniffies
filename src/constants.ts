// -- Sniffies Radar (Simulated Nearby People + Person Tracking) --
// The radar is a privacy-safe simulation. Blips are generated and animated
// locally; nothing here detects, locates, or records real individuals.

export const APP_NAME = 'Sniffies';

export const RADAR_MAX_RANGE_M = 500; // Outer edge of the radar in meters
export const RADAR_TICK_MS = 1000; // Simulation update interval
export const RADAR_PERSON_COUNT = 9; // How many nearby people to simulate

// Building blocks for generating anonymous, discreet profiles.
export const SNIFFIES_HANDLES = [
  'NightOwl', 'BlueVibes', 'RoamingSoul', 'QuietStorm', 'CityFox',
  'VelvetHour', 'LateBloom', 'SilverLine', 'EchoWave', 'DriftKing',
  'NeonMoth', 'HushHush', 'GoldenHour', 'RiverRun', 'AceOfCups',
];

export const SNIFFIES_EMOJIS = ['🦊', '🐺', '🦉', '🐝', '🦋', '🌙', '⚡', '🔥', '💫', '🎭', '🍸', '🕶️'];

export const SNIFFIES_VIBES = [
  'Out and about, say hi 👋',
  'Just browsing the area',
  'Discreet & down to chat',
  'New in town tonight',
  'Looking for good company',
  'Passing through, low key',
  'Coffee first, then who knows',
  'Here for a good time',
  'Adventurous & curious',
];

export const SNIFFIES_INTERESTS = [
  'Casual', 'Chatty', 'Discreet', 'Nearby', 'Nightlife', 'Wellness', 'Adventurous', 'New',
];
