import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NearbyPerson, PersonStatus } from '../types';
import {
  RADAR_MAX_RANGE_M,
  RADAR_TICK_MS,
  RADAR_PERSON_COUNT,
  SNIFFIES_HANDLES,
  SNIFFIES_EMOJIS,
  SNIFFIES_VIBES,
  SNIFFIES_INTERESTS,
} from '../constants';
import { SniffiesLogo } from './SniffiesLogo';

type ViewMode = 'radar' | 'list';
type StatusFilter = 'all' | PersonStatus;

const STATUS_META: Record<PersonStatus, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  looking: { label: 'Looking', color: 'text-pink-400', dot: 'bg-pink-400' },
  away: { label: 'Away', color: 'text-slate-400', dot: 'bg-slate-500' },
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInterests = (): string[] => {
  const pool = [...SNIFFIES_INTERESTS];
  const count = 2 + Math.floor(Math.random() * 2); // 2-3 interests
  const out: string[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

const createPerson = (index: number): NearbyPerson => {
  const statuses: PersonStatus[] = ['online', 'looking', 'away'];
  return {
    id: `np-${index}-${Math.floor(Math.random() * 100000)}`,
    handle: `${pick(SNIFFIES_HANDLES)}${Math.floor(Math.random() * 90 + 10)}`,
    emoji: pick(SNIFFIES_EMOJIS),
    vibe: pick(SNIFFIES_VIBES),
    status: pick(statuses),
    interests: randomInterests(),
    distanceM: Math.round(30 + Math.random() * (RADAR_MAX_RANGE_M - 30)),
    bearing: Math.floor(Math.random() * 360),
    speedMps: 2 + Math.random() * 8,
    headingDelta: (Math.random() - 0.5) * 12,
    lastSeenMs: Date.now() - Math.floor(Math.random() * 120000),
    pinged: false,
  };
};

// Advance one person one simulation tick: gentle radial + angular drift so
// blips feel alive without ever leaving the radar range.
const stepPerson = (p: NearbyPerson): NearbyPerson => {
  const radialDrift = (Math.random() - 0.5) * p.speedMps * 6;
  let distanceM = p.distanceM + radialDrift;
  distanceM = Math.max(15, Math.min(RADAR_MAX_RANGE_M, distanceM));

  let bearing = (p.bearing + p.headingDelta + (Math.random() - 0.5) * 4) % 360;
  if (bearing < 0) bearing += 360;

  // Occasionally shift status to keep the board dynamic.
  let status = p.status;
  if (Math.random() < 0.06) {
    const statuses: PersonStatus[] = ['online', 'looking', 'away'];
    status = pick(statuses);
  }

  return {
    ...p,
    distanceM: Math.round(distanceM),
    bearing: Math.round(bearing),
    status,
    lastSeenMs: status === 'away' ? p.lastSeenMs : Date.now(),
  };
};

const timeAgo = (ms: number): string => {
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
};

const compass = (bearing: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(bearing / 45) % 8];
};

const SniffiesRadar: React.FC = () => {
  const [people, setPeople] = useState<NearbyPerson[]>(() =>
    Array.from({ length: RADAR_PERSON_COUNT }, (_, i) => createPerson(i))
  );
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [interestFilter, setInterestFilter] = useState<string | null>(null);
  const [rangeM, setRangeM] = useState<number>(RADAR_MAX_RANGE_M);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [sweep, setSweep] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulation loop: move everyone every tick.
  useEffect(() => {
    const id = setInterval(() => {
      setPeople(prev => prev.map(stepPerson));
    }, RADAR_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Radar sweep animation (visual only).
  useEffect(() => {
    if (viewMode !== 'radar') return;
    const id = setInterval(() => setSweep(s => (s + 4) % 360), 40);
    return () => clearInterval(id);
  }, [viewMode]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const filtered = useMemo(() => {
    return people
      .filter(p => p.distanceM <= rangeM)
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => !interestFilter || p.interests.includes(interestFilter))
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [people, rangeM, statusFilter, interestFilter]);

  const selected = people.find(p => p.id === selectedId) || null;
  const tracked = people.find(p => p.id === trackedId) || null;

  // If a tracked person drops out of range, surface it but keep the lock.
  const trackedOutOfRange = tracked ? tracked.distanceM > rangeM : false;

  const onlineCount = people.filter(p => p.status !== 'away').length;

  const handlePing = (p: NearbyPerson) => {
    setPeople(prev => prev.map(x => (x.id === p.id ? { ...x, pinged: true } : x)));
    showToast(`👋 Wave sent to ${p.handle}`);
  };

  const handleTrack = (p: NearbyPerson) => {
    setTrackedId(p.id);
    setSelectedId(null);
    showToast(`📍 Now tracking ${p.handle}`);
  };

  const handleStopTracking = () => {
    if (tracked) showToast(`Stopped tracking ${tracked.handle}`);
    setTrackedId(null);
  };

  // Convert a person's polar position to an x/y offset (%) on the radar disc.
  const radarPos = (p: NearbyPerson) => {
    const r = Math.min(p.distanceM / RADAR_MAX_RANGE_M, 1) * 50; // % from center
    const rad = ((p.bearing - 90) * Math.PI) / 180; // 0deg = up (North)
    return {
      left: `${50 + r * Math.cos(rad)}%`,
      top: `${50 + r * Math.sin(rad)}%`,
    };
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-900 text-white animate-fade-in overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-4 shadow-lg flex justify-between items-center shrink-0 border-b border-slate-700 h-24">
        <div className="flex items-center gap-5 h-full">
          <SniffiesLogo className="h-12 w-auto" />
          <div className="h-10 w-px bg-slate-600 hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm text-pink-400/80 tracking-[0.2em] uppercase font-semibold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
              </span>
              {onlineCount} nearby · Simulated Radar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
            {(['radar', 'list'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  viewMode === v ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filter / Options bar */}
      <div className="bg-slate-800/60 border-b border-slate-700 px-6 py-3 flex flex-wrap items-center gap-4 shrink-0">
        {/* Status filter */}
        <div className="flex gap-2">
          {(['all', 'online', 'looking', 'away'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-bold capitalize border transition-all ${
                statusFilter === s
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Range slider */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Range</span>
          <input
            type="range"
            min={50}
            max={RADAR_MAX_RANGE_M}
            step={10}
            value={rangeM}
            onChange={e => setRangeM(Number(e.target.value))}
            className="w-40 accent-pink-500"
          />
          <span className="text-sm font-mono text-pink-400 w-16 text-right">{rangeM}m</span>
        </div>
      </div>

      {/* Interest chips */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-900">
        <button
          onClick={() => setInterestFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            interestFilter === null
              ? 'bg-slate-200 text-slate-900 border-slate-200'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          # All Interests
        </button>
        {SNIFFIES_INTERESTS.map(tag => (
          <button
            key={tag}
            onClick={() => setInterestFilter(t => (t === tag ? null : tag))}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              interestFilter === tag
                ? 'bg-pink-600 text-white border-pink-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Tracking banner */}
      {tracked && (
        <div className="bg-gradient-to-r from-pink-900/60 to-purple-900/60 border-b border-pink-700/50 px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-pink-500 flex items-center justify-center text-2xl animate-pulse">
            {tracked.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold flex items-center gap-2">
              Tracking {tracked.handle}
              <span className={`text-xs ${STATUS_META[tracked.status].color}`}>
                ● {STATUS_META[tracked.status].label}
              </span>
            </div>
            <div className="text-sm text-pink-200/80 font-mono">
              {trackedOutOfRange ? (
                <span className="text-yellow-300">Out of range — {tracked.distanceM}m away</span>
              ) : (
                <>
                  {tracked.distanceM}m · bearing {tracked.bearing}° {compass(tracked.bearing)} · seen {timeAgo(tracked.lastSeenMs)}
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleStopTracking}
            className="bg-pink-600 hover:bg-pink-500 px-5 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap"
          >
            Stop Tracking
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'radar' ? (
          <div className="h-full w-full flex items-center justify-center p-6">
            <div className="relative aspect-square h-full max-h-full max-w-full">
              {/* Radar disc */}
              <div className="absolute inset-0 rounded-full bg-slate-950 border border-slate-700 overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]">
                {/* Range rings */}
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <div
                    key={f}
                    className="absolute rounded-full border border-cyan-500/15"
                    style={{
                      left: `${50 - f * 50}%`,
                      top: `${50 - f * 50}%`,
                      width: `${f * 100}%`,
                      height: `${f * 100}%`,
                    }}
                  />
                ))}
                {/* Cross-hairs */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/10" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/10" />

                {/* Sweep line */}
                <div
                  className="absolute left-1/2 top-1/2 origin-top-left"
                  style={{ transform: `rotate(${sweep}deg)` }}
                >
                  <div
                    className="h-[1px] w-[50vmin] max-w-[50%] bg-gradient-to-r from-cyan-400/70 to-transparent"
                    style={{ transformOrigin: 'left center' }}
                  />
                </div>

                {/* Center = you */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.9)]" />
                  <span className="text-[10px] text-cyan-300 font-bold mt-1 uppercase tracking-wider">You</span>
                </div>

                {/* Compass labels */}
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono">N</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono">S</span>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">W</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">E</span>

                {/* Blips */}
                {filtered.map(p => {
                  const pos = radarPos(p);
                  const isTracked = p.id === trackedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-linear focus:outline-none"
                      style={pos}
                      aria-label={`View ${p.handle}`}
                    >
                      <span className="relative flex flex-col items-center">
                        {isTracked && (
                          <span className="absolute -inset-3 rounded-full border-2 border-pink-500 animate-ping" />
                        )}
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 transition-transform active:scale-90 ${
                            isTracked
                              ? 'bg-pink-600 border-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.8)] scale-110'
                              : p.status === 'away'
                              ? 'bg-slate-700 border-slate-500 opacity-70'
                              : 'bg-slate-800 border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                          }`}
                        >
                          {p.emoji}
                        </span>
                        <span
                          className={`absolute -bottom-1.5 w-2 h-2 rounded-full border border-slate-900 ${STATUS_META[p.status].dot}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-slate-500 text-lg bg-slate-900/80 px-6 py-3 rounded-xl">
                    No one matches your filters right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="h-full overflow-y-auto p-6 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center text-slate-500 py-16 text-lg">
                No one matches your filters right now.
              </div>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left bg-slate-800 hover:bg-slate-700/70 rounded-2xl p-4 flex items-center gap-4 border transition-all active:scale-[0.99] ${
                  p.id === trackedId ? 'border-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.3)]' : 'border-slate-700 hover:border-cyan-500/60'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-3xl shrink-0">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg truncate">{p.handle}</span>
                    <span className={`text-xs ${STATUS_META[p.status].color} flex items-center gap-1`}>
                      <span className={`w-2 h-2 rounded-full ${STATUS_META[p.status].dot}`} />
                      {STATUS_META[p.status].label}
                    </span>
                    {p.pinged && <span className="text-xs text-pink-400">· waved 👋</span>}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{p.vibe}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {p.interests.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">{p.distanceM}m</div>
                  <div className="text-xs text-slate-500 font-mono">{p.bearing}° {compass(p.bearing)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Privacy footer */}
      <div className="bg-slate-950 text-center py-2 text-[11px] text-slate-500 shrink-0 border-t border-slate-800">
        Simulated radar for demonstration — no real people are detected, located, or tracked.
      </div>

      {/* Profile card overlay */}
      {selected && (
        <div
          className="absolute inset-0 bg-black/70 z-40 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-pink-600/30 to-purple-700/30 p-8 flex flex-col items-center">
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white"
                aria-label="Close profile"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-pink-500 flex items-center justify-center text-5xl mb-3">
                {selected.emoji}
              </div>
              <h2 className="text-2xl font-bold">{selected.handle}</h2>
              <div className={`flex items-center gap-2 text-sm ${STATUS_META[selected.status].color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_META[selected.status].dot}`} />
                {STATUS_META[selected.status].label} · seen {timeAgo(selected.lastSeenMs)}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-center italic">"{selected.vibe}"</p>

              <div className="flex justify-around bg-slate-900 rounded-xl py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">{selected.distanceM}m</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">{selected.bearing}°</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{compass(selected.bearing)} Bearing</div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {selected.interests.map(tag => (
                  <span key={tag} className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full font-bold">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handlePing(selected)}
                  disabled={selected.pinged}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {selected.pinged ? '👋 Waved' : '👋 Wave'}
                </button>
                {trackedId === selected.id ? (
                  <button
                    onClick={handleStopTracking}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-4 rounded-xl font-bold transition-colors"
                  >
                    Stop Tracking
                  </button>
                ) : (
                  <button
                    onClick={() => handleTrack(selected)}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    📍 Track
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-950 border border-pink-600/50 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.4)] z-[60] font-bold animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
};

export default SniffiesRadar;
