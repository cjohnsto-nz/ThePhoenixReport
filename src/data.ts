import yaml from 'js-yaml';
import type { DeckData, DeckSegment, DeckSlide } from './types';

import deckYaml from './data/deck.yaml?raw';

function parse<T>(raw: string): T {
  return yaml.load(raw) as T;
}

export const deckData = parse<DeckData>(deckYaml);

export function getSlidesBeforeSegment(segments: DeckSegment[], segmentIndex: number) {
  return segments
    .slice(0, segmentIndex)
    .reduce((count, segment) => count + segment.slides.length, 0);
}

export function flattenSlides(segments: DeckSegment[]) {
  return segments.flatMap((segment, segmentIndex) =>
    segment.slides.map((slide, slideIndex) => ({
      segment,
      segmentIndex,
      slide,
      slideIndex,
    })),
  );
}

export function getSlideByAbsoluteIndex(segments: DeckSegment[], absoluteIndex: number) {
  return flattenSlides(segments)[absoluteIndex] ?? null;
}

export function getAbsoluteSlideIndex(segments: DeckSegment[], segmentIndex: number, slideIndex: number) {
  return getSlidesBeforeSegment(segments, segmentIndex) + slideIndex;
}

export function getNextSlide(
  segments: DeckSegment[],
  segmentIndex: number,
  slideIndex: number,
): { segmentIndex: number; slideIndex: number } {
  const segment = segments[segmentIndex];
  if (!segment) return { segmentIndex: 0, slideIndex: 0 };

  if (slideIndex < segment.slides.length - 1) {
    return { segmentIndex, slideIndex: slideIndex + 1 };
  }

  const nextSegmentIndex = Math.min(segmentIndex + 1, segments.length - 1);
  if (nextSegmentIndex === segmentIndex) return { segmentIndex, slideIndex };
  return { segmentIndex: nextSegmentIndex, slideIndex: 0 };
}

export function getPreviousSlide(
  segments: DeckSegment[],
  segmentIndex: number,
  slideIndex: number,
): { segmentIndex: number; slideIndex: number } {
  if (slideIndex > 0) return { segmentIndex, slideIndex: slideIndex - 1 };

  const previousSegmentIndex = Math.max(segmentIndex - 1, 0);
  if (previousSegmentIndex === segmentIndex) return { segmentIndex, slideIndex };

  const previousSegment = segments[previousSegmentIndex];
  return {
    segmentIndex: previousSegmentIndex,
    slideIndex: Math.max(0, previousSegment.slides.length - 1),
  };
}

export function getSlideLeadText(slide: DeckSlide) {
  return slide.discussionPrompt ?? slide.body ?? slide.subtitle ?? slide.title;
}
