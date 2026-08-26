import { PresentationProvider } from './PresentationContext';
import { ControlsProvider } from './ControlsContext';
import { ContentArea, PrintableDeck } from './components/ContentArea';
import { PresentationControls } from './components/PresentationControls';

export default function App() {
  return (
    <PresentationProvider>
      <ControlsProvider>
        <div className="screen-deck relative h-screen overflow-hidden bg-[#030506] text-slate-50">
          <ContentArea />
          <PresentationControls />
        </div>
        <PrintableDeck />
      </ControlsProvider>
    </PresentationProvider>
  );
}
