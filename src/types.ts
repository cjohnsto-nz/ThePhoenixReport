export type SlideVariant =
  | 'title'
  | 'statement'
  | 'question'
  | 'answer'
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
  timeline?: Array<{
    year: string;
    title: string;
    detail: string;
  }>;
  video?: {
    provider: 'youtube';
    id: string;
    title: string;
    caption?: string;
  };
  diagram?: {
    kind: 'llm-flow' | 'neural-network' | 'scale-curve' | 'agent-loop' | 'target-architecture';
    caption?: string;
  };
  table?: {
    labelColumn?: string;
    columns: string[];
    rows: Array<{
      label: string;
      cells: string[];
    }>;
  };
  brandGroups?: Array<{
    title: string;
    items: Array<{
      name: string;
      detail?: string;
    }>;
  }>;
  comparisons?: {
    beforeLabel?: string;
    afterLabel?: string;
    rows: Array<{
      before: string;
      after: string;
    }>;
  };
  columns?: Array<{
    title: string;
    items: string[];
  }>;
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  code?: string;
  discussionPrompt?: string;
  speakerNotes?: string;
  variant?: SlideVariant;
}

export interface DeckSegment {
  id: string;
  title: string;
  shortTitle: string;
  sectionLabel?: string;
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
