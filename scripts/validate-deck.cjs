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
      if (segment.sectionLabel !== undefined) {
        requireString(segment.sectionLabel, `${segmentPath}.sectionLabel`);
      }
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

        if (slide.code !== undefined) {
          requireString(slide.code, `${slidePath}.code`);
        }

        if (slide.timeline !== undefined) {
          if (!Array.isArray(slide.timeline) || slide.timeline.length === 0) {
            issues.push(`${slidePath}.timeline must contain at least one item`);
          } else {
            slide.timeline.forEach((item, itemIndex) => {
              const itemPath = `${slidePath}.timeline[${itemIndex}]`;
              if (!isRecord(item)) {
                issues.push(`${itemPath} must be an object`);
                return;
              }

              requireString(item.year, `${itemPath}.year`);
              requireString(item.title, `${itemPath}.title`);
              requireString(item.detail, `${itemPath}.detail`);
            });
          }
        }

        if (slide.video !== undefined) {
          if (!isRecord(slide.video)) {
            issues.push(`${slidePath}.video must be an object`);
          } else {
            if (slide.video.provider !== 'youtube') {
              issues.push(`${slidePath}.video.provider must be youtube`);
            }
            requireString(slide.video.id, `${slidePath}.video.id`);
            requireString(slide.video.title, `${slidePath}.video.title`);
            if (slide.video.caption !== undefined) {
              requireString(slide.video.caption, `${slidePath}.video.caption`);
            }
          }
        }

        if (slide.diagram !== undefined) {
          if (!isRecord(slide.diagram)) {
            issues.push(`${slidePath}.diagram must be an object`);
          } else {
            if (!['llm-flow', 'neural-network', 'scale-curve', 'agent-loop', 'target-architecture'].includes(slide.diagram.kind)) {
              issues.push(`${slidePath}.diagram.kind must be llm-flow, neural-network, scale-curve, agent-loop, or target-architecture`);
            }
            if (slide.diagram.caption !== undefined) {
              requireString(slide.diagram.caption, `${slidePath}.diagram.caption`);
            }
          }
        }

        if (slide.table !== undefined) {
          if (!isRecord(slide.table)) {
            issues.push(`${slidePath}.table must be an object`);
          } else {
            if (slide.table.labelColumn !== undefined) {
              requireString(slide.table.labelColumn, `${slidePath}.table.labelColumn`);
            }

            if (!Array.isArray(slide.table.columns) || slide.table.columns.length === 0) {
              issues.push(`${slidePath}.table.columns must contain at least one column`);
            } else {
              slide.table.columns.forEach((column, columnIndex) => {
                requireString(column, `${slidePath}.table.columns[${columnIndex}]`);
              });
            }

            if (!Array.isArray(slide.table.rows) || slide.table.rows.length === 0) {
              issues.push(`${slidePath}.table.rows must contain at least one row`);
            } else {
              slide.table.rows.forEach((row, rowIndex) => {
                const rowPath = `${slidePath}.table.rows[${rowIndex}]`;
                if (!isRecord(row)) {
                  issues.push(`${rowPath} must be an object`);
                  return;
                }

                requireString(row.label, `${rowPath}.label`);
                if (!Array.isArray(row.cells) || row.cells.length === 0) {
                  issues.push(`${rowPath}.cells must contain at least one cell`);
                } else {
                  row.cells.forEach((cell, cellIndex) => {
                    requireString(cell, `${rowPath}.cells[${cellIndex}]`);
                  });
                }
              });
            }
          }
        }

        if (slide.brandGroups !== undefined) {
          if (!Array.isArray(slide.brandGroups) || slide.brandGroups.length === 0) {
            issues.push(`${slidePath}.brandGroups must contain at least one group`);
          } else {
            slide.brandGroups.forEach((group, groupIndex) => {
              const groupPath = `${slidePath}.brandGroups[${groupIndex}]`;
              if (!isRecord(group)) {
                issues.push(`${groupPath} must be an object`);
                return;
              }

              requireString(group.title, `${groupPath}.title`);
              if (!Array.isArray(group.items) || group.items.length === 0) {
                issues.push(`${groupPath}.items must contain at least one item`);
              } else {
                group.items.forEach((item, itemIndex) => {
                  const itemPath = `${groupPath}.items[${itemIndex}]`;
                  if (!isRecord(item)) {
                    issues.push(`${itemPath} must be an object`);
                    return;
                  }

                  requireString(item.name, `${itemPath}.name`);
                  if (item.detail !== undefined) {
                    requireString(item.detail, `${itemPath}.detail`);
                  }
                });
              }
            });
          }
        }

        if (slide.comparisons !== undefined) {
          if (!isRecord(slide.comparisons)) {
            issues.push(`${slidePath}.comparisons must be an object`);
          } else {
            if (slide.comparisons.beforeLabel !== undefined) {
              requireString(slide.comparisons.beforeLabel, `${slidePath}.comparisons.beforeLabel`);
            }

            if (slide.comparisons.afterLabel !== undefined) {
              requireString(slide.comparisons.afterLabel, `${slidePath}.comparisons.afterLabel`);
            }

            if (!Array.isArray(slide.comparisons.rows) || slide.comparisons.rows.length === 0) {
              issues.push(`${slidePath}.comparisons.rows must contain at least one row`);
            } else {
              slide.comparisons.rows.forEach((row, rowIndex) => {
                const rowPath = `${slidePath}.comparisons.rows[${rowIndex}]`;
                if (!isRecord(row)) {
                  issues.push(`${rowPath} must be an object`);
                  return;
                }

                requireString(row.before, `${rowPath}.before`);
                requireString(row.after, `${rowPath}.after`);
              });
            }
          }
        }

        if (slide.columns !== undefined) {
          if (!Array.isArray(slide.columns)) {
            issues.push(`${slidePath}.columns must be an array`);
          } else {
            slide.columns.forEach((column, columnIndex) => {
              const columnPath = `${slidePath}.columns[${columnIndex}]`;
              if (!isRecord(column)) {
                issues.push(`${columnPath} must be an object`);
                return;
              }

              requireString(column.title, `${columnPath}.title`);
              if (!Array.isArray(column.items) || column.items.length === 0) {
                issues.push(`${columnPath}.items must contain at least one item`);
              } else {
                column.items.forEach((item, itemIndex) => {
                  requireString(item, `${columnPath}.items[${itemIndex}]`);
                });
              }
            });
          }
        }

        if (slide.image !== undefined) {
          if (!isRecord(slide.image)) {
            issues.push(`${slidePath}.image must be an object`);
          } else {
            requireString(slide.image.src, `${slidePath}.image.src`);
            requireString(slide.image.alt, `${slidePath}.image.alt`);
            if (slide.image.caption !== undefined) {
              requireString(slide.image.caption, `${slidePath}.image.caption`);
            }
          }
        }
      });
    });

    if (slideCount < 32 || slideCount > 72) {
      issues.push(`deck should contain 32-72 slides; found ${slideCount}`);
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
