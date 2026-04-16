import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { PresentationMode, PresentationState, TimelineSegment } from './types';
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
  | { type: 'REVEAL_ITEM'; id: string }
  | { type: 'REVEAL_ALL' }
  | { type: 'RESET' };

// Separate snapshot of presentation-mode progress, preserved when switching to explore
type PresentationSnapshot = {
  currentSegmentIndex: number;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  revealedIds: Set<string>;
};

const segments = timelineData.presentation.segments;

function getAllIds(): string[] {
  const ids: string[] = [];
  for (const seg of segments) {
    for (const r of seg.reveals) {
      ids.push(r.id);
    }
  }
  return ids;
}

const initialPresentationSnapshot: PresentationSnapshot = {
  currentSegmentIndex: 0,
  segmentElapsedSeconds: 0,
  totalElapsedSeconds: 0,
  revealedIds: new Set(),
};

// Mutable ref-like holder for saved presentation state (lives outside reducer to avoid circular state)
let savedPresentationSnapshot: PresentationSnapshot = { ...initialPresentationSnapshot, revealedIds: new Set() };

const initialState: PresentationState = {
  mode: 'explore',
  currentSegmentIndex: 0,
  segmentElapsedSeconds: 0,
  totalElapsedSeconds: 0,
  isRunning: false,
  revealedIds: new Set(getAllIds()), // Start in explore mode with everything revealed
};

function getSegmentStartTime(index: number): number {
  let t = 0;
  for (let i = 0; i < index; i++) {
    t += segments[i].duration * 60;
  }
  return t;
}

function reducer(state: PresentationState, action: Action): PresentationState {
  switch (action.type) {
    case 'SET_MODE': {
      if (action.mode === 'explore') {
        // Save current presentation state before switching to explore
        if (state.mode === 'presentation') {
          savedPresentationSnapshot = {
            currentSegmentIndex: state.currentSegmentIndex,
            segmentElapsedSeconds: state.segmentElapsedSeconds,
            totalElapsedSeconds: state.totalElapsedSeconds,
            revealedIds: new Set(state.revealedIds),
          };
        }
        return {
          ...state,
          mode: 'explore',
          isRunning: false,
          revealedIds: new Set(getAllIds()),
        };
      }
      // Restore saved presentation state when switching back
      return {
        ...state,
        mode: 'presentation',
        currentSegmentIndex: savedPresentationSnapshot.currentSegmentIndex,
        segmentElapsedSeconds: savedPresentationSnapshot.segmentElapsedSeconds,
        totalElapsedSeconds: savedPresentationSnapshot.totalElapsedSeconds,
        isRunning: false,
        revealedIds: new Set(savedPresentationSnapshot.revealedIds),
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
      // Reveals are ordered by delaySeconds in the YAML; find the first not yet revealed
      const sorted = [...currentSeg.reveals].sort((a, b) => a.delaySeconds - b.delaySeconds);
      const next = sorted.find((r) => !state.revealedIds.has(r.id));
      if (!next) return state;
      return {
        ...state,
        revealedIds: new Set([...state.revealedIds, next.id]),
      };
    }

    case 'PLAY':
      return { ...state, isRunning: true };

    case 'PAUSE':
      return { ...state, isRunning: false };

    case 'NEXT_SEGMENT': {
      const nextIndex = Math.min(state.currentSegmentIndex + 1, segments.length - 1);
      // Reveal everything from previous segments
      const newRevealed = new Set(state.revealedIds);
      for (let i = 0; i <= state.currentSegmentIndex; i++) {
        for (const r of segments[i].reveals) {
          newRevealed.add(r.id);
        }
      }
      return {
        ...state,
        currentSegmentIndex: nextIndex,
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: getSegmentStartTime(nextIndex),
        revealedIds: newRevealed,
      };
    }

    case 'PREV_SEGMENT': {
      const prevIndex = Math.max(state.currentSegmentIndex - 1, 0);
      // Recalculate revealed items for segments up to prevIndex (exclusive)
      const newRevealed = new Set<string>();
      for (let i = 0; i < prevIndex; i++) {
        for (const r of segments[i].reveals) {
          newRevealed.add(r.id);
        }
      }
      return {
        ...state,
        currentSegmentIndex: prevIndex,
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: getSegmentStartTime(prevIndex),
        revealedIds: newRevealed,
      };
    }

    case 'GO_TO_SEGMENT': {
      const idx = Math.max(0, Math.min(action.index, segments.length - 1));
      const newRevealed = new Set<string>();
      for (let i = 0; i < idx; i++) {
        for (const r of segments[i].reveals) {
          newRevealed.add(r.id);
        }
      }
      return {
        ...state,
        currentSegmentIndex: idx,
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: getSegmentStartTime(idx),
        revealedIds: newRevealed,
      };
    }

    case 'REVEAL_ITEM':
      return {
        ...state,
        revealedIds: new Set([...state.revealedIds, action.id]),
      };

    case 'REVEAL_ALL':
      return {
        ...state,
        revealedIds: new Set(getAllIds()),
      };

    case 'RESET':
      return {
        ...state,
        currentSegmentIndex: 0,
        segmentElapsedSeconds: 0,
        totalElapsedSeconds: 0,
        isRunning: false,
        revealedIds: state.mode === 'explore' ? new Set(getAllIds()) : new Set(),
      };

    default:
      return state;
  }
}

export interface SplitInfo {
  /** Seconds elapsed in the current segment */
  segmentElapsed: number;
  /** Target duration for the segment in seconds */
  segmentTarget: number;
  /** Seconds over the target (0 if on-time) */
  overBySeconds: number;
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

  const currentSegment = segments[state.currentSegmentIndex];

  const split: SplitInfo = (() => {
    const seg = currentSegment;
    const target = seg ? seg.duration * 60 : 0;
    const elapsed = state.segmentElapsedSeconds;
    const over = Math.max(0, elapsed - target);
    const reveals = seg?.reveals ?? [];
    const done = reveals.filter((r) => state.revealedIds.has(r.id)).length;
    return {
      segmentElapsed: elapsed,
      segmentTarget: target,
      overBySeconds: over,
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
