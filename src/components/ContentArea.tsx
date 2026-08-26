import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useControls } from '../ControlsContext';
import { usePresentation } from '../PresentationContext';
import type { DeckSegment, DeckSlide, PresentationStepInfo } from '../types';

interface SlideEntry {
  segment: DeckSegment;
  segmentIndex: number;
  slide: DeckSlide;
  slideIndex: number;
}

function twoDigit(value: number) {
  return value.toString().padStart(2, '0');
}

function splitParagraphs(value?: string) {
  return value?.split(/\n+/).map((line) => line.trim()).filter(Boolean) ?? [];
}

function assetUrl(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
}

function withAlpha(color: string, alphaHex: string) {
  return /^#[\da-f]{6}$/i.test(color) ? `${color}${alphaHex}` : color;
}

function ArrowIcon() {
  return (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none" aria-hidden="true">
      <path d="M2 10H31" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M24 3L32 10L24 17" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function SlideBullets({ slide }: { slide: DeckSlide }) {
  if (!slide.bullets?.length) return null;

  if (slide.variant === 'title') {
    return (
      <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {slide.bullets.map((bullet, index) => (
          <div key={bullet} className="flex min-w-0 items-center gap-4">
            <span className="text-2xl font-semibold text-[var(--segment-accent)]">{twoDigit(index + 1)}</span>
            <span className="h-8 w-px bg-white/18" />
            <span className="text-xl font-medium text-white/92">{bullet}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-5xl divide-y divide-white/10 border-y border-white/10">
      {slide.bullets.map((bullet, index) => (
        <div key={bullet} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 py-4">
          <span className="font-mono text-sm text-[var(--segment-accent)]">{twoDigit(index + 1)}</span>
          <span className="text-2xl leading-snug text-white/90">{bullet}</span>
        </div>
      ))}
    </div>
  );
}

function SlideBody({ slide }: { slide: DeckSlide }) {
  const paragraphs = splitParagraphs(slide.body);
  if (paragraphs.length === 0) return null;

  return (
    <div className="mt-8 max-w-5xl space-y-5">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-3xl leading-snug text-white/82">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function DiscussionPrompt({ slide }: { slide: DeckSlide }) {
  if (!slide.discussionPrompt) return null;

  return (
    <div className="mt-12 max-w-5xl border-t pt-6" style={{ borderTopColor: 'var(--segment-accent)' }}>
      <p className="text-3xl leading-snug text-white">{slide.discussionPrompt}</p>
    </div>
  );
}

function SlideCode({ slide }: { slide: DeckSlide }) {
  if (!slide.code) return null;
  const lineCount = slide.code.split('\n').length;
  const isDense = lineCount > 12 || slide.code.length > 520;

  return (
    <pre className={`mt-10 max-w-6xl overflow-hidden border border-white/14 bg-white/[0.035] p-7 font-mono leading-relaxed text-white/88 shadow-[0_0_40px_var(--segment-accent-glow)] ${
      isDense ? 'text-[0.95rem]' : 'text-xl'
    }`}>
      <code>{slide.code}</code>
    </pre>
  );
}

function SlideImage({ slide, prominent = false }: { slide: DeckSlide; prominent?: boolean }) {
  if (!slide.image) return null;

  return (
    <figure className={prominent ? 'm-0 max-w-full' : 'mt-8 max-w-5xl'}>
      <img
        src={assetUrl(slide.image.src)}
        alt={slide.image.alt}
        className={`max-w-full border border-white/16 bg-white object-contain shadow-[0_0_48px_var(--segment-accent-glow)] ${
          prominent ? 'max-h-[42rem]' : 'max-h-[26rem]'
        }`}
      />
      {slide.image.caption && (
        <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">
          {slide.image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function SlideComparisons({ slide }: { slide: DeckSlide }) {
  if (!slide.comparisons?.rows.length) return null;

  const beforeLabel = slide.comparisons.beforeLabel ?? 'Then';
  const afterLabel = slide.comparisons.afterLabel ?? 'Now';

  return (
    <div className="mt-10 max-w-6xl">
      <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] gap-5 font-mono text-xs uppercase text-white/42">
        <div>{beforeLabel}</div>
        <div />
        <div>{afterLabel}</div>
      </div>
      <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
        {slide.comparisons.rows.map((row, index) => (
          <motion.div
            key={`${row.before}-${row.after}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-5 py-5"
          >
            <div className="text-2xl leading-snug text-white/62">{row.before}</div>
            <div className="flex justify-center text-[var(--segment-accent)]">
              <ArrowIcon />
            </div>
            <div className="text-2xl font-semibold leading-snug text-white">{row.after}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideTimeline({ slide }: { slide: DeckSlide }) {
  if (!slide.timeline?.length) return null;

  const timelineItems = slide.timeline;
  const groups = timelineItems.reduce<Array<{ year: string; items: NonNullable<DeckSlide['timeline']> }>>((acc, item) => {
    const existing = acc.find((group) => group.year === item.year);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ year: item.year, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="mt-8 max-w-[88rem]">
      <div className="relative">
        <div className="absolute left-0 right-0 top-[3.35rem] h-px bg-white/18" />
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
        >
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.year}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.055, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-w-0"
            >
              <div className="h-12 font-mono text-xl text-[var(--segment-accent)]">{group.year}</div>
              <div className="relative z-10 h-3 w-3 border border-[var(--segment-accent)] bg-[#030506] shadow-[0_0_18px_var(--segment-accent-glow)]" />
              <div className="mt-5 space-y-3 border-l border-white/12 pl-3">
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={`${item.year}-${item.title}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: groupIndex * 0.055 + itemIndex * 0.045 + 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative"
                  >
                    <div className="absolute -left-[0.98rem] top-2 h-1.5 w-1.5 bg-[var(--segment-accent)]" />
                    <div className="text-[0.98rem] font-semibold leading-tight text-white">{item.title}</div>
                    <div className="mt-1 text-[0.78rem] leading-snug text-white/58">{item.detail}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideVideo({ slide, printable = false }: { slide: DeckSlide; printable?: boolean }) {
  if (!slide.video) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${slide.video.id}`;
  const src = `https://www.youtube-nocookie.com/embed/${slide.video.id}?rel=0`;

  if (printable) {
    return (
      <figure className="mt-10 max-w-5xl">
        <div className="aspect-video border border-white/16 bg-black p-10 shadow-[0_0_48px_var(--segment-accent-glow)]">
          <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Video</div>
          <div className="mt-8 text-4xl font-semibold leading-tight text-white">{slide.video.title}</div>
          <div className="mt-8 max-w-3xl font-mono text-lg leading-relaxed text-white/62">{watchUrl}</div>
        </div>
        {slide.video.caption && (
          <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">
            {slide.video.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="mt-10 max-w-5xl">
      <div className="aspect-video overflow-hidden border border-white/16 bg-black shadow-[0_0_48px_var(--segment-accent-glow)]">
        <iframe
          className="h-full w-full"
          src={src}
          title={slide.video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {slide.video.caption && (
        <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">
          {slide.video.caption}
        </figcaption>
      )}
    </figure>
  );
}

function LlmFlowDiagram({ caption }: { caption?: string }) {
  const contextItems = ['instructions', 'prompt', 'history', 'documents', 'examples', 'tool results'];

  return (
    <figure className="mt-10 max-w-6xl">
      <div className="relative min-h-[22rem] border border-white/12 bg-white/[0.018] p-8">
        <div className="mx-auto max-w-4xl border border-[var(--segment-accent)]/70 bg-[var(--segment-accent-glow)] px-6 py-4 text-center shadow-[0_0_36px_var(--segment-accent-glow)]">
          <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Context window</div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {contextItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: index * 0.045 }}
                className="border border-white/12 bg-black/35 px-2 py-2 font-mono text-[0.68rem] uppercase text-white/72"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-[minmax(11rem,1fr)_minmax(22rem,30rem)_minmax(11rem,1fr)] items-center gap-8">
          <div className="text-right">
            <div className="font-mono text-xs uppercase text-white/42">Input</div>
            <div className="mt-3 text-2xl font-semibold text-white">tokens in</div>
          </div>

          <motion.div
            initial={{ opacity: 0.75, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            className="relative border border-white/18 bg-black px-8 py-9 text-center shadow-[0_0_56px_rgba(0,0,0,0.75)]"
          >
            <div className="absolute left-6 right-6 top-5 h-px bg-white/12" />
            <div className="font-mono text-xs uppercase text-white/38">Large language model</div>
            <div className="mt-3 text-5xl font-semibold text-white">LLM</div>
            <div className="mt-4 font-mono text-sm uppercase text-[var(--segment-accent)]">predict next token</div>
            <div className="absolute bottom-5 left-6 right-6 h-px bg-white/12" />
          </motion.div>

          <div>
            <div className="font-mono text-xs uppercase text-white/42">Output</div>
            <div className="mt-3 text-2xl font-semibold text-white">next token out</div>
          </div>
        </div>

        <div className="mt-8 text-center font-mono text-xs uppercase text-white/42">
          output is fed back into context, and the loop repeats
        </div>
      </div>
      {caption && <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">{caption}</figcaption>}
    </figure>
  );
}

function NeuralNetworkDiagram({ caption }: { caption?: string }) {
  const layers = [4, 6, 6, 5, 3];
  const points = layers.flatMap((count, layerIndex) =>
    Array.from({ length: count }, (_, nodeIndex) => ({
      layerIndex,
      nodeIndex,
      x: 90 + layerIndex * 145,
      y: 55 + nodeIndex * (250 / Math.max(1, count - 1)),
    })),
  );

  return (
    <figure className="mt-10 max-w-6xl">
      <div className="grid grid-cols-[minmax(0,1fr)_22rem] gap-8">
        <svg viewBox="0 0 760 360" className="h-[22rem] w-full border border-white/12 bg-white/[0.018]">
          {layers.slice(0, -1).flatMap((count, layerIndex) => {
            const from = points.filter((point) => point.layerIndex === layerIndex);
            const to = points.filter((point) => point.layerIndex === layerIndex + 1);
            return from.flatMap((source) =>
              to.map((target) => (
                <motion.line
                  key={`${source.layerIndex}-${source.nodeIndex}-${target.nodeIndex}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={source.nodeIndex === target.nodeIndex || Math.abs(source.nodeIndex - target.nodeIndex) === 1 ? 'var(--segment-accent)' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={source.nodeIndex === target.nodeIndex ? 2 : 1}
                  initial={{ opacity: 0.15 }}
                  animate={{ opacity: source.nodeIndex === target.nodeIndex ? [0.35, 0.9, 0.35] : 0.22 }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: layerIndex * 0.18 }}
                />
              )),
            );
          })}
          {points.map((point) => (
            <motion.circle
              key={`${point.layerIndex}-${point.nodeIndex}`}
              cx={point.x}
              cy={point.y}
              r={8}
              fill={point.layerIndex === 0 || point.layerIndex === layers.length - 1 ? 'var(--segment-accent)' : '#f8fafc'}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: point.layerIndex * 0.12 }}
            />
          ))}
          <text x="90" y="335" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="13" textAnchor="middle">input</text>
          <text x="380" y="335" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="13" textAnchor="middle">learned layers</text>
          <text x="670" y="335" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="13" textAnchor="middle">output</text>
        </svg>

        <div className="border border-white/12 bg-white/[0.025] p-6">
          <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">What training changes</div>
          <div className="mt-5 space-y-4 text-xl leading-snug text-white/86">
            <p>Connections get stronger or weaker.</p>
            <p>Layers learn patterns in language and data.</p>
            <p>The next output is shaped by the path through the network.</p>
          </div>
        </div>
      </div>
      {caption && <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">{caption}</figcaption>}
    </figure>
  );
}

function ScaleCurveDiagram({ caption }: { caption?: string }) {
  const points = [
    { x: 72, y: 268, label: 'small', detail: 'specific tasks' },
    { x: 196, y: 230, label: 'larger', detail: 'better transfer' },
    { x: 332, y: 168, label: 'frontier', detail: 'few-shot behavior' },
    { x: 520, y: 82, label: 'agentic', detail: 'more general work' },
  ];
  const path = 'M72 268 C150 258 180 240 196 230 C260 198 288 186 332 168 C420 132 470 96 520 82';

  return (
    <figure className="mt-10 max-w-6xl">
      <div className="grid grid-cols-[minmax(0,1fr)_24rem] gap-8 border border-white/12 bg-white/[0.018] p-8">
        <svg viewBox="0 0 600 330" className="h-[24rem] w-full">
          <defs>
            <linearGradient id="scaleCurveGradient" x1="72" y1="268" x2="520" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.28)" />
              <stop offset="1" stopColor="var(--segment-accent)" />
            </linearGradient>
          </defs>
          <line x1="54" y1="284" x2="552" y2="284" stroke="rgba(255,255,255,0.22)" />
          <line x1="54" y1="284" x2="54" y2="48" stroke="rgba(255,255,255,0.22)" />
          <text x="52" y="32" fill="rgba(255,255,255,0.5)" fontFamily="monospace" fontSize="12" textAnchor="middle">capability</text>
          <text x="552" y="316" fill="rgba(255,255,255,0.5)" fontFamily="monospace" fontSize="12" textAnchor="end">scale</text>
          <motion.path
            d={path}
            fill="none"
            stroke="url(#scaleCurveGradient)"
            strokeWidth="5"
            strokeLinecap="square"
            initial={{ pathLength: 0, opacity: 0.55 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          {points.map((point, index) => (
            <motion.g
              key={point.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.2 + index * 0.11 }}
            >
              <rect x={point.x - 7} y={point.y - 7} width="14" height="14" fill="var(--segment-accent)" />
              <text x={point.x} y={point.y - 20} fill="#fff" fontSize="17" fontWeight="700" textAnchor="middle">{point.label}</text>
              <text x={point.x} y={point.y + 31} fill="rgba(255,255,255,0.58)" fontSize="13" textAnchor="middle">{point.detail}</text>
            </motion.g>
          ))}
        </svg>

        <div className="flex flex-col justify-center border-l border-white/12 pl-8">
          <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Scaling intuition</div>
          <div className="mt-5 space-y-4 text-2xl leading-snug text-white/86">
            <p>Bigger models did not just memorize more facts.</p>
            <p>They became better at using examples, transferring patterns, and generalizing.</p>
            <p>That is why the field accelerated so quickly.</p>
          </div>
        </div>
      </div>
      {caption && <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">{caption}</figcaption>}
    </figure>
  );
}

function AgentLoopDiagram({ caption }: { caption?: string }) {
  const nodes = [
    { label: 'User', detail: 'asks for work' },
    { label: 'Harness', detail: 'frames context' },
    { label: 'LLM', detail: 'chooses next step' },
    { label: 'Tools', detail: 'read, act, verify' },
    { label: 'Result', detail: 'fed back in' },
  ];

  return (
    <figure className="mt-10 max-w-6xl">
      <div className="border border-white/12 bg-white/[0.018] p-8">
        <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] items-center gap-4">
          {nodes.map((node, index) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-36 border border-white/12 bg-black/38 p-5"
            >
              {index < nodes.length - 1 && (
                <div className="absolute -right-6 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--segment-accent)]">
                  <ArrowIcon />
                </div>
              )}
              <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Step {twoDigit(index + 1)}</div>
              <div className="mt-4 text-3xl font-semibold text-white">{node.label}</div>
              <div className="mt-3 text-base leading-snug text-white/58">{node.detail}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 border border-[var(--segment-accent)]/45 bg-[var(--segment-accent-glow)] px-5 py-4 text-center text-xl font-semibold text-white"
        >
          The harness keeps looping until the work is done, blocked, or needs approval.
        </motion.div>
      </div>
      {caption && <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">{caption}</figcaption>}
    </figure>
  );
}

function TargetArchitectureDiagram({ caption }: { caption?: string }) {
  const lanes = [
    'M365 Copilot + CoWork',
    'Copilot Studio agents',
    'Customer-facing chatbots',
    'Custom agents',
  ];
  const knowledge = [
    'Organizational wiki',
    'Versioned skills',
    'Prompts and examples',
    'Process maps',
    'Owners and SMEs',
  ];
  const data = [
    'Snowflake',
    'Microsoft Graph / SharePoint',
    'Line-of-business systems',
    'Hosted MCP servers',
    'Approved APIs',
  ];
  const foundation = [
    'Entra ID and on-behalf-of access',
    'Azure AI Foundry and Azure hosting',
    'GitHub, code, and deployments',
    'Audit, policy, monitoring',
  ];

  return (
    <figure className="mt-10 max-w-6xl">
      <div className="border border-white/12 bg-white/[0.018] p-6">
        <div className="font-mono text-xs uppercase text-white/42">Agent lanes</div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {lanes.map((lane, index) => (
            <motion.div
              key={lane}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.045 }}
              className="border border-white/12 bg-black/35 p-4 text-center text-lg font-semibold leading-tight text-white"
            >
              {lane}
            </motion.div>
          ))}
        </div>

        <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="h-px bg-white/14" />
          <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">shared foundation</div>
          <div className="h-px bg-white/14" />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: 0.12 }}
            className="border border-[var(--segment-accent)]/55 bg-[var(--segment-accent-glow)] p-5 shadow-[0_0_36px_var(--segment-accent-glow)]"
          >
            <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Knowledge repository</div>
            <div className="mt-2 text-2xl font-semibold text-white">Skills, process, people, standards</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {knowledge.map((item) => (
                <div key={item} className="border border-white/12 bg-black/35 px-3 py-2 text-base text-white/82">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: 0.18 }}
            className="border border-white/16 bg-white/[0.035] p-5"
          >
            <div className="font-mono text-xs uppercase text-[var(--segment-accent)]">Data and connectors</div>
            <div className="mt-2 text-2xl font-semibold text-white">Data access, actions, system reach</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.map((item) => (
                <div key={item} className="border border-white/12 bg-black/35 px-3 py-2 text-base text-white/82">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {foundation.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.24 + index * 0.04 }}
              className="border border-white/12 bg-black/40 p-3 text-center text-sm leading-snug text-white/66"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
      {caption && <figcaption className="mt-3 font-mono text-xs uppercase text-white/48">{caption}</figcaption>}
    </figure>
  );
}

function SlideDiagram({ slide }: { slide: DeckSlide }) {
  if (!slide.diagram) return null;

  if (slide.diagram.kind === 'llm-flow') {
    return <LlmFlowDiagram caption={slide.diagram.caption} />;
  }

  if (slide.diagram.kind === 'scale-curve') {
    return <ScaleCurveDiagram caption={slide.diagram.caption} />;
  }

  if (slide.diagram.kind === 'agent-loop') {
    return <AgentLoopDiagram caption={slide.diagram.caption} />;
  }

  if (slide.diagram.kind === 'target-architecture') {
    return <TargetArchitectureDiagram caption={slide.diagram.caption} />;
  }

  return <NeuralNetworkDiagram caption={slide.diagram.caption} />;
}

function SlideTable({ slide }: { slide: DeckSlide }) {
  if (!slide.table) return null;
  const table = slide.table;
  const labelColumn = table.labelColumn ?? 'Mechanism';

  return (
    <div className="mt-10 max-w-6xl border border-white/12">
      <div
        className="grid border-b border-white/12 bg-white/[0.025]"
        style={{ gridTemplateColumns: `minmax(12rem, 0.9fr) repeat(${table.columns.length}, minmax(0, 1fr))` }}
      >
        <div className="p-4 font-mono text-xs uppercase text-white/34">{labelColumn}</div>
        {table.columns.map((column) => (
          <div key={column} className="border-l border-white/10 p-4 font-mono text-xs uppercase text-[var(--segment-accent)]">
            {column}
          </div>
        ))}
      </div>
      {table.rows.map((row, rowIndex) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: rowIndex * 0.07 }}
          className="grid border-b border-white/10 last:border-b-0"
          style={{ gridTemplateColumns: `minmax(12rem, 0.9fr) repeat(${table.columns.length}, minmax(0, 1fr))` }}
        >
          <div className="p-4 text-2xl font-semibold text-white">{row.label}</div>
          {row.cells.map((cell, cellIndex) => (
            <div key={`${row.label}-${cellIndex}`} className="border-l border-white/10 p-4 text-xl leading-snug text-white/78">
              {cell}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function SlideBrandGroups({ slide }: { slide: DeckSlide }) {
  if (!slide.brandGroups?.length) return null;

  return (
    <div className="mt-10 grid max-w-6xl grid-cols-2 gap-6">
      {slide.brandGroups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: groupIndex * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="border border-white/12 bg-white/[0.025] p-6"
        >
          <div className="mb-5 font-mono text-xs uppercase text-[var(--segment-accent)]">{group.title}</div>
          <div className="grid grid-cols-2 gap-3">
            {group.items.map((item, itemIndex) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, delay: groupIndex * 0.08 + itemIndex * 0.045 }}
                className="flex min-h-24 items-center gap-4 border border-white/10 bg-black/35 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--segment-accent)]/55 bg-[var(--segment-accent-glow)] font-mono text-sm font-semibold text-[var(--segment-accent)]">
                  {initials(item.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold leading-tight text-white">{item.name}</div>
                  {item.detail && <div className="mt-1 text-sm leading-snug text-white/52">{item.detail}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SlideColumns({ slide }: { slide: DeckSlide }) {
  if (!slide.columns?.length) return null;

  return (
    <div
      className={`mt-10 grid max-w-6xl gap-5 ${
        slide.columns.length === 2
          ? 'grid-cols-2'
          : slide.columns.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-4'
      }`}
    >
      {slide.columns.map((column, columnIndex) => (
        <motion.div
          key={column.title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: columnIndex * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 border border-white/12 bg-white/[0.025] p-5"
        >
          <div className="mb-5 font-mono text-xs uppercase text-[var(--segment-accent)]">{column.title}</div>
          <div className="space-y-3">
            {column.items.map((item, itemIndex) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.28,
                  delay: columnIndex * 0.08 + itemIndex * 0.045 + 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border-t border-white/10 pt-3 text-xl leading-snug text-white/88 first:border-t-0 first:pt-0"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProgressRail({
  slides,
  currentAbsoluteIndex,
  onGoToSlide,
}: {
  slides: SlideEntry[];
  currentAbsoluteIndex: number;
  onGoToSlide?: (absoluteIndex: number) => void;
}) {
  return (
    <div
      className="grid min-w-0 items-center gap-1"
      style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}
    >
      {slides.map((entry, index) => {
        const className = `h-1 w-full rounded-full transition-all ${
          index === currentAbsoluteIndex
            ? ''
            : index < currentAbsoluteIndex
              ? 'bg-white/35'
              : 'bg-white/16 hover:bg-white/28'
        }`;
        const style = index === currentAbsoluteIndex ? {
          backgroundColor: 'var(--segment-accent)',
          boxShadow: '0 0 18px var(--segment-accent-glow)',
        } : undefined;

        if (!onGoToSlide) {
          return (
            <span
              key={`${entry.segment.id}-${entry.slide.id}`}
              title={entry.slide.title}
              style={style}
              className={className}
            />
          );
        }

        return (
          <button
            key={`${entry.segment.id}-${entry.slide.id}`}
            type="button"
            onClick={() => onGoToSlide(index)}
            title={entry.slide.title}
            style={style}
            className={className}
          />
        );
      })}
    </div>
  );
}

function buildStepInfo(segment: DeckSegment, slide: DeckSlide, absoluteIndex: number, totalSlides: number): PresentationStepInfo {
  return {
    id: slide.id,
    name: slide.title,
    script: slide.speakerNotes,
    segmentTitle: segment.title,
    slideNumber: absoluteIndex + 1,
    totalSlides,
  };
}

export function SlideCanvas({
  currentSegment,
  currentSlide,
  currentStep,
  currentAbsoluteIndex,
  slides,
  isPrint = false,
  onGoToSlide,
}: {
  currentSegment: DeckSegment;
  currentSlide: DeckSlide;
  currentStep: PresentationStepInfo;
  currentAbsoluteIndex: number;
  slides: SlideEntry[];
  isPrint?: boolean;
  onGoToSlide?: (absoluteIndex: number) => void;
}) {
  const titleClass = `whitespace-pre-line font-semibold leading-[1.02] text-white ${
    currentSlide.variant === 'title'
      ? 'text-8xl'
      : currentSlide.timeline || currentSlide.video
        ? 'text-6xl'
        : 'text-7xl'
  }`;
  const accent = currentSegment.accent ?? '#22d3ee';
  const accentStyle = {
    '--segment-accent': accent,
    '--segment-accent-glow': withAlpha(accent, '40'),
  } as CSSProperties;
  const sectionLabel = currentSegment.sectionLabel ?? `Section ${twoDigit(slides[currentAbsoluteIndex].segmentIndex + 1)}`;
  const contentWidthClass = currentSlide.timeline
    ? 'max-w-[88rem]'
    : currentSlide.video
      ? 'max-w-[82rem]'
      : 'max-w-[76rem]';

  const contentBlocks = (
    <>
      <div
        className="mt-8 h-1 w-20"
        style={{
          backgroundColor: 'var(--segment-accent)',
          boxShadow: '0 0 24px var(--segment-accent-glow)',
        }}
      />
      <SlideBody slide={currentSlide} />
      <SlideBullets slide={currentSlide} />
      <SlideTimeline slide={currentSlide} />
      <SlideDiagram slide={currentSlide} />
      <SlideTable slide={currentSlide} />
      <SlideBrandGroups slide={currentSlide} />
      <SlideComparisons slide={currentSlide} />
      <SlideColumns slide={currentSlide} />
      <SlideCode slide={currentSlide} />
      <SlideVideo slide={currentSlide} printable={isPrint} />
      {!currentSlide.image && <SlideImage slide={currentSlide} />}
      <DiscussionPrompt slide={currentSlide} />
    </>
  );

  const slideContent = currentSlide.variant === 'answer' ? (
    <div className="flex min-h-[32rem] items-center justify-center">
      <h1 className="flex items-center justify-center gap-12 text-center font-semibold leading-none text-white">
        {isPrint ? (
          <>
            <span className="text-[10rem]">Yes</span>
            <span className="text-6xl font-medium text-white/56">and</span>
            <span className="text-[10rem]">No</span>
          </>
        ) : (
          <>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-[10rem]"
            >
              Yes
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="text-6xl font-medium text-white/56"
            >
              and
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-[10rem]"
            >
              No
            </motion.span>
          </>
        )}
      </h1>
    </div>
  ) : currentSlide.image ? (
    <div className="grid max-w-[95rem] grid-cols-[minmax(0,1fr)_minmax(28rem,36rem)] items-center gap-12">
      <div className="min-w-0">
        <h1 className={titleClass}>{currentSlide.title}</h1>
        {contentBlocks}
      </div>
      <SlideImage slide={currentSlide} prominent />
    </div>
  ) : (
    <div className={contentWidthClass}>
      <h1 className={titleClass}>{currentSlide.title}</h1>
      {contentBlocks}
    </div>
  );

  const sectionClassName = 'flex h-full min-h-0 flex-col justify-center pb-32 pt-24';

  return (
    <main
      className={`slide-canvas relative h-full overflow-hidden px-16 py-12 ${isPrint ? 'print-slide-canvas' : ''}`}
      style={accentStyle}
    >
      <header className="absolute left-16 right-16 top-12 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="uppercase text-[var(--segment-accent)]">
              {sectionLabel}
            </span>
            <span className="h-4 w-px bg-white/30" />
            <span className="truncate text-white/64">{currentSegment.title}</span>
          </div>
        </div>
      </header>

      {isPrint ? (
        <section className={sectionClassName}>
          {slideContent}
        </section>
      ) : (
        <AnimatePresence mode="wait">
        <motion.section
          key={currentSlide.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={sectionClassName}
        >
          {slideContent}
        </motion.section>
        </AnimatePresence>
      )}

      <footer className="absolute bottom-9 left-16 right-16 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8 font-mono text-xs text-white/52">
        <span>
          {currentStep.slideNumber} / {currentStep.totalSlides}
        </span>
        <ProgressRail
          slides={slides}
          currentAbsoluteIndex={currentAbsoluteIndex}
          onGoToSlide={onGoToSlide}
        />
        <span>{currentSegment.shortTitle}</span>
      </footer>
    </main>
  );
}

export function ContentArea() {
  const {
    currentSegment,
    currentSlide,
    currentStep,
    currentAbsoluteIndex,
    slides,
    dispatch,
  } = usePresentation();

  return (
    <SlideCanvas
      currentSegment={currentSegment}
      currentSlide={currentSlide}
      currentStep={currentStep}
      currentAbsoluteIndex={currentAbsoluteIndex}
      slides={slides}
      onGoToSlide={(absoluteIndex) => dispatch({ type: 'GO_TO_SLIDE', absoluteIndex })}
    />
  );
}

export function PrintableDeck() {
  const { slides } = usePresentation();
  const { exportAspectRatio, exportZoomPercent } = useControls();
  const printDeckStyle = {
    '--pdf-font-scale': Number((exportZoomPercent / 100).toFixed(3)),
  } as CSSProperties;
  const aspectRatioClass = `print-ratio-${exportAspectRatio.replace(':', '-')}`;

  return (
    <div className={`print-deck ${aspectRatioClass}`} aria-hidden="true" style={printDeckStyle}>
      {slides.map((entry, index) => (
        <div key={`${entry.segment.id}-${entry.slide.id}`} className="print-page">
          <SlideCanvas
            currentSegment={entry.segment}
            currentSlide={entry.slide}
            currentStep={buildStepInfo(entry.segment, entry.slide, index, slides.length)}
            currentAbsoluteIndex={index}
            slides={slides}
            isPrint
          />
        </div>
      ))}
    </div>
  );
}
