import { MapView } from './render/MapView';
import { CountryDashboard } from './ui/CountryDashboard';
import { NewsFeed } from './ui/NewsFeed';
import { TimelinePanel } from './ui/TimelinePanel';
import { ProbabilityPanel } from './ui/ProbabilityPanel';
import { WarPanel } from './ui/WarPanel';
import { TurnControls } from './ui/TurnControls';
import { NationPicker } from './ui/NationPicker';
import { useGameStore } from './state/gameStore';

function App() {
  const playerCountryId = useGameStore((s) => s.playerCountryId);

  return (
    <div className="h-full flex flex-col gap-3 p-3 bg-[#0b0c10]">
      {!playerCountryId && <NationPicker />}

      <TurnControls />

      <div className="flex-1 grid grid-cols-[2fr_1fr] gap-3 min-h-0">
        <MapView />
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <CountryDashboard />
          <WarPanel />
          <ProbabilityPanel />
        </div>
      </div>

      <div className="h-56 grid grid-cols-2 gap-3">
        <NewsFeed />
        <TimelinePanel />
      </div>
    </div>
  );
}

export default App;
