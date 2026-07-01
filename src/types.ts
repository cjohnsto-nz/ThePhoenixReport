export type SlideVariant =
  | 'title'
  | 'statement'
  | 'question'
  | 'list'
  | 'ladder'
  | 'handoff'
  | 'closing';

export interface DeckSlide {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  discussionPrompt?: string;
  speakerNotes?: string;
  variant?: SlideVariant;
}

export interface DeckSegment {
  id: string;
  title: string;
  shortTitle: string;
  start: string;
  end: string;
  accent?: string;
  slides: DeckSlide[];
}

export interface DeckData {
  presentation: {
    title: string;
    subtitle: string;
    totalDuration: number;
    segments: DeckSegment[];
  };
}

export type PresentationState = {
  currentSegmentIndex: number;
  currentSlideIndex: number;
  totalElapsedSeconds: number;
  isRunning: boolean;
};

export interface PresentationStepInfo {
  id: string;
  name: string;
  script?: string;
  segmentTitle: string;
  slideNumber: number;
  totalSlides: number;
}
