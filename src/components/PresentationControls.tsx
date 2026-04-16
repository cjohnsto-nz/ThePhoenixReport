import { motion, AnimatePresence } from 'framer-motion';
import { usePresentation } from '../PresentationContext';
import { useControls } from '../ControlsContext';
import { WindowPortal } from './WindowPortal';

function fmt(seconds: number) {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function splitSeverity(overBy: number) {
  if (overBy <= 0)  return { text: 'text-phoenix-400', glow: 'rgba(255,133,17,0.3)' };
  if (overBy < 30)  return { text: 'text-yellow-400',  glow: 'rgba(250,204,21,0.35)' };
  if (overBy < 90)  return { text: 'text-orange-400',  glow: 'rgba(251,146,60,0.4)' };
  return             { text: 'text-red-400',    glow: 'rgba(248,113,113,0.5)' };
}

function sectionWindow(start: number, end: number) {
  return `${fmt(start)}-${fmt(end)}`;
}

// Inner controls UI — shared between main window and portal window
function ControlsInner({ isRemote = false }: { isRemote?: boolean }) {
  const { state, dispatch, segments, currentSegment, split } = usePresentation();

  const totalDurationSec = split.overallTarget;
  const globalProgress = totalDurationSec > 0
    ? Math.min((state.totalElapsedSeconds / totalDurationSec) * 100, 100)
    : 0;

  const isOverTime = split.overBySeconds > 0;
  const severity = splitSeverity(split.overBySeconds);
  const isStandaloneSegment = currentSegment?.phase === 'intro' || currentSegment?.phase === 'outro';
  const disablePrevStep =
    state.currentSegmentIndex === 0 &&
    isStandaloneSegment &&
    state.stagedId === null;
  const disableNextStep =
    state.currentSegmentIndex === segments.length - 1 &&
    isStandaloneSegment &&
    state.stagedId === null;
  const paceDisplay = isOverTime ? split.overBySeconds : split.remainingSeconds;

  return (
    <div className={`w-full ${isRemote ? 'scale-110 origin-top-left' : ''}`}>
      <div className="h-[2px] bg-white/[0.04]">
        <motion.div
          className={`h-full transition-colors duration-700 ${isOverTime ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-phoenix-600 to-phoenix-400'}`}
          style={{ width: `${globalProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className={`bg-navy-950/95 backdrop-blur-xl border-t border-white/[0.06] ${isRemote ? 'px-6 py-4' : 'px-5 py-3'}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center bg-navy-900/70 rounded-full p-1 flex-shrink-0">
            <button onClick={() => dispatch({ type: 'SET_MODE', mode: 'presentation' })} className={`${isRemote ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} rounded-full font-medium transition-all duration-300 ${state.mode === 'presentation' ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30' : 'text-white/40 hover:text-white/70'}`}>Present</button>
            <button onClick={() => dispatch({ type: 'SET_MODE', mode: 'explore' })} className={`${isRemote ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} rounded-full font-medium transition-all duration-300 ${state.mode === 'explore' ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30' : 'text-white/40 hover:text-white/70'}`}>Explore</button>
          </div>
          <AnimatePresence>
            {state.mode === 'presentation' && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => dispatch({ type: 'PREV_SEGMENT' })} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition-all" title="Previous segment">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                  </button>
                  {!isStandaloneSegment ? (
                    <>
                      <button
                        onClick={() => dispatch({ type: 'REVEAL_PREV' })}
                        disabled={disablePrevStep}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition-all disabled:text-white/15 disabled:hover:text-white/15 disabled:hover:bg-transparent"
                        title="Previous step"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'REVEAL_NEXT' })}
                        disabled={disableNextStep}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition-all disabled:text-white/15 disabled:hover:text-white/15 disabled:hover:bg-transparent"
                        title="Next step"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </>
                  ) : null}
                  <button onClick={() => dispatch({ type: 'NEXT_SEGMENT' })} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition-all" title="Next segment">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  </button>
                  <button onClick={() => dispatch({ type: state.isRunning ? 'PAUSE' : 'PLAY' })} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${state.isRunning ? 'text-white/30 hover:text-white/60 hover:bg-white/10' : 'text-phoenix-500/60 hover:text-phoenix-400 hover:bg-phoenix-400/10'}`} title={state.isRunning ? 'Pause timer' : 'Start timer'}>
                    {state.isRunning ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                  </button>
                  <button onClick={() => dispatch({ type: 'RESET' })} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/15 hover:text-white/50 hover:bg-white/10 transition-all" title="Reset">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={`${currentSegment?.id}-${state.segmentScreen}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="flex-1 min-w-0">
                    <div className="text-[10px] text-white/20 uppercase tracking-widest font-medium leading-none mb-0.5">{state.currentSegmentIndex + 1} / {segments.length}</div>
                    <div className="text-sm text-white/55 font-medium truncate leading-tight">{currentSegment?.title}{!isStandaloneSegment && state.segmentScreen !== 'content' ? ` · ${state.segmentScreen}` : ''}</div>
                  </motion.div>
                </AnimatePresence>
                <div className="w-px h-5 bg-white/[0.07] flex-shrink-0"/>
                <div className="flex-shrink-0 text-right">
                  <motion.div animate={split.overBySeconds >= 90 ? { opacity: [1, 0.55, 1] } : { opacity: 1 }} transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }} className={`text-base font-mono tabular-nums font-semibold leading-none transition-colors duration-700 ${severity.text}`} style={{ textShadow: isOverTime ? `0 0 14px ${severity.glow}` : undefined }}>
                    {isOverTime ? `+${fmt(paceDisplay)}` : `-${fmt(paceDisplay)}`}
                  </motion.div>
                  <div className="text-[10px] text-white/30 font-mono tabular-nums leading-none mt-0.5">{sectionWindow(split.sectionStart, split.sectionEnd)}</div>
                </div>
                <div className="flex-shrink-0 pl-3 border-l border-white/[0.06]">
                  <div className="text-sm font-mono tabular-nums text-white/25 leading-none">{fmt(state.totalElapsedSeconds)}</div>
                  <div className="text-[10px] text-white/25 font-mono tabular-nums leading-none mt-0.5">run time</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 pl-1">
                  {segments.map((seg, i) => {
                    const isDone = i < state.currentSegmentIndex;
                    const isCurrent = i === state.currentSegmentIndex;
                    return (
                      <button key={seg.id} onClick={() => dispatch({ type: 'GO_TO_SEGMENT', index: i })} title={seg.title} className={`rounded-full transition-all duration-300 ${isCurrent ? 'w-4 h-2 bg-phoenix-400 shadow-md shadow-phoenix-400/40' : isDone ? 'w-2 h-2 bg-phoenix-700/50' : 'w-2 h-2 bg-white/10 hover:bg-white/20'}`}/>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Outer shell: manages popout state
export function PresentationControls() {
  const { isPopped, setIsPopped } = useControls();

  return (
    <>
      {isPopped && (
        <WindowPortal title="Phoenix Report — Controls" width={1100} height={120} onClose={() => setIsPopped(false)}>
          <ControlsInner isRemote />
        </WindowPortal>
      )}
      {isPopped ? (
        /* Floating reclaim button — top-right, only visible on hover */
        <button
          onClick={() => setIsPopped(false)}
          title="Reclaim controls"
          className="fixed top-3 right-3 z-50 w-7 h-7 flex items-center justify-center rounded-lg text-white/0 hover:text-white/50 hover:bg-white/10 transition-all duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      ) : (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-0 left-0 right-0 z-50">
          <div className="relative">
            <ControlsInner />
            <button onClick={() => setIsPopped(true)} title="Pop controls out to new window" className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/10 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
