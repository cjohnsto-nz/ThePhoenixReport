import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresentation } from '../PresentationContext';
import { useControls } from '../ControlsContext';
import { WindowPortal } from './WindowPortal';
import { lookupItem } from '../data';
import type { TimelineReveal } from '../types';

const LOCAL_TELEPROMPTER_SAVE_ENDPOINT = '/__local/timeline-script';
const TELEPROMPTER_EMPTY_HINT = 'Add modalStep/globalStep script in timeline.yaml to drive the teleprompter.';

type TeleprompterEditTarget =
  | {
      kind: 'segment-page';
      segmentId: string;
      field: 'pageScript';
    }
  | {
      kind: 'content-setup';
      segmentId: string;
      field: 'contentSetupScript';
    }
  | {
      kind: 'segment-summary';
      segmentId: string;
      field: 'summary';
    }
  | {
      kind: 'reveal-step';
      segmentId: string;
      revealId: string;
      step: 'modal' | 'global';
    };

type TeleprompterSaveState =
  | { status: 'idle'; message?: undefined }
  | { status: 'saving'; message: string }
  | { status: 'saved'; message: string }
  | { status: 'error'; message: string };

type RevealScriptBundle = {
  reveal: TimelineReveal;
  modal: {
    name: string;
    script: string;
    target: TeleprompterEditTarget;
  };
  global: {
    name: string;
    script: string;
    target: TeleprompterEditTarget;
  };
};

function getTeleprompterEditTarget({
  currentSegment,
  isStandaloneSegment,
  segmentScreen,
  currentContentStepIndex,
}: {
  currentSegment?: { id: string; reveals: Array<{ id: string }> ; phase?: string };
  isStandaloneSegment: boolean;
  segmentScreen: 'intro' | 'content' | 'summary';
  currentContentStepIndex: number | null;
}): TeleprompterEditTarget | null {
  if (!currentSegment) return null;

  if (isStandaloneSegment || segmentScreen === 'intro') {
    return {
      kind: 'segment-page',
      segmentId: currentSegment.id,
      field: 'pageScript',
    };
  }

  if (segmentScreen === 'summary') {
    return {
      kind: 'segment-summary',
      segmentId: currentSegment.id,
      field: 'summary',
    };
  }

  if (currentContentStepIndex === null) {
    return {
      kind: 'content-setup',
      segmentId: currentSegment.id,
      field: 'contentSetupScript',
    };
  }

  const reveal = currentSegment.reveals[Math.floor(currentContentStepIndex / 2)];
  if (!reveal) return null;

  return {
    kind: 'reveal-step',
    segmentId: currentSegment.id,
    revealId: reveal.id,
    step: currentContentStepIndex % 2 === 0 ? 'modal' : 'global',
  };
}

function describeTeleprompterEditTarget(target: TeleprompterEditTarget | null) {
  if (!target) return 'No editable YAML target for this step.';
  if (target.kind === 'segment-page') return `timeline.yaml -> segment ${target.segmentId} -> ${target.field}`;
  if (target.kind === 'content-setup') return `timeline.yaml -> segment ${target.segmentId} -> ${target.field}`;
  if (target.kind === 'segment-summary') return `timeline.yaml -> segment ${target.segmentId} -> ${target.field}`;
  return `timeline.yaml -> segment ${target.segmentId} -> reveal ${target.revealId} -> ${target.step}Step.script`;
}

function fmt(seconds: number) {
  const abs = Math.abs(seconds);
  const minutes = Math.floor(abs / 60);
  const remainingSeconds = abs % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function splitSeverity(overBy: number) {
  if (overBy <= 0) return { text: 'text-emerald-400', glow: 'rgba(52,211,153,0.32)' };
  if (overBy < 30) return { text: 'text-amber-400', glow: 'rgba(251,191,36,0.35)' };
  if (overBy < 90) return { text: 'text-orange-400', glow: 'rgba(251,146,60,0.4)' };
  return { text: 'text-red-400', glow: 'rgba(248,113,113,0.5)' };
}

function sectionWindow(start: number, end: number) {
  return `${fmt(start)}-${fmt(end)}`;
}

function compactScript(script?: string, limit = 160) {
  if (!script) return 'No script authored yet.';
  if (script.length <= limit) return script;
  return `${script.slice(0, limit - 3)}...`;
}

function getRevealTitle(reveal: TimelineReveal) {
  const item = lookupItem(reveal.type, reveal.id) as { title?: string; name?: string; characterName?: string } | undefined;
  if (typeof item?.characterName === 'string') {
    return `${item.characterName} quote`;
  }
  return item?.title ?? item?.name ?? reveal.id;
}

function getRevealPrimaryScript(reveal: TimelineReveal) {
  const item = lookupItem(reveal.type, reveal.id) as Record<string, unknown> | undefined;
  const text = typeof item?.text === 'string' ? item.text : undefined;
  const description = typeof item?.description === 'string' ? item.description : undefined;
  const impact = typeof item?.impact === 'string' ? item.impact : undefined;
  const arc = typeof item?.arc === 'string' ? item.arc : undefined;
  const subtitle = typeof item?.subtitle === 'string' ? item.subtitle : undefined;
  return text ?? description ?? impact ?? arc ?? subtitle;
}

function getRevealSecondaryScript(reveal: TimelineReveal) {
  const item = lookupItem(reveal.type, reveal.id) as Record<string, unknown> | undefined;
  const text = typeof item?.text === 'string' ? item.text : undefined;
  const impact = typeof item?.impact === 'string' ? item.impact : undefined;
  const arc = typeof item?.arc === 'string' ? item.arc : undefined;
  const subtitle = typeof item?.subtitle === 'string' ? item.subtitle : undefined;
  const description = typeof item?.description === 'string' ? item.description : undefined;
  return impact ?? arc ?? subtitle ?? text ?? description;
}

function getRevealScriptBundle(
  currentSegment: { id: string; reveals: TimelineReveal[] } | undefined,
  currentContentStepIndex: number | null,
) {
  if (!currentSegment || currentContentStepIndex === null) return null;

  const reveal = currentSegment.reveals[Math.floor(currentContentStepIndex / 2)];
  if (!reveal) return null;

  const title = getRevealTitle(reveal);
  return {
    reveal,
    modal: {
      name: reveal.modalStep?.name ?? title,
      script: reveal.modalStep?.script ?? getRevealPrimaryScript(reveal) ?? '',
      target: {
        kind: 'reveal-step',
        segmentId: currentSegment.id,
        revealId: reveal.id,
        step: 'modal',
      },
    },
    global: {
      name: reveal.globalStep?.name ?? `${title} in context`,
      script: reveal.globalStep?.script ?? getRevealSecondaryScript(reveal) ?? getRevealPrimaryScript(reveal) ?? '',
      target: {
        kind: 'reveal-step',
        segmentId: currentSegment.id,
        revealId: reveal.id,
        step: 'global',
      },
    },
  } satisfies RevealScriptBundle;
}

function ModeToggle({ isRemote = false }: { isRemote?: boolean }) {
  const { state, dispatch } = usePresentation();

  return (
    <div
      className={`${isRemote ? 'grid w-full grid-cols-2' : 'flex items-center'} rounded-full p-1 flex-shrink-0 border border-white/[0.07] bg-[#141826]/88 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_32px_-24px_rgba(255,133,17,0.75)]`}
    >
      <button
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'presentation' })}
        className={`${isRemote ? 'w-full px-5 py-2.5 text-sm text-center' : 'px-3 py-1.5 text-xs'} rounded-full font-medium transition-all duration-300 ${
          state.mode === 'presentation'
            ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30'
            : 'text-white/55 hover:text-white/85 hover:bg-white/[0.05]'
        }`}
      >
        Present
      </button>
      <button
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'explore' })}
        className={`${isRemote ? 'w-full px-5 py-2.5 text-sm text-center' : 'px-3 py-1.5 text-xs'} rounded-full font-medium transition-all duration-300 ${
          state.mode === 'explore'
            ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30'
            : 'text-white/55 hover:text-white/85 hover:bg-white/[0.05]'
        }`}
      >
        Explore
      </button>
    </div>
  );
}

function CardLegibilityToggle() {
  const { isCardLegibilityMode, setIsCardLegibilityMode } = useControls();

  return (
    <div className="grid w-full grid-cols-2 rounded-full p-1 border border-white/[0.07] bg-[#141826]/88 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_32px_-24px_rgba(255,133,17,0.45)]">
      <button
        onClick={() => setIsCardLegibilityMode(false)}
        className={`w-full rounded-full px-4 py-2.5 text-sm text-center font-medium transition-all duration-300 ${
          !isCardLegibilityMode
            ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30'
            : 'text-white/55 hover:text-white/85 hover:bg-white/[0.05]'
        }`}
      >
        Standard
      </button>
      <button
        onClick={() => setIsCardLegibilityMode(true)}
        className={`w-full rounded-full px-4 py-2.5 text-sm text-center font-medium transition-all duration-300 ${
          isCardLegibilityMode
            ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/30'
            : 'text-white/55 hover:text-white/85 hover:bg-white/[0.05]'
        }`}
      >
        Legible
      </button>
    </div>
  );
}

function FooterIconButton({
  onClick,
  title,
  disabled = false,
  children,
  accent = false,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
        accent
          ? 'text-phoenix-500/60 hover:text-phoenix-400 hover:bg-phoenix-400/10'
          : 'text-white/35 hover:text-white hover:bg-white/10'
      } disabled:text-white/15 disabled:hover:text-white/15 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

function RemoteTransportButton({
  onClick,
  title,
  disabled = false,
  children,
  tone = 'default',
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: ReactNode;
  tone?: 'default' | 'accent' | 'subtle';
}) {
  const toneClasses =
    tone === 'accent'
      ? 'bg-phoenix-500 text-white shadow-lg shadow-phoenix-500/25 hover:bg-phoenix-400'
      : tone === 'subtle'
        ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
        : 'bg-white/[0.06] text-white/85 hover:bg-white/[0.12]';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-14 rounded-2xl border border-white/[0.08] flex items-center justify-center transition-all ${toneClasses} disabled:opacity-30 disabled:hover:bg-white/[0.06]`}
    >
      {children}
    </button>
  );
}

function SegmentPips() {
  const { state, dispatch, segments } = usePresentation();

  return (
    <div className="flex gap-1.5 flex-shrink-0">
      {segments.map((segment, index) => {
        const isDone = index < state.currentSegmentIndex;
        const isCurrent = index === state.currentSegmentIndex;
        return (
          <button
            key={segment.id}
            onClick={() => dispatch({ type: 'GO_TO_SEGMENT', index })}
            title={segment.title}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? 'w-4 h-2 bg-phoenix-400 shadow-md shadow-phoenix-400/40'
                : isDone
                  ? 'w-2 h-2 bg-phoenix-700/50'
                  : 'w-2 h-2 bg-white/10 hover:bg-white/20'
            }`}
          />
        );
      })}
    </div>
  );
}

function FooterControlsBar() {
  const { state, dispatch, segments, currentSegment, split, currentStep, nextStep } = usePresentation();

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
    <div className="w-full">
      <div className="h-[2px] bg-white/[0.04]">
        <motion.div
          className={`h-full transition-colors duration-700 ${
            isOverTime
              ? 'bg-gradient-to-r from-orange-500 to-red-500'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
          }`}
          style={{ width: `${globalProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="bg-white/[0.035] backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-20px_50px_-40px_rgba(255,133,17,0.5)] px-5 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <ModeToggle />

          <AnimatePresence>
            {state.mode === 'presentation' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="flex items-center gap-1 flex-shrink-0">
                  <FooterIconButton onClick={() => dispatch({ type: 'PREV_SEGMENT' })} title="Previous segment">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                  </FooterIconButton>
                  {!isStandaloneSegment ? (
                    <>
                      <FooterIconButton
                        onClick={() => dispatch({ type: 'REVEAL_PREV' })}
                        disabled={disablePrevStep}
                        title="Previous step"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </FooterIconButton>
                      <FooterIconButton
                        onClick={() => dispatch({ type: 'REVEAL_NEXT' })}
                        disabled={disableNextStep}
                        title="Next step"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </FooterIconButton>
                    </>
                  ) : null}
                  <FooterIconButton onClick={() => dispatch({ type: 'NEXT_SEGMENT' })} title="Next segment">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  </FooterIconButton>
                  <FooterIconButton
                    onClick={() => dispatch({ type: state.isRunning ? 'PAUSE' : 'PLAY' })}
                    title={state.isRunning ? 'Pause timer' : 'Start timer'}
                    accent={!state.isRunning}
                  >
                    {state.isRunning ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </FooterIconButton>
                  <FooterIconButton onClick={() => dispatch({ type: 'RESET' })} title="Reset">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  </FooterIconButton>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentSegment?.id}-${state.segmentScreen}-${currentStep?.id ?? 'none'}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-[10px] text-white/20 uppercase tracking-widest font-medium leading-none mb-0.5">
                      {state.currentSegmentIndex + 1} / {segments.length}
                    </div>
                    <div className="text-sm text-white/55 font-medium truncate leading-tight">{currentSegment?.title}</div>
                    <div className="text-xs text-phoenix-200/80 font-medium truncate leading-tight mt-0.5">
                      {currentStep?.name ?? 'No active step'}
                    </div>
                    <div className="text-xs text-white/40 truncate leading-tight mt-0.5">
                      Next: {nextStep?.name ?? 'End of presentation'}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="w-px h-5 bg-white/[0.07] flex-shrink-0" />
                <div className="flex-shrink-0 text-right">
                  <motion.div
                    animate={split.overBySeconds >= 90 ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
                    className={`text-base font-mono tabular-nums font-semibold leading-none transition-colors duration-700 ${severity.text}`}
                    style={{ textShadow: isOverTime ? `0 0 14px ${severity.glow}` : undefined }}
                  >
                    {isOverTime ? `+${fmt(paceDisplay)}` : `-${fmt(paceDisplay)}`}
                  </motion.div>
                  <div className="text-[10px] text-white/30 font-mono tabular-nums leading-none mt-0.5">{sectionWindow(split.sectionStart, split.sectionEnd)}</div>
                </div>

                <div className="flex-shrink-0 pl-3 border-l border-white/[0.06]">
                  <div className="text-sm font-mono tabular-nums text-white/25 leading-none">{fmt(state.totalElapsedSeconds)}</div>
                  <div className="text-[10px] text-white/25 font-mono tabular-nums leading-none mt-0.5">run time</div>
                </div>

                <div className="pl-1">
                  <SegmentPips />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RemoteControlsView() {
  const { state, dispatch, segments, currentSegment, split, currentStep, nextStep } = usePresentation();
  const { setIsPopped } = useControls();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isLocalTeleprompterEditor = import.meta.env.DEV;
  const [draftScript, setDraftScript] = useState('');
  const [modalDraft, setModalDraft] = useState('');
  const [globalDraft, setGlobalDraft] = useState('');
  const [saveState, setSaveState] = useState<TeleprompterSaveState>({ status: 'idle' });

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
  const contentStepTotal = !isStandaloneSegment && currentSegment ? currentSegment.reveals.length * 2 : 0;
  const contentStepNumber =
    state.segmentScreen === 'content' && state.currentContentStepIndex !== null
      ? state.currentContentStepIndex + 1
      : null;
  const currentEditTarget = getTeleprompterEditTarget({
    currentSegment,
    isStandaloneSegment,
    segmentScreen: state.segmentScreen,
    currentContentStepIndex: state.currentContentStepIndex,
  });
  const canEditCurrentStep = isLocalTeleprompterEditor && Boolean(currentStep && currentEditTarget);
  const currentRevealBundle =
    !isStandaloneSegment && state.segmentScreen === 'content'
      ? getRevealScriptBundle(currentSegment, state.currentContentStepIndex)
      : null;
  const canEditRevealBundle = isLocalTeleprompterEditor && Boolean(currentRevealBundle);
  const activeBundleView = currentStep?.view === 'modal' || currentStep?.view === 'global' ? currentStep.view : null;

  useEffect(() => {
    setDraftScript(currentStep?.script ?? '');
    setModalDraft(currentRevealBundle?.modal.script ?? '');
    setGlobalDraft(currentRevealBundle?.global.script ?? '');
    setSaveState({ status: 'idle' });
  }, [currentStep?.id, currentStep?.script, currentRevealBundle?.reveal.id, currentRevealBundle?.modal.script, currentRevealBundle?.global.script]);

  useEffect(() => {
    if (saveState.status !== 'saved') return;

    const timeout = window.setTimeout(() => {
      setSaveState({ status: 'idle' });
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [saveState]);

  useEffect(() => {
    const popupWindow = rootRef.current?.ownerDocument.defaultView;
    if (!popupWindow) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.mode !== 'presentation') return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isEditable) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch({ type: state.stagedId ? 'REQUEST_STAGE_PLACE' : 'REVEAL_NEXT' });
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch({ type: 'REVEAL_PREV' });
        return;
      }

      if (event.key === 'Escape' && state.stagedId) {
        event.preventDefault();
        dispatch({ type: 'REQUEST_STAGE_PLACE' });
      }
    };

    popupWindow.addEventListener('keydown', handleKeyDown);
    return () => {
      popupWindow.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, state.mode, state.stagedId]);

  const saveTeleprompterScript = async (
    target: TeleprompterEditTarget | null,
    script: string,
    clear = false,
  ) => {
    if (!target) return;

    setSaveState({
      status: 'saving',
      message: clear ? 'Clearing YAML field...' : 'Saving to timeline.yaml...',
    });

    try {
      const response = await fetch(LOCAL_TELEPROMPTER_SAVE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          script,
          clear,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Unable to save YAML (${response.status})`);
      }

      setSaveState({
        status: 'saved',
        message: clear ? 'Cleared YAML field.' : 'Saved to src/data/timeline.yaml.',
      });
    } catch (error) {
      setSaveState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to save YAML.',
      });
    }
  };

  return (
    <div
      ref={rootRef}
      className="h-screen overflow-hidden text-white"
      style={{
        background: 'radial-gradient(circle at top left, rgba(255,133,17,0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(54,104,252,0.14), transparent 30%), #050812',
      }}
    >
      <div className="h-[4px] bg-white/[0.05]">
        <motion.div
          className={`h-full ${isOverTime ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-red-500' : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300'}`}
          style={{ width: `${globalProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="h-[calc(100vh-4px)] overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1380px] flex-col gap-5 px-5 py-5 lg:px-6 lg:py-6">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/25 font-semibold mb-1">Remote Presenter</div>
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-2xl xl:text-[1.85rem] font-semibold text-white truncate">{currentSegment?.title ?? 'Phoenix Report'}</h1>
            </div>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,1.6fr)_340px] gap-5 2xl:grid-cols-[minmax(0,1.7fr)_360px]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden min-h-0 flex flex-col">
              <div className="px-7 pt-6 pb-5 border-b border-white/[0.06]">
                <div className="text-[11px] uppercase tracking-[0.28em] text-phoenix-300/55 font-semibold mb-2">Teleprompter</div>
                <div className="min-w-0">
                  <h2 className="text-[1.85rem] xl:text-[2.15rem] font-semibold tracking-tight text-white leading-tight">
                    {currentStep?.name ?? 'No active step'}
                  </h2>
                  <div className="text-[0.95rem] text-white/40 mt-2">
                    {currentSegment?.title ?? 'Presentation'}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto px-7 py-7 xl:px-8 xl:py-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRevealBundle ? currentRevealBundle.reveal.id : currentStep?.id ?? 'teleprompter-empty'}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full min-h-0"
                  >
                    {currentRevealBundle ? (
                      <div className="grid h-full min-h-0 gap-6 xl:grid-cols-2">
                        <div className={`flex h-full min-h-0 flex-col rounded-2xl border px-5 py-5 transition-colors ${activeBundleView === 'modal' ? 'border-phoenix-400/30 bg-phoenix-500/[0.07]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                          <div className="mb-4">
                            <div className="text-[11px] uppercase tracking-[0.26em] text-phoenix-300/60 font-semibold">Modal Script</div>
                            <div className="text-lg font-semibold text-white/88 mt-2">{currentRevealBundle.modal.name}</div>
                          </div>
                          {canEditRevealBundle ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                              <textarea
                                value={modalDraft}
                                onChange={(event) => setModalDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                                    event.preventDefault();
                                    void saveTeleprompterScript(currentRevealBundle.modal.target, modalDraft, false);
                                  }
                                }}
                                placeholder={TELEPROMPTER_EMPTY_HINT}
                                spellCheck={false}
                                className="min-h-0 flex-1 w-full resize-none overflow-auto border-0 bg-transparent p-0 text-[clamp(1.02rem,1.3vw,1.42rem)] leading-[1.5] text-white/92 placeholder:text-white/24 tracking-[-0.01em] focus:outline-none"
                              />
                              <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
                                <button
                                  onClick={() => void saveTeleprompterScript(currentRevealBundle.modal.target, modalDraft, true)}
                                  disabled={saveState.status === 'saving'}
                                  className="rounded-full border border-white/[0.08] px-3 py-1 text-white/65 transition-colors hover:border-white/[0.14] hover:text-white disabled:cursor-default disabled:text-white/20"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => void saveTeleprompterScript(currentRevealBundle.modal.target, modalDraft, false)}
                                  disabled={saveState.status === 'saving'}
                                  className="rounded-full border border-phoenix-400/20 bg-phoenix-500/10 px-3 py-1 text-phoenix-100/85 transition-colors hover:border-phoenix-300/30 hover:bg-phoenix-500/16 disabled:cursor-default disabled:border-white/[0.08] disabled:bg-white/[0.04] disabled:text-white/20"
                                >
                                  Save modal
                                </button>
                                {activeBundleView === 'modal' ? <span className="text-phoenix-200/70">Active</span> : null}
                              </div>
                            </div>
                          ) : (
                            <p className="min-h-0 flex-1 overflow-auto whitespace-pre-line text-[clamp(1.02rem,1.3vw,1.42rem)] leading-[1.5] text-white/92 tracking-[-0.01em]">
                              {currentRevealBundle.modal.script || TELEPROMPTER_EMPTY_HINT}
                            </p>
                          )}
                        </div>

                        <div className={`flex h-full min-h-0 flex-col rounded-2xl border px-5 py-5 transition-colors ${activeBundleView === 'global' ? 'border-sky-400/30 bg-sky-500/[0.06]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                          <div className="mb-4">
                            <div className="text-[11px] uppercase tracking-[0.26em] text-sky-300/60 font-semibold">Global Script</div>
                            <div className="text-lg font-semibold text-white/88 mt-2">{currentRevealBundle.global.name}</div>
                          </div>
                          {canEditRevealBundle ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                              <textarea
                                value={globalDraft}
                                onChange={(event) => setGlobalDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                                    event.preventDefault();
                                    void saveTeleprompterScript(currentRevealBundle.global.target, globalDraft, false);
                                  }
                                }}
                                placeholder={TELEPROMPTER_EMPTY_HINT}
                                spellCheck={false}
                                className="min-h-0 flex-1 w-full resize-none overflow-auto border-0 bg-transparent p-0 text-[clamp(1.02rem,1.3vw,1.42rem)] leading-[1.5] text-white/92 placeholder:text-white/24 tracking-[-0.01em] focus:outline-none"
                              />
                              <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
                                <button
                                  onClick={() => void saveTeleprompterScript(currentRevealBundle.global.target, globalDraft, true)}
                                  disabled={saveState.status === 'saving'}
                                  className="rounded-full border border-white/[0.08] px-3 py-1 text-white/65 transition-colors hover:border-white/[0.14] hover:text-white disabled:cursor-default disabled:text-white/20"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => void saveTeleprompterScript(currentRevealBundle.global.target, globalDraft, false)}
                                  disabled={saveState.status === 'saving'}
                                  className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-100/85 transition-colors hover:border-sky-300/30 hover:bg-sky-500/16 disabled:cursor-default disabled:border-white/[0.08] disabled:bg-white/[0.04] disabled:text-white/20"
                                >
                                  Save global
                                </button>
                                {activeBundleView === 'global' ? <span className="text-sky-200/70">Active</span> : null}
                              </div>
                            </div>
                          ) : (
                            <p className="min-h-0 flex-1 overflow-auto whitespace-pre-line text-[clamp(1.02rem,1.3vw,1.42rem)] leading-[1.5] text-white/92 tracking-[-0.01em]">
                              {currentRevealBundle.global.script || TELEPROMPTER_EMPTY_HINT}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-0 max-w-[62rem] flex-col">
                        {canEditCurrentStep ? (
                          <textarea
                            value={draftScript}
                            onChange={(event) => setDraftScript(event.target.value)}
                            onKeyDown={(event) => {
                              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                                event.preventDefault();
                                void saveTeleprompterScript(currentEditTarget, draftScript, false);
                              }
                            }}
                            placeholder={TELEPROMPTER_EMPTY_HINT}
                            spellCheck={false}
                            className="min-h-0 flex-1 w-full resize-none overflow-auto border-0 bg-transparent p-0 text-[clamp(1.16rem,1.7vw,1.75rem)] leading-[1.46] text-white/92 placeholder:text-white/24 tracking-[-0.01em] focus:outline-none"
                          />
                        ) : (
                          <p className="min-h-0 flex-1 overflow-auto text-[clamp(1.16rem,1.7vw,1.75rem)] leading-[1.46] text-white/92 whitespace-pre-line tracking-[-0.01em]">
                            {currentStep?.script || TELEPROMPTER_EMPTY_HINT}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="grid content-start gap-4 min-h-0 auto-rows-max">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/28 font-semibold mb-4">Controls</div>
                <div className="grid gap-3">
                  <ModeToggle isRemote />
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Card View</div>
                    <CardLegibilityToggle />
                  </div>
                  <button
                    onClick={() => setIsPopped(false)}
                    className="h-11 px-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                    title="Return controls to the main window"
                  >
                    Dock Controls
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Pace</div>
                  <div className={`text-xl font-mono tabular-nums font-semibold mt-1 ${severity.text}`}>{isOverTime ? `+${fmt(paceDisplay)}` : `-${fmt(paceDisplay)}`}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Run Time</div>
                  <div className="text-xl font-mono tabular-nums font-semibold mt-1 text-white/78">{fmt(state.totalElapsedSeconds)}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Section</div>
                  <div className="text-lg font-mono tabular-nums font-semibold mt-1 text-white/78">{sectionWindow(split.sectionStart, split.sectionEnd)}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Step</div>
                  <div className="text-xl font-mono tabular-nums font-semibold mt-1 text-white/78">
                    {contentStepNumber !== null && contentStepTotal > 0 ? `${contentStepNumber}/${contentStepTotal}` : '--'}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/28 font-semibold mb-4">Transport</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <RemoteTransportButton onClick={() => dispatch({ type: 'PREV_SEGMENT' })} title="Previous segment" tone="subtle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                  </RemoteTransportButton>
                  <RemoteTransportButton
                    onClick={() => dispatch({ type: state.isRunning ? 'PAUSE' : 'PLAY' })}
                    title={state.isRunning ? 'Pause timer' : 'Start timer'}
                    tone="accent"
                  >
                    {state.isRunning ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </RemoteTransportButton>
                  <RemoteTransportButton onClick={() => dispatch({ type: 'NEXT_SEGMENT' })} title="Next segment" tone="subtle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  </RemoteTransportButton>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <RemoteTransportButton
                    onClick={() => dispatch({ type: 'REVEAL_PREV' })}
                    disabled={disablePrevStep}
                    title="Previous step"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      <span className="text-sm font-semibold">Back</span>
                    </div>
                  </RemoteTransportButton>
                  <RemoteTransportButton
                    onClick={() => dispatch({ type: state.stagedId ? 'REQUEST_STAGE_PLACE' : 'REVEAL_NEXT' })}
                    disabled={disableNextStep}
                    title="Next step"
                    tone="accent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Advance</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </RemoteTransportButton>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/28 font-semibold mb-3">Next Step</div>
                <div className="text-xl font-semibold text-white/82 leading-tight">{nextStep?.name ?? 'End of presentation'}</div>
                <div className="mt-2 text-sm text-white/46 leading-relaxed">
                  {compactScript(nextStep?.script)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PresentationControls() {
  const { isPopped, setIsPopped } = useControls();

  return (
    <>
      {isPopped && (
        <WindowPortal
          title="Phoenix Report - Remote Control"
          width={1460}
          height={900}
          onClose={() => setIsPopped(false)}
        >
          <RemoteControlsView />
        </WindowPortal>
      )}
      {isPopped ? (
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
            <FooterControlsBar />
            <button
              onClick={() => setIsPopped(true)}
              title="Pop controls out to new window"
              className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/10 transition-all"
            >
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
