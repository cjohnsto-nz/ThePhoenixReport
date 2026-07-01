const fs = require('node:fs');
const yaml = require('js-yaml');

const deckPath = 'src/data/deck.yaml';
const issues = [];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value, path) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(`${path} must be a non-empty string`);
    return false;
  }
  return true;
}

function isClock(value) {
  return typeof value === 'string' && /^\d{2,3}:\d{2}$/.test(value);
}

let deck;
try {
  deck = yaml.load(fs.readFileSync(deckPath, 'utf8'));
} catch (error) {
  console.error(`Unable to parse ${deckPath}: ${error.message}`);
  process.exit(1);
}

if (!isRecord(deck?.presentation)) {
  issues.push('presentation must be an object');
} else {
  requireString(deck.presentation.title, 'presentation.title');
  requireString(deck.presentation.subtitle, 'presentation.subtitle');

  if (!Array.isArray(deck.presentation.segments)) {
    issues.push('presentation.segments must be an array');
  } else {
    const segmentIds = new Set();
    const slideIds = new Set();
    let slideCount = 0;

    deck.presentation.segments.forEach((segment, segmentIndex) => {
      const segmentPath = `presentation.segments[${segmentIndex}]`;
      if (!isRecord(segment)) {
        issues.push(`${segmentPath} must be an object`);
        return;
      }

      if (requireString(segment.id, `${segmentPath}.id`)) {
        if (segmentIds.has(segment.id)) issues.push(`duplicate segment id: ${segment.id}`);
        segmentIds.add(segment.id);
      }

      requireString(segment.title, `${segmentPath}.title`);
      requireString(segment.shortTitle, `${segmentPath}.shortTitle`);
      if (!isClock(segment.start)) issues.push(`${segmentPath}.start must be MM:SS`);
      if (!isClock(segment.end)) issues.push(`${segmentPath}.end must be MM:SS`);

      if (!Array.isArray(segment.slides) || segment.slides.length === 0) {
        issues.push(`${segmentPath}.slides must contain at least one slide`);
        return;
      }

      segment.slides.forEach((slide, slideIndex) => {
        const slidePath = `${segmentPath}.slides[${slideIndex}]`;
        slideCount += 1;

        if (!isRecord(slide)) {
          issues.push(`${slidePath} must be an object`);
          return;
        }

        if (requireString(slide.id, `${slidePath}.id`)) {
          if (slideIds.has(slide.id)) issues.push(`duplicate slide id: ${slide.id}`);
          slideIds.add(slide.id);
        }

        requireString(slide.title, `${slidePath}.title`);

        if (slide.bullets !== undefined) {
          if (!Array.isArray(slide.bullets)) {
            issues.push(`${slidePath}.bullets must be an array`);
          } else {
            slide.bullets.forEach((bullet, bulletIndex) => {
              requireString(bullet, `${slidePath}.bullets[${bulletIndex}]`);
            });
          }
        }
      });
    });

    if (slideCount < 20 || slideCount > 24) {
      issues.push(`deck should contain 20-24 slides; found ${slideCount}`);
    }
  }
}

if (issues.length > 0) {
  console.error('Deck validation failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Deck validation passed.');
