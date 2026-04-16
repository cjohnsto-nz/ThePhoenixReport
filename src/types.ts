// Core type definitions for the Phoenix Report

export interface TimelineReveal {
  type: 'challenge' | 'concept' | 'character' | 'epic';
  id: string;
  modalStep?: {
    name?: string;
    script?: string;
  };
  globalStep?: {
    name?: string;
    script?: string;
  };
}

export interface TimelineSegment {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  phase: string;
  narrativeArc?: string;
  takeaway?: string;
  summary?: string;
  reveals: TimelineReveal[];
}

export interface TimelineData {
  presentation: {
    totalDuration: number;
    segments: TimelineSegment[];
  };
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
  type: 'challenge' | 'concept' | 'character' | 'epic';
  id: string;
  revealedAt: number; // timestamp
};

export type PresentationMode = 'presentation' | 'explore';

export type SegmentScreen = 'intro' | 'content' | 'summary';

export type PresentationState = {
  mode: PresentationMode;
  currentSegmentIndex: number;
  segmentScreen: SegmentScreen;
  /** Active step within a content segment. Null means before the first content step. */
  currentContentStepIndex: number | null;
  segmentElapsedSeconds: number;
  totalElapsedSeconds: number;
  isRunning: boolean;
  revealedIds: Set<string>;
  /** Id of item currently shown center-stage (not yet placed in dashboard) */
  stagedId: string | null;
};

export interface PresentationStepInfo {
  id: string;
  name: string;
  script?: string;
  view: 'page' | 'modal' | 'global';
}
