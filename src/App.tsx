import { MapView } from './render/MapView';
import { CountryDashboard } from './ui/CountryDashboard';
import { NewsFeed } from './ui/NewsFeed';
import { TimelinePanel } from './ui/TimelinePanel';
import { ProbabilityPanel } from './ui/ProbabilityPanel';
import { TurnControls } from './ui/TurnControls';

function App() {
  return (
    <div className="h-full flex flex-col gap-3 p-3 bg-[#0b0c10]">
      <TurnControls />

      <div className="flex-1 grid grid-cols-[2fr_1fr] gap-3 min-h-0">
        <MapView />
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <CountryDashboard />
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
