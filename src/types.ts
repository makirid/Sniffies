// A personal saved spot the user drops on their own map.
// These are the USER'S OWN pins, stored locally on their device — this app
// does not read, show, or track any other person's location.
export interface Spot {
  id: string;
  label: string;
  note?: string;
  lat: number;
  lng: number;
  createdAt: number;
}
