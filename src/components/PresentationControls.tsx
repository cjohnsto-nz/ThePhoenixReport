import { useEffect, useRef, type ReactNode } from 'react';
import {
  EXPORT_ASPECT_RATIOS,
  DEFAULT_EXPORT_ZOOM_PERCENT,
  type ExportAspectRatio,
  MAX_EXPORT_ZOOM_PERCENT,
  MIN_EXPORT_ZOOM_PERCENT,
  useControls,
} from '../ControlsContext';
import { usePresentation } from '../PresentationContext';
import { WindowPortal } from './WindowPortal';

function fmt(seconds: number) {
  const minutes = Math.floor(Math.abs(seconds) / 60);
  const remainingSeconds = Math.abs(seconds) % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function ControlButton({
  children,
  title,
  onClick,
  disabled = false,
  tone = 'default',
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'subtle';
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-cyan-300/35 text-cyan-100 hover:border-cyan-200 hover:bg-cyan-300/10'
      : tone === 'subtle'
        ? 'border-transparent text-white/45 hover:border-white/12 hover:text-white/78'
        : 'border-white/12 text-white/76 hover:border-white/24 hover:text-white';

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 min-w-12 items-center justify-center border px-4 font-mono text-xs uppercase transition disabled:pointer-events-none disabled:opacity-25 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function PlayIcon({ isRunning }: { isRunning: boolean }) {
  if (isRunning) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4L19 12L7 20V4Z" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 8V3H17V8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M7 17H5C3.9 17 3 16.1 3 15V10C3 8.9 3.9 8 5 8H19C20.1 8 21 8.9 21 10V15C21 16.1 20.1 17 19 17H17" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M7 14H17V21H7V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function exportSlidesToPdf() {
  window.print();
}

function ZoomControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const setSteppedValue = (delta: number) => {
    onChange(value + delta);
  };

  return (
    <div className="border border-white/12 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-xs uppercase text-white/38">PDF Zoom</div>
        <div className="font-mono text-lg text-cyan-200">{value}%</div>
      </div>
      <div className="mt-4 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
        <button
          type="button"
          title="Zoom PDF out"
          onClick={() => setSteppedValue(-5)}
          className="flex h-10 items-center justify-center border border-white/12 font-mono text-lg text-white/70 transition hover:border-white/24 hover:text-white"
        >
          -
        </button>
        <input
          aria-label="PDF zoom"
          type="range"
          min={MIN_EXPORT_ZOOM_PERCENT}
          max={MAX_EXPORT_ZOOM_PERCENT}
          step={5}
          value={value}
          onChange={(event) => onChange(Number.parseInt(event.currentTarget.value, 10))}
          className="h-2 w-full accent-cyan-300"
        />
        <button
          type="button"
          title="Zoom PDF in"
          onClick={() => setSteppedValue(5)}
          className="flex h-10 items-center justify-center border border-white/12 font-mono text-lg text-white/70 transition hover:border-white/24 hover:text-white"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => onChange(DEFAULT_EXPORT_ZOOM_PERCENT)}
        className="mt-3 font-mono text-xs uppercase text-white/45 transition hover:text-white/80"
      >
        Reset to TV fit
      </button>
    </div>
  );
}

function AspectRatioControl({
  value,
  onChange,
}: {
  value: ExportAspectRatio;
  onChange: (value: ExportAspectRatio) => void;
}) {
  return (
    <div className="border border-white/12 bg-white/[0.025] p-4">
      <div className="font-mono text-xs uppercase text-white/38">Aspect Ratio</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {EXPORT_ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio}
            type="button"
            title={`Export PDF as ${ratio}`}
            onClick={() => onChange(ratio)}
            className={`h-10 border font-mono text-xs uppercase transition ${
              value === ratio
                ? 'border-cyan-300/55 bg-cyan-300/10 text-cyan-100'
                : 'border-white/12 text-white/58 hover:border-white/24 hover:text-white'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
}

function RemoteControlsView() {
  const {
    state,
    dispatch,
    currentSegment,
    currentSlide,
    currentStep,
    nextStep,
    split,
  } = usePresentation();
  const {
    exportAspectRatio,
    exportZoomPercent,
    setExportAspectRatio,
    setExportZoomPercent,
    setIsPopped,
  } = useControls();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const popupWindow = rootRef.current?.ownerDocument.defaultView;
    if (!popupWindow) return;

    rootRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isEditable) return;

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        dispatch({ type: 'NEXT_SLIDE' });
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        dispatch({ type: 'PREV_SLIDE' });
      }
    };

    popupWindow.addEventListener('keydown', handleKeyDown);
    return () => popupWindow.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <div ref={rootRef} tabIndex={-1} className="flex h-screen flex-col bg-[#030506] text-white">
      <div className="border-b border-white/12 px-8 py-6">
        <div className="font-mono text-xs uppercase text-cyan-300">Remote Presenter</div>
        <h1 className="mt-2 text-3xl font-semibold">{currentSlide.title}</h1>
        <p className="mt-2 text-white/48">{currentSegment.title}</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-0 overflow-auto px-8 py-8">
          <div className="font-mono text-xs uppercase text-white/38">Speaker Notes</div>
          <div className="mt-8 max-w-4xl space-y-6">
            {(currentSlide.speakerNotes ? currentSlide.speakerNotes.split(/\n+/) : ['No speaker notes for this slide.'])
              .map((note) => note.trim())
              .filter(Boolean)
              .map((note) => (
                <p key={note} className="text-3xl leading-relaxed text-white/86">
                  {note}
                </p>
              ))}
          </div>
        </div>

        <aside className="min-h-0 overflow-auto border-l border-white/12 px-6 py-8">
          <div className="grid gap-3">
            <ControlButton
              title="Previous slide"
              onClick={() => dispatch({ type: 'PREV_SLIDE' })}
              disabled={currentStep.slideNumber === 1}
            >
              <ChevronLeft />
              <span className="ml-3">Back</span>
            </ControlButton>
            <ControlButton
              title="Next slide"
              onClick={() => dispatch({ type: 'NEXT_SLIDE' })}
              disabled={currentStep.slideNumber === currentStep.totalSlides}
              tone="accent"
            >
              <span className="mr-3">Advance</span>
              <ChevronRight />
            </ControlButton>
            <ControlButton
              title={state.isRunning ? 'Pause timer' : 'Start timer'}
              onClick={() => dispatch({ type: state.isRunning ? 'PAUSE' : 'PLAY' })}
              tone="subtle"
            >
              <PlayIcon isRunning={state.isRunning} />
              <span className="ml-3">{state.isRunning ? 'Pause' : 'Start'}</span>
            </ControlButton>
            <ZoomControl
              value={exportZoomPercent}
              onChange={setExportZoomPercent}
            />
            <AspectRatioControl
              value={exportAspectRatio}
              onChange={setExportAspectRatio}
            />
            <ControlButton
              title="Export slides to PDF"
              onClick={exportSlidesToPdf}
              tone="subtle"
            >
              <PrintIcon />
              <span className="ml-3">Export PDF</span>
            </ControlButton>
            <ControlButton
              title="Dock controls"
              onClick={() => setIsPopped(false)}
              tone="subtle"
            >
              Dock
            </ControlButton>
          </div>

          <div className="mt-10 border-t border-white/12 pt-8">
            <div className="font-mono text-xs uppercase text-white/38">Elapsed</div>
            <div className="mt-2 font-mono text-4xl">{fmt(split.elapsed)}</div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-8">
            <div className="font-mono text-xs uppercase text-white/38">Step</div>
            <div className="mt-2 font-mono text-3xl">
              <span className="text-cyan-300">{currentStep.slideNumber}</span>
              <span className="mx-2 text-white/30">/</span>
              <span>{currentStep.totalSlides}</span>
            </div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-8">
            <div className="font-mono text-xs uppercase text-white/38">Next Beat</div>
            <p className="mt-4 text-xl leading-relaxed text-white/82">
              {nextStep?.name ?? 'End of presentation'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PresentationControls() {
  const { isPopped, setIsPopped } = useControls();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isEditable) return;

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsPopped(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPopped]);

  return (
    <>
      {isPopped && (
        <WindowPortal
          title="AI Offsite Remote Presenter"
          width={1320}
          height={820}
          onClose={() => setIsPopped(false)}
        >
          <RemoteControlsView />
        </WindowPortal>
      )}
    </>
  );
}
