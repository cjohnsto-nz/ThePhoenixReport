import yaml from 'js-yaml';
import type {
  TimelineData,
  ConceptsData,
  CharactersData,
  ChallengesData,
  EpicsData,
  QuoteItem,
} from './types';

// Import raw YAML files
import timelineYaml from './data/timeline.yaml?raw';
import conceptsYaml from './data/concepts.yaml?raw';
import charactersYaml from './data/characters.yaml?raw';
import challengesYaml from './data/challenges.yaml?raw';
import epicsYaml from './data/epics.yaml?raw';

function parse<T>(raw: string): T {
  return yaml.load(raw) as T;
}

export const timelineData = parse<TimelineData>(timelineYaml);
export const conceptsData = parse<ConceptsData>(conceptsYaml);
export const charactersData = parse<CharactersData>(charactersYaml);
export const challengesData = parse<ChallengesData>(challengesYaml);
export const epicsData = parse<EpicsData>(epicsYaml);

// Helper to look up any item by id across all data sources
export function lookupItem(type: string, id: string) {
  if (type === 'challenge') {
    return challengesData.challenges.find((c) => c.id === id);
  }
  if (type === 'character') {
    return charactersData.characters.find((c) => c.id === id);
  }
  if (type === 'quote') {
    for (const character of charactersData.characters) {
      const quote = character.quotes?.find((entry) => entry.id === id);
      if (quote) {
        const item: QuoteItem = {
          id: quote.id,
          text: quote.text,
          characterId: character.id,
          characterName: character.name,
          characterRole: character.role,
          avatar: character.avatar,
          color: character.color,
        };
        return item;
      }
    }
  }
  if (type === 'epic') {
    return epicsData.epics.find((e) => e.id === id);
  }
  if (type === 'concept') {
    // Search through all concept locations
    const ftow = conceptsData.fourTypesOfWork;
    const tw = conceptsData.threeWays;

    // Four types items
    const found =
      ftow.items.find((i) => i.id === id) ??
      tw.items.find((i) => i.id === id);

    if (found) return found;

    // Search principles within ways
    for (const way of tw.items) {
      const principle = way.principles.find((p) => p.id === id);
      if (principle) return { ...principle, color: way.color, parentWay: way.title };
    }
  }
  return undefined;
}
