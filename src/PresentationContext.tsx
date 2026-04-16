import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { PresentationMode, PresentationState, SegmentScreen, TimelineSegment } from './types';
import { timelineData } from './data';

// Actions
type Action =
  | { type: 'SET_MODE'; mode: PresentationMode }
  | { type: 'TICK' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
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
  segmentElapsedSeconds: 0,
  totalElapsedSeconds: 0,
  isRunning: false,
  revealedIds: new Set(),
  stagedId: null,
};

function reducer(state: PresentationState, action: Action): PresentationState {
  switch (action.type) {
    case 'SET_MODE': {
      if (action.mode === 'explore') {
        // Save current presentation state before switching to explore
        if (state.mode === 'presentation') {
          savedPresentationSnapshot = {
            currentSegmentIndex: state.currentSegmentIndex,
            segmentScreen: state.segmentScreen,
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

    case 'REVEAL_NEXT': {
      const currentSeg = segments[state.currentSegmentIndex];
      if (!currentSeg) return state;

      if (currentSeg.phase === 'intro' || currentSeg.phase === 'outro') {
        if (state.currentSegmentIndex >= segments.length - 1) return state;
        return {
          ...state,
          currentSegmentIndex: state.currentSegmentIndex + 1,
          segmentScreen: getDefaultSegmentScreen(state.currentSegmentIndex + 1),
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex + 1),
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'intro') {
        return {
          ...state,
          segmentScreen: 'content',
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'summary') {
        if (state.currentSegmentIndex >= segments.length - 1) return state;
        return {
          ...state,
          currentSegmentIndex: state.currentSegmentIndex + 1,
          segmentScreen: getDefaultSegmentScreen(state.currentSegmentIndex + 1),
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsBeforeSegment(state.currentSegmentIndex + 1),
          stagedId: null,
        };
      }

      // Two-phase reveal: first stage center-screen, then place in dashboard
      if (state.stagedId) {
        // Phase 2: place the staged item into the dashboard
        return {
          ...state,
          revealedIds: new Set([...state.revealedIds, state.stagedId]),
          stagedId: null,
        };
      }

      // Phase 1: stage the next unrevealed item (array order = reveal order)
      const next = currentSeg.reveals.find(
        (r) => !state.revealedIds.has(r.id),
      );
      if (!next) {
        return {
          ...state,
          segmentScreen: 'summary',
          stagedId: null,
        };
      }
      return {
        ...state,
        stagedId: next.id,
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
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsThroughSegment(prevIndex),
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'summary') {
        return {
          ...state,
          segmentScreen: 'content',
          stagedId: null,
        };
      }

      if (state.segmentScreen === 'intro') {
        if (state.currentSegmentIndex <= 0) return state;
        const prevIndex = state.currentSegmentIndex - 1;
        return {
          ...state,
          currentSegmentIndex: prevIndex,
          segmentScreen: getTerminalSegmentScreen(prevIndex),
          segmentElapsedSeconds: 0,
          revealedIds: getRevealedIdsThroughSegment(prevIndex),
          stagedId: null,
        };
      }

      if (state.stagedId) {
        return {
          ...state,
          stagedId: null,
        };
      }

      const revealedInSegment = currentSeg.reveals.filter((r) => state.revealedIds.has(r.id));
      const lastRevealed = revealedInSegment[revealedInSegment.length - 1];
      if (!lastRevealed) {
        return {
          ...state,
          segmentScreen: 'intro',
          stagedId: null,
        };
      }

      const revealedIds = new Set(state.revealedIds);
      revealedIds.delete(lastRevealed.id);

      return {
        ...state,
        revealedIds,
        stagedId: lastRevealed.id,
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
        revealedIds: new Set(getAllIds()),
        stagedId: null,
      };

    case 'RESET':
      return {
        ...state,
        currentSegmentIndex: 0,
        segmentScreen: getDefaultSegmentScreen(0),
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: 0,
        isRunning: false,
        revealedIds: state.mode === 'explore' ? new Set(getAllIds()) : new Set(),
        stagedId: null,
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
}

const PresentationContext = createContext<PresentationContextType | null>(null);

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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
    <PresentationContext.Provider value={{ state, dispatch, segments, currentSegment, split }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error('usePresentation must be used within PresentationProvider');
  return ctx;
}
