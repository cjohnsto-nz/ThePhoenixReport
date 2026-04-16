// Core type definitions for the Phoenix Report

export interface TimelineRevealStep {
  name?: string;
  script?: string;
}

export interface TimelineReveal {
  type: 'challenge' | 'concept' | 'character' | 'epic' | 'quote';
  id: string;
  delaySeconds?: number;
  modalStep?: TimelineRevealStep;
  globalStep?: TimelineRevealStep;
  quoteReveal?: boolean;
}

export interface TimelineSegment {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  duration?: number;
  phase: string;
  narrativeArc?: string;
  takeaway?: string;
  summary?: string;
  pageScript?: string;
  contentSetupScript?: string;
  reveals: TimelineReveal[];
}

export interface TimelineData {
  presentation: {
    totalDuration: number;
    segments: TimelineSegment[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
}

export interface SegmentLessons {
  segmentId: string;
  items: Lesson[];
}

export interface LessonsData {
  segments: SegmentLessons[];
}

export interface ConceptItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  examples?: string[];
  icon: string;
  color: string;
}

export interface ConceptPrinciple {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  parentWay?: string;
}

export interface WayItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  principles: ConceptPrinciple[];
}

export interface ConceptsData {
  fourTypesOfWork: {
    title: string;
    description: string;
    icon: string;
    color: string;
    items: ConceptItem[];
  };
  threeWays: {
    title: string;
    description: string;
    icon: string;
    color: string;
    items: WayItem[];
  };
}

export interface QuoteItem {
  id: string;
  text: string;
  characterId?: string;
  characterName: string;
  characterRole: string;
  avatar: string;
  color: string;
  imagePath?: string;
  imageAlt?: string;
  imageCaption?: string;
  revealId?: string;
  segment?: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  archetype: string;
  traits: string;
  segment: string;
  reportsTo: string | null;
  description: string;
  arc: string;
  quote: string;
  avatar: string;
  color: string;
  quotes?: QuoteItem[];
}

export interface CharactersData {
  characters: Character[];
}

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  segment: string;
  description: string;
  impact: string;
  icon: string;
  severity: 'critical' | 'high' | 'medium';
  color: string;
}

export interface ChallengesData {
  challenges: Challenge[];
}

export interface Epic {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  icon: string;
  color: string;
}

export interface EpicsData {
  epics: Epic[];
}

export type RevealedItem = {
  type: 'challenge' | 'concept' | 'character' | 'epic' | 'quote';
  id: string;
  revealedAt: number;
};

export type PresentationMode = 'presentation' | 'explore';

export type SegmentScreen = 'intro' | 'content' | 'summary';

export type PresentationState = {
  mode: PresentationMode;
  currentSegmentIndex: number;
  segmentScreen: SegmentScreen;
  currentContentStepIndex: number | null;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  isRunning: boolean;
  revealedIds: Set<string>;
  stagedId: string | null;
};

export interface PresentationStepInfo {
  id: string;
  name: string;
  script?: string;
  view: 'page' | 'modal' | 'global';
}
