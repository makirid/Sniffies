// A simulated nearby person shown on the Sniffies radar.
// NOTE: This is a privacy-safe SIMULATION only — no real people are detected,
// located, or tracked. Blips are generated and animated locally on-device.
export type PersonStatus = 'online' | 'looking' | 'away';

export interface NearbyPerson {
  id: string;
  handle: string;
  emoji: string; // Discreet anonymous avatar
  vibe: string; // Short one-line bio / status text
  status: PersonStatus;
  interests: string[]; // Tags used by the interest filter
  distanceM: number; // Approx distance in meters (radial)
  bearing: number; // Compass bearing 0-359 (angular position on radar)
  speedMps: number; // Movement speed used by the animation loop
  headingDelta: number; // Per-tick bearing drift for organic movement
  lastSeenMs: number; // Timestamp of last "activity"
  pinged: boolean; // Whether the user has waved/pinged them
}
