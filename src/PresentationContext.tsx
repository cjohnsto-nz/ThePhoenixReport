import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { PresentationMode, PresentationState, SegmentScreen, TimelineReveal, TimelineSegment, PresentationStepInfo } from './types';
import { lookupItem, timelineData } from './data';

const SESSION_STORAGE_KEY = 'phoenix-report-presentation-state';

// Actions
type Action =
  | { type: 'SET_MODE'; mode: PresentationMode }
  | { type: 'TICK' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'REQUEST_STAGE_PLACE' }
  | { type: 'NEXT_SEGMENT' }
  | { type: 'PREV_SEGMENT' }
  | { type: 'GO_TO_SEGMENT'; index: number }
  | { type: 'REVEAL_NEXT' }
  | { type: 'REVEAL_PREV' }
  | { type: 'REVEAL_ITEM'; id: string }
  | { type: 'REVEAL_ALL' }
  | { type: 'RESET' };

// Separate snapshot of presentation-mode progress, preserved when switching to explore
type PresentationSnapshot = {
  currentSegmentIndex: number;
  segmentScreen: SegmentScreen;
  currentContentStepIndex: number | null;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  revealedIds: Set<string>;
  stagedId: string | null;
};

const segments = timelineData.presentation.segments;

function parseClockToSeconds(clock: string): number {
  const [minutes, seconds] = clock.split(':').map(Number);
  return minutes * 60 + seconds;
}

function getSegmentBudgetSeconds(segment: TimelineSegment): number {
  return Math.max(0, parseClockToSeconds(segment.end) - parseClockToSeconds(segment.start));
}

function getTotalTargetSeconds(): number {
  const lastSegment = segments[segments.length - 1];
  return lastSegment ? parseClockToSeconds(lastSegment.end) : 0;
}

type DerivedContentStep = {
  id: string;
  name: string;
  script?: string;
  view: 'modal' | 'global';
  reveal: TimelineReveal;
};

function getRevealTitle(reveal: TimelineReveal): string {
  const item = lookupItem(reveal.type, reveal.id) as { title?: string; name?: string; characterName?: string } | undefined;
  if (typeof item?.characterName === 'string') {
    return `${item.characterName} quote`;
  }
  return item?.title ?? item?.name ?? reveal.id;
}

function getRevealPrimaryScript(reveal: TimelineReveal): string | undefined {
  const item = lookupItem(reveal.type, reveal.id) as Record<string, unknown> | undefined;
  const text = typeof item?.text === 'string' ? item.text : undefined;
  const description = typeof item?.description === 'string' ? item.description : undefined;
  const impact = typeof item?.impact === 'string' ? item.impact : undefined;
  const arc = typeof item?.arc === 'string' ? item.arc : undefined;
  const subtitle = typeof item?.subtitle === 'string' ? item.subtitle : undefined;
  return text ?? description ?? impact ?? arc ?? subtitle;
}

function getRevealSecondaryScript(reveal: TimelineReveal): string | undefined {
  const item = lookupItem(reveal.type, reveal.id) as Record<string, unknown> | undefined;
  const text = typeof item?.text === 'string' ? item.text : undefined;
  const impact = typeof item?.impact === 'string' ? item.impact : undefined;
  const arc = typeof item?.arc === 'string' ? item.arc : undefined;
  const subtitle = typeof item?.subtitle === 'string' ? item.subtitle : undefined;
  const description = typeof item?.description === 'string' ? item.description : undefined;
  return impact ?? arc ?? subtitle ?? text ?? description;
}

function getContentSteps(segment: TimelineSegment): DerivedContentStep[] {
  if (segment.phase === 'intro' || segment.phase === 'outro') return [];

  return segment.reveals.flatMap((reveal) => {
    const title = getRevealTitle(reveal);
    return [
      {
        id: `${reveal.id}:modal`,
        name: reveal.modalStep?.name ?? title,
        script: reveal.modalStep?.script ?? getRevealPrimaryScript(reveal),
        view: 'modal' as const,
        reveal,
      },
      {
        id: `${reveal.id}:global`,
        name: reveal.globalStep?.name ?? `${title} in context`,
        script: reveal.globalStep?.script ?? getRevealSecondaryScript(reveal) ?? getRevealPrimaryScript(reveal),
        view: 'global' as const,
        reveal,
      },
    ];
  });
}

function getContentStateForStep(segmentIndex: number, stepIndex: number | null) {
  const revealedIds = getRevealedIdsBeforeSegment(segmentIndex);
  if (stepIndex === null) {
    return { revealedIds, stagedId: null as string | null };
  }

  const segment = segments[segmentIndex];
  const steps = segment ? getContentSteps(segment) : [];
  if (steps.length === 0) {
    return { revealedIds, stagedId: null as string | null };
  }

  const clampedIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
  for (let index = 0; index <= clampedIndex; index += 1) {
    if (steps[index].view === 'global') {
      revealedIds.add(steps[index].reveal.id);
    }
  }

  const activeStep = steps[clampedIndex];
  return {
    revealedIds,
    stagedId: activeStep.view === 'modal' ? activeStep.reveal.id : null,
  };
}

function toPresentationStepInfo(step: DerivedContentStep): PresentationStepInfo {
  return {
    id: step.id,
    name: step.name,
    script: step.script,
    view: step.view,
  };
}

function getIntroStepInfo(segment: TimelineSegment): PresentationStepInfo {
  return {
    id: `${segment.id}:intro`,
    name: `${segment.title} intro`,
    script: segment.pageScript ?? segment.narrativeArc ?? segment.subtitle,
    view: 'page',
  };
}

function getSummaryStepInfo(segment: TimelineSegment): PresentationStepInfo {
  return {
    id: `${segment.id}:summary`,
    name: `${segment.title} summary`,
    script: segment.summary ?? segment.takeaway ?? segment.subtitle,
    view: 'page',
  };
}

function getStandaloneStepInfo(segment: TimelineSegment): PresentationStepInfo {
  return {
    id: `${segment.id}:standalone`,
    name: segment.title,
    script: segment.pageScript ?? segment.narrativeArc ?? segment.takeaway ?? segment.subtitle,
    view: 'page',
  };
}

function getSegmentEntryStepInfo(index: number): PresentationStepInfo | null {
  const segment = segments[index];
  if (!segment) return null;
  if (segment.phase === 'intro' || segment.phase === 'outro') {
    return getStandaloneStepInfo(segment);
  }
  return getIntroStepInfo(segment);
}

function getCurrentPresentationStepInfo(state: PresentationState): PresentationStepInfo | null {
  const segment = segments[state.currentSegmentIndex];
  if (!segment) return null;

  if (segment.phase === 'intro' || segment.phase === 'outro') {
    return getStandaloneStepInfo(segment);
  }

  if (state.segmentScreen === 'intro') {
    return getIntroStepInfo(segment);
  }

  if (state.segmentScreen === 'summary') {
    return getSummaryStepInfo(segment);
  }

  const steps = getContentSteps(segment);
  if (state.currentContentStepIndex === null || steps.length === 0) {
    return {
      id: `${segment.id}:content-start`,
      name: `${segment.title} setup`,
      script: segment.contentSetupScript ?? segment.narrativeArc ?? segment.subtitle,
      view: 'page',
    };
  }

  return toPresentationStepInfo(steps[Math.max(0, Math.min(state.currentContentStepIndex, steps.length - 1))]);
}

function getNextPresentationStepInfo(state: PresentationState): PresentationStepInfo | null {
  const segment = segments[state.currentSegmentIndex];
  if (!segment) return null;

  if (segment.phase === 'intro' || segment.phase === 'outro') {
    return getSegmentEntryStepInfo(state.currentSegmentIndex + 1);
  }

  if (state.segmentScreen === 'intro') {
    const steps = getContentSteps(segment);
    return steps[0] ? toPresentationStepInfo(steps[0]) : getSummaryStepInfo(segment);
  }

  if (state.segmentScreen === 'summary') {
    return getSegmentEntryStepInfo(state.currentSegmentIndex + 1);
  }

  const steps = getContentSteps(segment);
  const nextIndex = state.currentContentStepIndex === null ? 0 : state.currentContentStepIndex + 1;
  if (steps[nextIndex]) {
    return toPresentationStepInfo(steps[nextIndex]);
  }

  return getSummaryStepInfo(segment);
}

function getAllIds(): string[] {
  const ids: string[] = [];
  for (const seg of segments) {
    for (const r of seg.reveals) {
      ids.push(r.id);
    }
  }
  return ids;
}

function getDefaultSegmentScreen(index: number): SegmentScreen {
  const seg = segments[index];
  if (!seg) return 'content';
  return seg.phase === 'intro' || seg.phase === 'outro' ? 'content' : 'intro';
}

function getTerminalSegmentScreen(index: number): SegmentScreen {
  const seg = segments[index];
  if (!seg) return 'content';
  return seg.phase === 'intro' || seg.phase === 'outro' ? 'content' : 'summary';
}

function getRevealedIdsBeforeSegment(index: number): Set<string> {
  const revealed = new Set<string>();
  for (let i = 0; i < index; i++) {
    for (const r of segments[i].reveals) {
      revealed.add(r.id);
    }
  }
  return revealed;
}

function getRevealedIdsThroughSegment(index: number): Set<string> {
  const revealed = new Set<string>();
  for (let i = 0; i <= index; i++) {
    for (const r of segments[i].reveals) {
      revealed.add(r.id);
    }
  }
  return revealed;
}

const initialPresentationSnapshot: PresentationSnapshot = {
  currentSegmentIndex: 0,
  segmentScreen: getDefaultSegmentScreen(0),
  currentContentStepIndex: null,
  segmentElapsedSeconds: 0,
  totalElapsedSeconds: 0,
  revealedIds: new Set(),
  stagedId: null,
};

// Mutable ref-like holder for saved presentation state (lives outside reducer to avoid circular state)
let savedPresentationSnapshot: PresentationSnapshot = { ...initialPresentationSnapshot, revealedIds: new Set(), stagedId: null };

const initialState: PresentationState = {
  mode: 'presentation',
  currentSegmentIndex: 0,
  segmentScreen: getDefaultSegmentScreen(0),
  currentContentStepIndex: null,
  segmentElapsedSeconds: 0,
  totalElapsedSeconds: 0,
  isRunning: false,
  revealedIds: new Set(),
  stagedId: null,
  placementRequestKey: 0,
};

type PersistedPresentationSnapshot = {
  currentSegmentIndex: number;
  segmentScreen: SegmentScreen;
  currentContentStepIndex: number | null;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  revealedIds: string[];
  stagedId: string | null;
};

type PersistedPresentationState = {
  mode: PresentationMode;
  currentSegmentIndex: number;
  segmentScreen: SegmentScreen;
  currentContentStepIndex: number | null;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  isRunning: boolean;
  revealedIds: string[];
  stagedId: string | null;
  savedPresentationSnapshot: PersistedPresentationSnapshot;
};

function serializeSnapshot(snapshot: PresentationSnapshot): PersistedPresentationSnapshot {
  return {
    currentSegmentIndex: snapshot.currentSegmentIndex,
    segmentScreen: snapshot.segmentScreen,
    currentContentStepIndex: snapshot.currentContentStepIndex,
    segmentElapsedSeconds: snapshot.segmentElapsedSeconds,
    totalElapsedSeconds: snapshot.totalElapsedSeconds,
    revealedIds: Array.from(snapshot.revealedIds),
    stagedId: snapshot.stagedId,
  };
}

function hydrateSnapshot(snapshot: PersistedPresentationSnapshot): PresentationSnapshot {
  return {
    currentSegmentIndex: snapshot.currentSegmentIndex,
    segmentScreen: snapshot.segmentScreen,
    currentContentStepIndex: snapshot.currentContentStepIndex,
    segmentElapsedSeconds: snapshot.segmentElapsedSeconds,
    totalElapsedSeconds: snapshot.totalElapsedSeconds,
    revealedIds: new Set(snapshot.revealedIds),
    stagedId: snapshot.stagedId,
  };
}

function loadInitialState(): PresentationState {
  if (typeof window === 'undefined') return initialState;

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return initialState;

    const parsed = JSON.parse(raw) as PersistedPresentationState;
    if (!parsed || !parsed.savedPresentationSnapshot) return initialState;

    savedPresentationSnapshot = hydrateSnapshot(parsed.savedPresentationSnapshot);

    return {
      mode: parsed.mode,
      currentSegmentIndex: parsed.currentSegmentIndex,
      segmentScreen: parsed.segmentScreen,
      currentContentStepIndex: parsed.currentContentStepIndex,
      segmentElapsedSeconds: parsed.segmentElapsedSeconds,
      totalElapsedSeconds: parsed.totalElapsedSeconds,
      isRunning: false,
      revealedIds: new Set(parsed.revealedIds),
      stagedId: parsed.stagedId,
      placementRequestKey: 0,
    };
  } catch {
    return initialState;
  }
}

function reducer(state: PresentationState, action: Action): PresentationState {
  switch (action.type) {
    case 'SET_MODE': {
      if (action.mode === 'explore') {
        // Save current presentation state before switching to explore
        if (state.mode === 'presentation') {
          savedPresentationSnapshot = {
            currentSegmentIndex: state.currentSegmentIndex,
            segmentScreen: state.segmentScreen,
            currentContentStepIndex: state.currentContentStepIndex,
            segmentElapsedSeconds: state.segmentElapsedSeconds,
            totalElapsedSeconds: state.totalElapsedSeconds,
            revealedIds: new Set(state.revealedIds),
            stagedId: state.stagedId,
          };
        }
        return {
          ...state,
          mode: 'explore',
          isRunning: false,
          currentContentStepIndex: null,
          revealedIds: new Set(getAllIds()),
          stagedId: null,
        };
      }
      // Restore saved presentation state when switching back
      return {
        ...state,
        mode: 'presentation',
        currentSegmentIndex: savedPresentationSnapshot.currentSegmentIndex,
        segmentScreen: savedPresentationSnapshot.segmentScreen,
        currentContentStepIndex: savedPresentationSnapshot.currentContentStepIndex,
        segmentElapsedSeconds: savedPresentationSnapshot.segmentElapsedSeconds,
        totalElapsedSeconds: savedPresentationSnapshot.totalElapsedSeconds,
        isRunning: false,
        revealedIds: new Set(savedPresentationSnapshot.revealedIds),
        stagedId: savedPresentationSnapshot.stagedId,
      };
    }

    case 'TICK': {
      if (!state.isRunning || state.mode !== 'presentation') return state;
      // Timer only — reveals are manual via REVEAL_NEXT
      return {
        ...state,
        segmentElapsedSeconds: state.segmentElapsedSeconds + 1,
        totalElapsedSeconds: state.totalElapsedSeconds + 1,
      };
    }

    case 'REQUEST_STAGE_PLACE': {
      if (!state.stagedId) return state;
      return {
        ...state,
        placementRequestKey: state.placementRequestKey + 1,
      };
    }

    case 'REVEAL_NEXT': {
      const currentSeg = segments[state.currentSegmentIndex];
      if (!currentSeg) return state;

      if (currentSeg.phase === 'intro' || currentSeg.phase === 'outro') {
        if (state.currentSegmentIndex >= segments.length - 1) return state;
        return {
          ...state,
          currentSegmentIndex: state.currentSegmentIndex + 1,
          segmentScreen: getDefaultSegmentScreen(state.currentSegmentIndex + 1),
          currentContentStepIndex: null,
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex + 1),
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'intro') {
        return {
          ...state,
          segmentScreen: 'content',
          currentContentStepIndex: null,
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'summary') {
        if (state.currentSegmentIndex >= segments.length - 1) return state;
        return {
          ...state,
          currentSegmentIndex: state.currentSegmentIndex + 1,
          segmentScreen: getDefaultSegmentScreen(state.currentSegmentIndex + 1),
          currentContentStepIndex: null,
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex + 1),
          stagedId: null,
        };
      }

      const steps = getContentSteps(currentSeg);
      const nextStepIndex = state.currentContentStepIndex === null ? 0 : state.currentContentStepIndex + 1;
      if (!steps[nextStepIndex]) {
        return {
          ...state,
          currentContentStepIndex: null,
          segmentScreen: 'summary',
          revealedIds: getRevealedIdsThroughSegment(state.currentSegmentIndex),
          stagedId: null,
        };
      }

      const nextContentState = getContentStateForStep(state.currentSegmentIndex, nextStepIndex);
      return {
        ...state,
        currentContentStepIndex: nextStepIndex,
        revealedIds: nextContentState.revealedIds,
        stagedId: nextContentState.stagedId,
      };
    }

    case 'REVEAL_PREV': {
      const currentSeg = segments[state.currentSegmentIndex];
      if (!currentSeg) return state;

      if (currentSeg.phase === 'intro' || currentSeg.phase === 'outro') {
        if (state.currentSegmentIndex <= 0) return state;
        const prevIndex = state.currentSegmentIndex - 1;
        return {
          ...state,
          currentSegmentIndex: prevIndex,
          segmentScreen: getTerminalSegmentScreen(prevIndex),
          currentContentStepIndex: null,
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsThroughSegment(prevIndex),
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'summary') {
        return {
          ...state,
          segmentScreen: 'content',
          currentContentStepIndex: Math.max(0, getContentSteps(currentSeg).length - 1),
          ...getContentStateForStep(state.currentSegmentIndex, Math.max(0, getContentSteps(currentSeg).length - 1)),
        };
      }

      if (state.segmentScreen === 'intro') {
        if (state.currentSegmentIndex <= 0) return state;
        const prevIndex = state.currentSegmentIndex - 1;
        return {
          ...state,
          currentSegmentIndex: prevIndex,
          segmentScreen: getTerminalSegmentScreen(prevIndex),
          currentContentStepIndex: null,
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsThroughSegment(prevIndex),
          stagedId: null,
        };
      }

      if (state.currentContentStepIndex === null) {
        return {
          ...state,
          currentContentStepIndex: null,
          segmentScreen: 'intro',
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex),
          stagedId: null,
        };
      }

      const prevStepIndex = state.currentContentStepIndex - 1;
      if (prevStepIndex < 0) {
        return {
          ...state,
          currentContentStepIndex: null,
          segmentScreen: 'intro',
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex),
          stagedId: null,
        };
      }

      const prevContentState = getContentStateForStep(state.currentSegmentIndex, prevStepIndex);

      return {
        ...state,
        currentContentStepIndex: prevStepIndex,
        revealedIds: prevContentState.revealedIds,
        stagedId: prevContentState.stagedId,
      };
    }

    case 'PLAY':
      return { ...state, isRunning: true };

    case 'PAUSE':
      return { ...state, isRunning: false };

    case 'NEXT_SEGMENT': {
      const nextIndex = Math.min(state.currentSegmentIndex + 1, segments.length - 1);
      const newRevealed = getRevealedIdsBeforeSegment(nextIndex);
      return {
        ...state,
        currentSegmentIndex: nextIndex,
        segmentScreen: getDefaultSegmentScreen(nextIndex),
        currentContentStepIndex: null,
        segmentElapsedSeconds: 0,
        revealedIds: newRevealed,
        stagedId: null,
      };
    }

    case 'PREV_SEGMENT': {
      const prevIndex = Math.max(state.currentSegmentIndex - 1, 0);
      const newRevealed = getRevealedIdsBeforeSegment(prevIndex);
      return {
        ...state,
        currentSegmentIndex: prevIndex,
        segmentScreen: getDefaultSegmentScreen(prevIndex),
        currentContentStepIndex: null,
        segmentElapsedSeconds: 0,
        revealedIds: newRevealed,
        stagedId: null,
      };
    }

    case 'GO_TO_SEGMENT': {
      const idx = Math.max(0, Math.min(action.index, segments.length - 1));
      const newRevealed = getRevealedIdsBeforeSegment(idx);
      return {
        ...state,
        currentSegmentIndex: idx,
        segmentScreen: getDefaultSegmentScreen(idx),
        currentContentStepIndex: null,
        segmentElapsedSeconds: 0,
        revealedIds: newRevealed,
        stagedId: null,
      };
    }

    case 'REVEAL_ITEM':
      return {
        ...state,
        revealedIds: new Set([...state.revealedIds, action.id]),
        stagedId: state.stagedId === action.id ? null : state.stagedId,
      };

    case 'REVEAL_ALL':
      return {
        ...state,
        currentContentStepIndex: null,
        revealedIds: new Set(getAllIds()),
        stagedId: null,
      };

    case 'RESET':
      return {
        ...state,
        currentSegmentIndex: 0,
        segmentScreen: getDefaultSegmentScreen(0),
        currentContentStepIndex: null,
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: 0,
        isRunning: false,
        revealedIds: state.mode === 'explore' ? new Set(getAllIds()) : new Set(),
        stagedId: null,
        placementRequestKey: 0,
      };

    default:
      return state;
  }
}

export interface SplitInfo {
  /** Total runtime so far */
  elapsed: number;
  /** Current segment cumulative split target in seconds */
  target: number;
  /** Full presentation target duration in seconds */
  overallTarget: number;
  /** Current section start time in seconds */
  sectionStart: number;
  /** Current section end time in seconds */
  sectionEnd: number;
  /** Current section budget in seconds */
  sectionBudget: number;
  /** Seconds over the target (0 if on-time) */
  overBySeconds: number;
  /** Seconds remaining to the target (0 if overtime) */
  remainingSeconds: number;
  /** How many reveals are queued in this segment */
  revealTotal: number;
  /** How many have been revealed so far */
  revealDone: number;
  /** True when all items in this segment are revealed */
  allRevealed: boolean;
}

interface PresentationContextType {
  state: PresentationState;
  dispatch: React.Dispatch<Action>;
  segments: TimelineSegment[];
  currentSegment: TimelineSegment | undefined;
  split: SplitInfo;
  currentStep: PresentationStepInfo | null;
  nextStep: PresentationStepInfo | null;
}

const PresentationContext = createContext<PresentationContextType | null>(null);

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const persistedState: PersistedPresentationState = {
      mode: state.mode,
      currentSegmentIndex: state.currentSegmentIndex,
      segmentScreen: state.segmentScreen,
      currentContentStepIndex: state.currentContentStepIndex,
      segmentElapsedSeconds: state.segmentElapsedSeconds,
      totalElapsedSeconds: state.totalElapsedSeconds,
      isRunning: false,
      revealedIds: Array.from(state.revealedIds),
      stagedId: state.stagedId,
      savedPresentationSnapshot: serializeSnapshot(savedPresentationSnapshot),
    };

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persistedState));
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.mode !== 'presentation') return;
      if (state.stagedId) return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isEditable) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch({ type: 'REVEAL_NEXT' });
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch({ type: 'REVEAL_PREV' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.mode, state.stagedId]);

  const currentSegment = segments[state.currentSegmentIndex];
  const currentStep = getCurrentPresentationStepInfo(state);
  const nextStep = getNextPresentationStepInfo(state);

  const split: SplitInfo = (() => {
    const seg = currentSegment;
    const overallTarget = getTotalTargetSeconds();
    const elapsed = state.totalElapsedSeconds;
    const sectionStart = seg ? parseClockToSeconds(seg.start) : 0;
    const sectionEnd = seg ? parseClockToSeconds(seg.end) : 0;
    const target = sectionEnd || overallTarget;
    const over = Math.max(0, elapsed - target);
    const remaining = Math.max(0, target - elapsed);
    const reveals = seg?.reveals ?? [];
    const done = reveals.filter((r) => state.revealedIds.has(r.id)).length;
    return {
      elapsed,
      target,
      overallTarget,
      sectionStart,
      sectionEnd,
      sectionBudget: seg ? getSegmentBudgetSeconds(seg) : 0,
      overBySeconds: over,
      remainingSeconds: remaining,
      revealTotal: reveals.length,
      revealDone: done,
      allRevealed: done === reveals.length,
    };
  })();

  return (
    <PresentationContext.Provider value={{ state, dispatch, segments, currentSegment, split, currentStep, nextStep }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error('usePresentation must be used within PresentationProvider');
  return ctx;
}
