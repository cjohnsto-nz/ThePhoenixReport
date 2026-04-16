const fs = require('fs');
const yaml = require('js-yaml');

function loadYaml(path) {
  try {
    return yaml.load(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    issues.push({ kind: 'schema', file: path, message: 'YAML parse failed: ' + err.message });
    return null;
  }
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function addMapEntries(map, items, type, file) {
  if (!Array.isArray(items)) {
    issues.push({ kind: 'schema', file, message: `${type} collection is not an array` });
    return;
  }
  for (const [index, item] of items.entries()) {
    const loc = `${file}[${index}]`;
    if (!isObject(item)) {
      issues.push({ kind: 'schema', file, message: `${loc} is not an object` });
      continue;
    }
    if (typeof item.id !== 'string' || !item.id.trim()) {
      issues.push({ kind: 'schema', file, message: `${loc} is missing a string id` });
      continue;
    }
    if (map.has(item.id)) {
      issues.push({ kind: 'schema', file, message: `duplicate ${type} id '${item.id}'` });
      continue;
    }
    map.set(item.id, item);
  }
}

const issues = [];
const unresolved = [];

const timeline = loadYaml('src/data/timeline.yaml');
const charactersDoc = loadYaml('src/data/characters.yaml');
const challengesDoc = loadYaml('src/data/challenges.yaml');
const epicsDoc = loadYaml('src/data/epics.yaml');
const conceptsDoc = loadYaml('src/data/concepts.yaml');

const characters = new Map();
const challenges = new Map();
const epics = new Map();
const concepts = new Map();
const quotes = new Map();

if (!isObject(charactersDoc) || !('characters' in (charactersDoc || {}))) {
  issues.push({ kind: 'schema', file: 'src/data/characters.yaml', message: 'expected top-level characters array' });
} else {
  addMapEntries(characters, charactersDoc.characters, 'character', 'src/data/characters.yaml:characters');
  for (const [index, character] of (charactersDoc.characters || []).entries()) {
    const loc = `src/data/characters.yaml:characters[${index}]`;
    if (!Array.isArray(character.quotes)) {
      issues.push({ kind: 'schema', file: 'src/data/characters.yaml', message: `${loc}.quotes is not an array` });
      continue;
    }
    for (const [qIndex, quote] of character.quotes.entries()) {
      const qLoc = `${loc}.quotes[${qIndex}]`;
      if (!isObject(quote)) {
        issues.push({ kind: 'schema', file: 'src/data/characters.yaml', message: `${qLoc} is not an object` });
        continue;
      }
      if (typeof quote.id !== 'string' || !quote.id.trim()) {
        issues.push({ kind: 'schema', file: 'src/data/characters.yaml', message: `${qLoc} is missing a string id` });
        continue;
      }
      if (quotes.has(quote.id)) {
        const prior = quotes.get(quote.id);
        issues.push({ kind: 'schema', file: 'src/data/characters.yaml', message: `duplicate quote id '${quote.id}' under '${prior.characterId}' and '${character.id}'` });
        continue;
      }
      quotes.set(quote.id, { quote, characterId: character.id });
    }
  }
}

if (!isObject(challengesDoc) || !('challenges' in (challengesDoc || {}))) {
  issues.push({ kind: 'schema', file: 'src/data/challenges.yaml', message: 'expected top-level challenges array' });
} else {
  addMapEntries(challenges, challengesDoc.challenges, 'challenge', 'src/data/challenges.yaml:challenges');
}

if (!isObject(epicsDoc) || !('epics' in (epicsDoc || {}))) {
  issues.push({ kind: 'schema', file: 'src/data/epics.yaml', message: 'expected top-level epics array' });
} else {
  addMapEntries(epics, epicsDoc.epics, 'epic', 'src/data/epics.yaml:epics');
}

if (!isObject(conceptsDoc)) {
  issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: 'expected top-level concepts object' });
} else {
  for (const [sectionName, section] of Object.entries(conceptsDoc)) {
    const loc = `src/data/concepts.yaml:${sectionName}`;
    if (!isObject(section)) {
      issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: `${loc} is not an object` });
      continue;
    }
    if (!Array.isArray(section.items)) {
      issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: `${loc}.items is not an array` });
      continue;
    }
    for (const [index, item] of section.items.entries()) {
      const itemLoc = `${loc}.items[${index}]`;
      if (!isObject(item)) {
        issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: `${itemLoc} is not an object` });
        continue;
      }
      if (typeof item.id !== 'string' || !item.id.trim()) {
        issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: `${itemLoc} is missing a string id` });
        continue;
      }
      if (concepts.has(item.id)) {
        issues.push({ kind: 'schema', file: 'src/data/concepts.yaml', message: `duplicate concept id '${item.id}'` });
        continue;
      }
      concepts.set(item.id, { item, section: sectionName });
    }
  }
}

const revealResolvers = {
  character: id => characters.has(id),
  challenge: id => challenges.has(id),
  epic: id => epics.has(id),
  concept: id => concepts.has(id),
  quote: id => quotes.has(id),
};

if (!isObject(timeline) || !isObject(timeline.presentation)) {
  issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: 'expected presentation object' });
} else if (!Array.isArray(timeline.presentation.segments)) {
  issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: 'presentation.segments is not an array' });
} else {
  for (const [index, segment] of timeline.presentation.segments.entries()) {
    const segLoc = `src/data/timeline.yaml:segments[${index}]`;
    if (!isObject(segment)) {
      issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${segLoc} is not an object` });
      continue;
    }
    if (typeof segment.id !== 'string' || !segment.id.trim()) {
      issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${segLoc} is missing a string id` });
    }
    if (!Array.isArray(segment.reveals)) {
      issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${segLoc}.reveals is not an array` });
      continue;
    }
    for (const [rIndex, reveal] of segment.reveals.entries()) {
      const revealLoc = `${segLoc}.reveals[${rIndex}]`;
      if (!isObject(reveal)) {
        issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc} is not an object` });
        continue;
      }
      if (typeof reveal.type !== 'string' || !reveal.type.trim()) {
        issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc} is missing a string type` });
        continue;
      }
      if (typeof reveal.id !== 'string' || !reveal.id.trim()) {
        issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc} is missing a string id` });
        continue;
      }
      if (!revealResolvers[reveal.type]) {
        issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc} has unsupported reveal type '${reveal.type}'` });
        continue;
      }
      for (const stepName of ['modalStep', 'globalStep']) {
        if (reveal[stepName] !== undefined) {
          if (!isObject(reveal[stepName])) {
            issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc}.${stepName} is not an object` });
          } else {
            if (typeof reveal[stepName].name !== 'string' || !reveal[stepName].name.trim()) {
              issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc}.${stepName}.name is missing a string value` });
            }
            if (typeof reveal[stepName].script !== 'string' || !reveal[stepName].script.trim()) {
              issues.push({ kind: 'schema', file: 'src/data/timeline.yaml', message: `${revealLoc}.${stepName}.script is missing a string value` });
            }
          }
        }
      }
      if (!revealResolvers[reveal.type](reveal.id)) {
        unresolved.push({ segment: segment.id || `index-${index}`, type: reveal.type, id: reveal.id, location: revealLoc });
      }
    }
  }
}

console.log('Validation summary');
console.log(JSON.stringify({
  counts: {
    characters: characters.size,
    quoteIds: quotes.size,
    challenges: challenges.size,
    epics: epics.size,
    concepts: concepts.size,
    timelineSegments: timeline?.presentation?.segments?.length || 0,
    timelineReveals: (timeline?.presentation?.segments || []).reduce((n, s) => n + ((s && Array.isArray(s.reveals)) ? s.reveals.length : 0), 0)
  },
  unresolved,
  issues
}, null, 2));

if (unresolved.length || issues.length) {
  process.exitCode = 1;
}
