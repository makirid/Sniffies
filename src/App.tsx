import MapDashboard from './components/MapDashboard';

// Standalone Sniffies dashboard: a personal OpenStreetMap-based map with a
// launch button into the official site.
function App() {
  return (
    <div className="h-full w-full bg-slate-900 text-white overflow-hidden relative font-sans">
      <MapDashboard />
    </div>
  );
}

export default App;
