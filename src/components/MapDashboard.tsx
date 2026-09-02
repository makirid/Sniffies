import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spot } from '../types';
import {
  SNIFFIES_URL,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  SPOTS_STORAGE_KEY,
} from '../constants';
import { SniffiesLogo } from './SniffiesLogo';

// Fail-safe localStorage helpers.
function loadSpots(): Spot[] {
  try {
    const raw = localStorage.getItem(SPOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveSpots(spots: Spot[]) {
  try {
    localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(spots));
  } catch {
    /* storage unavailable — spots simply won't persist this session */
  }
}

// A pink teardrop pin for saved spots (divIcon avoids Leaflet's broken
// default-image problem under bundlers entirely).
const spotIcon = L.divIcon({
  className: '',
  html:
    '<div style="width:26px;height:26px;transform:translate(-13px,-26px);">' +
    '<svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M13 0C6 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20 0 13 0z" fill="#ec4899" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="13" cy="12.5" r="4.5" fill="#fff"/></svg></div>',
  iconSize: [26, 34],
  iconAnchor: [13, 34],
});

const youIcon = L.divIcon({
  className: '',
  html:
    '<div style="width:18px;height:18px;transform:translate(-9px,-9px);border-radius:50%;' +
    'background:#22d3ee;border:3px solid #fff;box-shadow:0 0 0 6px rgba(34,211,238,.25);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Pending = { lat: number; lng: number } | null;

const MapDashboard: React.FC = () => {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const spotsLayerRef = useRef<L.LayerGroup | null>(null);
  const youMarkerRef = useRef<L.Marker | null>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);

  const [spots, setSpots] = useState<Spot[]>(() => loadSpots());
  const [pending, setPending] = useState<Pending>(null);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  // Initialize the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(
      DEFAULT_CENTER,
      DEFAULT_ZOOM
    );
    L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    spotsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Ensure correct sizing after the flex layout settles.
    setTimeout(() => map.invalidateSize(), 0);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPending({ lat, lng });
      setLabel('');
      setNote('');
      if (pendingMarkerRef.current) pendingMarkerRef.current.remove();
      pendingMarkerRef.current = L.marker([lat, lng], { icon: spotIcon, opacity: 0.6 }).addTo(map);
    });

    // Try to center on the user (with their permission).
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          map.setView(c, 15);
          setYou(c);
        },
        () => {
          /* denied or unavailable — stay on the default center */
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const setYou = (c: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    if (youMarkerRef.current) youMarkerRef.current.setLatLng(c);
    else youMarkerRef.current = L.marker(c, { icon: youIcon, zIndexOffset: 1000 }).addTo(map);
  };

  // Re-render saved-spot markers whenever spots change.
  useEffect(() => {
    const layer = spotsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    spots.forEach(spot => {
      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon });
      const el = document.createElement('div');
      el.style.minWidth = '160px';
      el.innerHTML =
        '<div style="font-weight:700;font-size:14px;margin-bottom:2px;">' +
        escapeHtml(spot.label) +
        '</div>' +
        (spot.note ? '<div style="color:#475569;font-size:12.5px;margin-bottom:8px;">' + escapeHtml(spot.note) + '</div>' : '') +
        '<button type="button" style="border:0;background:#ec4899;color:#fff;font-weight:700;padding:6px 10px;border-radius:8px;cursor:pointer;">Remove</button>';
      const btn = el.querySelector('button');
      if (btn) btn.addEventListener('click', () => removeSpot(spot.id));
      marker.bindPopup(el);
      marker.addTo(layer);
    });
  }, [spots]);

  const persist = (next: Spot[]) => {
    setSpots(next);
    saveSpots(next);
  };

  const confirmAdd = () => {
    if (!pending) return;
    const spot: Spot = {
      id: `spot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: label.trim() || 'Untitled spot',
      note: note.trim() || undefined,
      lat: pending.lat,
      lng: pending.lng,
      createdAt: Date.now(),
    };
    persist([spot, ...spots]);
    cancelAdd();
    showToast(`📍 Saved "${spot.label}"`);
  };

  const cancelAdd = () => {
    setPending(null);
    setLabel('');
    setNote('');
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }
  };

  const removeSpot = (id: string) => {
    setSpots(prev => {
      const next = prev.filter(s => s.id !== id);
      saveSpots(next);
      return next;
    });
    mapRef.current?.closePopup();
  };

  const flyToSpot = (spot: Spot) => {
    mapRef.current?.flyTo([spot.lat, spot.lng], 16, { duration: 0.6 });
  };

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      showToast('Location not available on this device.');
      return;
    }
    showToast('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.flyTo(c, 15, { duration: 0.6 });
        setYou(c);
      },
      () => showToast('Could not get your location (permission denied).'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const openSniffies = () => window.open(SNIFFIES_URL, '_blank', 'noopener,noreferrer');

  const sortedSpots = useMemo(() => [...spots].sort((a, b) => b.createdAt - a.createdAt), [spots]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 px-5 py-3 shadow-lg flex justify-between items-center shrink-0 border-b border-slate-700 h-20 z-[500]">
        <div className="flex items-center gap-4 h-full">
          <SniffiesLogo className="h-10 w-auto" />
          <div className="hidden sm:block">
            <p className="text-xs text-pink-400/80 tracking-[0.2em] uppercase font-semibold">My Map</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={locateMe}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3m10-10h-3M5 12H2m17.07-7.07l-2.12 2.12M7.05 16.95l-2.12 2.12M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <span className="hidden sm:inline">Locate me</span>
          </button>
          <button
            onClick={openSniffies}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          >
            Enter Sniffies
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Map + spots sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="relative flex-1 min-w-0">
          <div ref={mapEl} className="absolute inset-0" />

          {/* Hint pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/85 backdrop-blur border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full pointer-events-none">
            Tap the map to save a spot
          </div>

          {/* Add-spot panel */}
          {pending && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[600] w-[min(92%,380px)] bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 animate-fade-in-up">
              <div className="text-sm font-bold mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> New spot
                <span className="ml-auto text-[11px] font-mono text-slate-400">
                  {pending.lat.toFixed(4)}, {pending.lng.toFixed(4)}
                </span>
              </div>
              <input
                autoFocus
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmAdd()}
                placeholder="Label (e.g. Riverside park)"
                className="w-full bg-slate-900 border border-slate-700 focus:border-pink-500 outline-none rounded-lg px-3 py-2.5 text-sm mb-2"
              />
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmAdd()}
                placeholder="Note (optional)"
                className="w-full bg-slate-900 border border-slate-700 focus:border-pink-500 outline-none rounded-lg px-3 py-2.5 text-sm mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={cancelAdd}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg py-2.5 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdd}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg py-2.5 font-bold text-sm transition-all"
                >
                  Save spot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved spots list */}
        <aside className="w-72 shrink-0 bg-slate-800 border-l border-slate-700 flex-col hidden md:flex">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-xs font-bold tracking-[0.16em] uppercase text-slate-400">
              My Spots · {spots.length}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedSpots.length === 0 && (
              <p className="text-slate-500 text-sm italic p-2 leading-relaxed">
                No saved spots yet. Tap anywhere on the map to drop your first pin.
              </p>
            )}
            {sortedSpots.map(spot => (
              <div
                key={spot.id}
                className="bg-slate-900 border border-slate-700 hover:border-pink-500/60 rounded-xl p-3 transition-colors"
              >
                <button onClick={() => flyToSpot(spot)} className="text-left w-full">
                  <div className="font-bold text-sm truncate">{spot.label}</div>
                  {spot.note && <div className="text-xs text-slate-400 truncate mt-0.5">{spot.note}</div>}
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                  </div>
                </button>
                <button
                  onClick={() => removeSpot(spot.id)}
                  className="mt-2 text-[11px] text-slate-400 hover:text-pink-400 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Privacy footer */}
      <div className="bg-slate-950 text-center py-2 text-[11px] text-slate-500 shrink-0 border-t border-slate-800 z-[500]">
        Personal map — not affiliated with Sniffies. Shows only spots you save on this device; it does not access any
        Sniffies account or show other people's locations. Map data © OpenStreetMap contributors.
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-950 border border-pink-600/50 text-white px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.4)] z-[700] font-bold text-sm animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
};

// Minimal HTML escaping for popup content built from user input.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default MapDashboard;
