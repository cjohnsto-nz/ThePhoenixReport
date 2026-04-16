import { PresentationProvider } from './PresentationContext';
import { ControlsProvider } from './ControlsContext';
import { PresentationControls } from './components/PresentationControls';
import { ContentArea } from './components/ContentArea';
import { ParticleBackground } from './components/ParticleBackground';

export default function App() {
  return (
    <PresentationProvider>
      <ControlsProvider>
        <div className="relative h-screen overflow-hidden">
          <ParticleBackground />
          <div className="relative z-10 h-full">
            <ContentArea />
          </div>
          <PresentationControls />
        </div>
      </ControlsProvider>
    </PresentationProvider>
  );
}
