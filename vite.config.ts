import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import yamlPlugin from '@modyfi/vite-plugin-yaml';
import yaml from 'js-yaml';

type TimelineScriptTarget =
  | {
      kind: 'segment-page';
      segmentId: string;
      field: 'pageScript';
    }
  | {
      kind: 'content-setup';
      segmentId: string;
      field: 'contentSetupScript';
    }
  | {
      kind: 'segment-summary';
      segmentId: string;
      field: 'summary';
    }
  | {
      kind: 'reveal-step';
      segmentId: string;
      revealId: string;
      step: 'modal' | 'global';
    };

type TimelineScriptRequest = {
  target?: TimelineScriptTarget;
  script?: unknown;
  clear?: boolean;
};

type TimelineRevealRecord = Record<string, unknown> & {
  id?: string;
};

type TimelineSegmentRecord = Record<string, unknown> & {
  id?: string;
  reveals?: TimelineRevealRecord[];
};

type TimelineDocument = {
  presentation?: {
    segments?: TimelineSegmentRecord[];
  };
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readRequestBody(request: IncomingMessage) {
  return await new Promise<string>((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      resolve(body);
    });

    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function splitLines(raw: string) {
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  return {
    newline,
    lines: raw.split(/\r?\n/),
  };
}

function joinLines(lines: string[], newline: string) {
  return lines.join(newline);
}

function findSegmentRange(lines: string[], segmentId: string) {
  const pattern = new RegExp(`^(\\s*)- id:\\s*${escapeRegExp(segmentId)}\\s*$`);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(pattern);
    if (!match) continue;

    const indent = match[1];
    const nextSegmentPattern = new RegExp(`^${escapeRegExp(indent)}- id:`);
    let end = lines.length;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (nextSegmentPattern.test(lines[cursor])) {
        end = cursor;
        break;
      }
    }

    return {
      start: index,
      end,
      indent,
      fieldIndent: `${indent}  `,
    };
  }

  throw new Error(`Unable to find segment '${segmentId}' in timeline.yaml.`);
}

function findFieldRange(lines: string[], start: number, end: number, indent: string, fieldName: string) {
  const fieldPattern = new RegExp(`^${escapeRegExp(indent)}${escapeRegExp(fieldName)}:`);

  for (let index = start; index < end; index += 1) {
    if (!fieldPattern.test(lines[index])) continue;

    let cursor = index + 1;
    while (cursor < end) {
      const line = lines[cursor];
      if (line.trim().length === 0) {
        cursor += 1;
        continue;
      }

      const lineIndent = line.match(/^\s*/)?.[0].length ?? 0;
      if (lineIndent <= indent.length) break;
      cursor += 1;
    }

    return {
      start: index,
      end: cursor,
    };
  }

  return null;
}

function formatYamlScalar(value: unknown) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  return JSON.stringify(value);
}

function formatYamlScriptLines(indent: string, fieldName: string, script: string) {
  const scriptLines = script.split(/\r?\n/);
  return [
    `${indent}${fieldName}: |-`,
    ...scriptLines.map((line) => `${indent}  ${line}`),
  ];
}

function replaceLineRange(lines: string[], start: number, end: number, replacement: string[]) {
  lines.splice(start, end - start, ...replacement);
}

function buildRevealLines(reveal: TimelineRevealRecord, revealIndent: string) {
  const fieldIndent = `${revealIndent}  `;
  const nestedIndent = `${fieldIndent}  `;
  const nextLines: string[] = [];
  const stepKeys = new Set(['modalStep', 'globalStep']);
  const knownKeys = ['type', 'id', 'delaySeconds'];

  if (typeof reveal.type !== 'string' || typeof reveal.id !== 'string') {
    throw new Error('Reveal is missing required type/id fields.');
  }

  nextLines.push(`${revealIndent}- type: ${formatYamlScalar(reveal.type)}`);

  for (const key of knownKeys) {
    if (key === 'type') continue;
    if (reveal[key] === undefined) continue;
    nextLines.push(`${fieldIndent}${key}: ${formatYamlScalar(reveal[key])}`);
  }

  const extraKeys = Object.keys(reveal).filter((key) => !knownKeys.includes(key) && !stepKeys.has(key));
  for (const key of extraKeys) {
    nextLines.push(`${fieldIndent}${key}: ${formatYamlScalar(reveal[key])}`);
  }

  for (const stepKey of ['modalStep', 'globalStep'] as const) {
    const stepValue = reveal[stepKey];
    if (!isRecord(stepValue) || Object.keys(stepValue).length === 0) continue;

    nextLines.push(`${fieldIndent}${stepKey}:`);

    if (typeof stepValue.name === 'string') {
      nextLines.push(`${nestedIndent}name: ${formatYamlScalar(stepValue.name)}`);
    }

    if (typeof stepValue.script === 'string') {
      nextLines.push(...formatYamlScriptLines(nestedIndent, 'script', stepValue.script));
    }

    for (const key of Object.keys(stepValue)) {
      if (key === 'name' || key === 'script') continue;
      nextLines.push(`${nestedIndent}${key}: ${formatYamlScalar(stepValue[key])}`);
    }
  }

  return nextLines;
}

function updateSegmentFieldText(raw: string, target: Exclude<TimelineScriptTarget, { kind: 'reveal-step' }>, script: string, clear: boolean) {
  const { lines, newline } = splitLines(raw);
  const segmentRange = findSegmentRange(lines, target.segmentId);
  const fieldRange = findFieldRange(lines, segmentRange.start + 1, segmentRange.end, segmentRange.fieldIndent, target.field);

  if (clear) {
    if (fieldRange) {
      replaceLineRange(lines, fieldRange.start, fieldRange.end, []);
    }
    return joinLines(lines, newline);
  }

  const replacement = formatYamlScriptLines(segmentRange.fieldIndent, target.field, script);
  if (fieldRange) {
    replaceLineRange(lines, fieldRange.start, fieldRange.end, replacement);
    return joinLines(lines, newline);
  }

  const revealsIndex = lines.findIndex(
    (line, index) =>
      index > segmentRange.start &&
      index < segmentRange.end &&
      line === `${segmentRange.fieldIndent}reveals:`,
  );

  const insertAt = revealsIndex >= 0 ? revealsIndex : segmentRange.end;
  replaceLineRange(lines, insertAt, insertAt, replacement);
  return joinLines(lines, newline);
}

function updateRevealStepText(raw: string, target: Extract<TimelineScriptTarget, { kind: 'reveal-step' }>, script: string, clear: boolean) {
  const parsed = yaml.load(raw) as TimelineDocument;
  const segments = parsed.presentation?.segments;
  if (!Array.isArray(segments)) {
    throw new Error('timeline.yaml is missing presentation.segments.');
  }

  const segment = segments.find((candidate) => candidate.id === target.segmentId);
  if (!segment) {
    throw new Error(`Unable to find segment '${target.segmentId}'.`);
  }

  const reveals = Array.isArray(segment.reveals) ? segment.reveals : [];
  const reveal = reveals.find((candidate) => candidate.id === target.revealId);
  if (!reveal) {
    throw new Error(`Unable to find reveal '${target.revealId}' in segment '${target.segmentId}'.`);
  }

  const stepKey = target.step === 'modal' ? 'modalStep' : 'globalStep';
  const stepValue = isRecord(reveal[stepKey]) ? { ...reveal[stepKey] } : {};

  if (clear) {
    delete stepValue.script;
  } else {
    stepValue.script = script;
  }

  if (Object.keys(stepValue).length === 0) {
    delete reveal[stepKey];
  } else {
    reveal[stepKey] = stepValue;
  }

  const { lines, newline } = splitLines(raw);
  const segmentRange = findSegmentRange(lines, target.segmentId);
  const revealsLineIndex = lines.findIndex(
    (line, index) =>
      index > segmentRange.start &&
      index < segmentRange.end &&
      line === `${segmentRange.fieldIndent}reveals:`,
  );
  if (revealsLineIndex < 0) {
    throw new Error(`Segment '${target.segmentId}' has no reveals block.`);
  }

  const revealIndent = `${segmentRange.fieldIndent}  `;
  const revealFieldIndent = `${revealIndent}  `;
  const revealStartPattern = new RegExp(`^${escapeRegExp(revealIndent)}- `);
  const inlineIdPattern = new RegExp(`\\bid:\\s*['\"]?${escapeRegExp(target.revealId)}['\"]?(?:[,}\\s]|$)`);
  const nestedIdPattern = new RegExp(`^${escapeRegExp(revealFieldIndent)}id:\\s*['\"]?${escapeRegExp(target.revealId)}['\"]?\\s*$`);

  for (let index = revealsLineIndex + 1; index < segmentRange.end; index += 1) {
    if (!revealStartPattern.test(lines[index])) continue;

    let end = index + 1;
    while (end < segmentRange.end && !revealStartPattern.test(lines[end])) {
      end += 1;
    }

    const matchesInline = inlineIdPattern.test(lines[index]);
    const matchesNested = lines.slice(index + 1, end).some((line) => nestedIdPattern.test(line));
    if (!matchesInline && !matchesNested) continue;

    replaceLineRange(lines, index, end, buildRevealLines(reveal, revealIndent));
    return joinLines(lines, newline);
  }

  throw new Error(`Unable to find reveal '${target.revealId}' in timeline.yaml text.`);
}

function localTimelineEditorPlugin(): Plugin {
  const timelinePath = path.resolve(process.cwd(), 'src/data/timeline.yaml');

  return {
    name: 'local-timeline-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/__local/timeline-script')) {
          next();
          return;
        }

        if (request.method !== 'POST') {
          sendJson(response, 405, { error: 'Method not allowed.' });
          return;
        }

        try {
          const payload = JSON.parse(await readRequestBody(request)) as TimelineScriptRequest;
          if (!payload.target) {
            throw new Error('Missing teleprompter target.');
          }

          const raw = await fs.readFile(timelinePath, 'utf8');
          const clear = payload.clear === true;
          const script = typeof payload.script === 'string' ? payload.script : '';

          const nextRaw = payload.target.kind === 'reveal-step'
            ? updateRevealStepText(raw, payload.target, script, clear)
            : updateSegmentFieldText(raw, payload.target, script, clear);

          await fs.writeFile(timelinePath, nextRaw, 'utf8');
          server.ws.send({ type: 'full-reload', path: '*' });

          sendJson(response, 200, {
            ok: true,
            file: 'src/data/timeline.yaml',
          });
        } catch (error) {
          sendJson(response, 400, {
            error: error instanceof Error ? error.message : 'Unable to update timeline.yaml.',
          });
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ThePhoenixReport/' : '/',
  plugins: [react(), yamlPlugin(), localTimelineEditorPlugin()],
  assetsInclude: ['**/*.yaml', '**/*.yml'],
}));
