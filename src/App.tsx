import SniffiesRadar from './components/SniffiesRadar';

// Standalone Sniffies platform: the radar is the whole app.
function App() {
  return (
    <div className="h-full w-full bg-slate-900 text-white overflow-hidden relative font-sans">
      <SniffiesRadar />
    </div>
  );
}

export default App;
