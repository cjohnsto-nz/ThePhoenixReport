import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { DeckSegment, DeckSlide, PresentationState, PresentationStepInfo } from './types';
import {
  deckData,
  flattenSlides,
  getAbsoluteSlideIndex,
  getNextSlide,
  getPreviousSlide,
} from './data';

const SESSION_STORAGE_KEY = 'ai-offsite-presentation-state';

type Action =
  | { type: 'TICK' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'NEXT_SEGMENT' }
  | { type: 'PREV_SEGMENT' }
  | { type: 'GO_TO_SEGMENT'; index: number }
  | { type: 'GO_TO_SLIDE'; absoluteIndex: number }
  | { type: 'RESET' };

const segments = deckData.presentation.segments;
const flattenedSlides = flattenSlides(segments);
const totalSlides = flattenedSlides.length;

function parseClockToSeconds(clock: string): number {
  const [minutes, seconds] = clock.split(':').map(Number);
  return minutes * 60 + seconds;
}

function getTotalTargetSeconds() {
  const lastSegment = segments[segments.length - 1];
  return lastSegment ? parseClockToSeconds(lastSegment.end) : deckData.presentation.totalDuration * 60;
}

function clampSegmentIndex(index: number) {
  return Math.max(0, Math.min(index, segments.length - 1));
}

function clampSlideIndex(segment: DeckSegment | undefined, index: number) {
  if (!segment) return 0;
  return Math.max(0, Math.min(index, segment.slides.length - 1));
}

function getInitialState(): PresentationState {
  return {
    currentSegmentIndex: 0,
    currentSlideIndex: 0,
    totalElapsedSeconds: 0,
    isRunning: false,
  };
}

function loadInitialState(): PresentationState {
  if (typeof window === 'undefined') return getInitialState();

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return getInitialState();

    const parsed = JSON.parse(raw) as PresentationState;
    const segmentIndex = clampSegmentIndex(parsed.currentSegmentIndex);
    return {
      currentSegmentIndex: segmentIndex,
      currentSlideIndex: clampSlideIndex(segments[segmentIndex], parsed.currentSlideIndex),
      totalElapsedSeconds: Number.isFinite(parsed.totalElapsedSeconds) ? parsed.totalElapsedSeconds : 0,
      isRunning: false,
    };
  } catch {
    return getInitialState();
  }
}

function reducer(state: PresentationState, action: Action): PresentationState {
  switch (action.type) {
    case 'TICK':
      return state.isRunning
        ? { ...state, totalElapsedSeconds: state.totalElapsedSeconds + 1 }
        : state;

    case 'PLAY':
      return { ...state, isRunning: true };

    case 'PAUSE':
      return { ...state, isRunning: false };

    case 'NEXT_SLIDE': {
      const next = getNextSlide(segments, state.currentSegmentIndex, state.currentSlideIndex);
      return {
        ...state,
        currentSegmentIndex: next.segmentIndex,
        currentSlideIndex: next.slideIndex,
      };
    }

    case 'PREV_SLIDE': {
      const previous = getPreviousSlide(segments, state.currentSegmentIndex, state.currentSlideIndex);
      return {
        ...state,
        currentSegmentIndex: previous.segmentIndex,
        currentSlideIndex: previous.slideIndex,
      };
    }

    case 'NEXT_SEGMENT': {
      const nextIndex = clampSegmentIndex(state.currentSegmentIndex + 1);
      return {
        ...state,
        currentSegmentIndex: nextIndex,
        currentSlideIndex: 0,
      };
    }

    case 'PREV_SEGMENT': {
      const previousIndex = clampSegmentIndex(state.currentSegmentIndex - 1);
      return {
        ...state,
        currentSegmentIndex: previousIndex,
        currentSlideIndex: 0,
      };
    }

    case 'GO_TO_SEGMENT': {
      const index = clampSegmentIndex(action.index);
      return {
        ...state,
        currentSegmentIndex: index,
        currentSlideIndex: 0,
      };
    }

    case 'GO_TO_SLIDE': {
      const target = flattenedSlides[Math.max(0, Math.min(action.absoluteIndex, totalSlides - 1))];
      if (!target) return state;
      return {
        ...state,
        currentSegmentIndex: target.segmentIndex,
        currentSlideIndex: target.slideIndex,
      };
    }

    case 'RESET':
      return getInitialState();

    default:
      return state;
  }
}

export interface SplitInfo {
  elapsed: number;
  target: number;
  overallTarget: number;
  sectionStart: number;
  sectionEnd: number;
  sectionBudget: number;
  overBySeconds: number;
  remainingSeconds: number;
  slideTotal: number;
  slideDone: number;
}

interface PresentationContextType {
  state: PresentationState;
  dispatch: React.Dispatch<Action>;
  deckTitle: string;
  deckSubtitle: string;
  segments: DeckSegment[];
  slides: typeof flattenedSlides;
  currentSegment: DeckSegment;
  currentSlide: DeckSlide;
  currentAbsoluteIndex: number;
  split: SplitInfo;
  currentStep: PresentationStepInfo;
  nextStep: PresentationStepInfo | null;
}

const PresentationContext = createContext<PresentationContextType | null>(null);

function toStepInfo(
  segment: DeckSegment,
  slide: DeckSlide,
  absoluteIndex: number,
): PresentationStepInfo {
  return {
    id: slide.id,
    name: slide.title,
    script: slide.speakerNotes,
    segmentTitle: segment.title,
    slideNumber: absoluteIndex + 1,
    totalSlides,
  };
}

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...state, isRunning: false }),
    );
  }, [state]);

  useEffect(() => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentSegment = segments[state.currentSegmentIndex] ?? segments[0];
  const currentSlide = currentSegment.slides[state.currentSlideIndex] ?? currentSegment.slides[0];
  const currentAbsoluteIndex = getAbsoluteSlideIndex(
    segments,
    state.currentSegmentIndex,
    state.currentSlideIndex,
  );
  const nextSlide = flattenedSlides[currentAbsoluteIndex + 1] ?? null;

  const split = useMemo<SplitInfo>(() => {
    const sectionStart = parseClockToSeconds(currentSegment.start);
    const sectionEnd = parseClockToSeconds(currentSegment.end);
    const target = sectionEnd || getTotalTargetSeconds();
    const overBySeconds = Math.max(0, state.totalElapsedSeconds - target);
    return {
      elapsed: state.totalElapsedSeconds,
      target,
      overallTarget: getTotalTargetSeconds(),
      sectionStart,
      sectionEnd,
      sectionBudget: Math.max(0, sectionEnd - sectionStart),
      overBySeconds,
      remainingSeconds: Math.max(0, target - state.totalElapsedSeconds),
      slideTotal: totalSlides,
      slideDone: currentAbsoluteIndex + 1,
    };
  }, [currentAbsoluteIndex, currentSegment, state.totalElapsedSeconds]);

  const currentStep = toStepInfo(currentSegment, currentSlide, currentAbsoluteIndex);
  const nextStep = nextSlide
    ? toStepInfo(nextSlide.segment, nextSlide.slide, currentAbsoluteIndex + 1)
    : null;

  return (
    <PresentationContext.Provider
      value={{
        state,
        dispatch,
        deckTitle: deckData.presentation.title,
        deckSubtitle: deckData.presentation.subtitle,
        segments,
        slides: flattenedSlides,
        currentSegment,
        currentSlide,
        currentAbsoluteIndex,
        split,
        currentStep,
        nextStep,
      }}
    >
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error('usePresentation must be used within PresentationProvider');
  return ctx;
}
