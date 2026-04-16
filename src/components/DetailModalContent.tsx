import type { Challenge, Character, ConceptItem, Epic, QuoteItem, WayItem } from '../types';

function resolveAssetPath(assetPath: string) {
  if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }

  const normalizedBase = import.meta.env.BASE_URL ?? '/';
  const trimmedBase = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${trimmedBase}${trimmedAsset}`;
}

const severityBadge = {
  critical: 'bg-red-500/20 text-red-200 border-red-500/35',
  high: 'bg-orange-500/20 text-orange-200 border-orange-500/35',
  medium: 'bg-yellow-500/20 text-yellow-100 border-yellow-500/35',
};

function isWayItem(concept: ConceptItem | WayItem): concept is WayItem {
  return 'principles' in concept;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-xs md:text-sm uppercase tracking-[0.18em] text-white/55 font-semibold mb-3">
      {children}
    </h3>
  );
}

export function ChallengeDetailContent({ challenge }: { challenge: Challenge }) {
  return (
    <div className="space-y-8">
      <div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border mb-5 ${severityBadge[challenge.severity]}`}
        >
          {challenge.severity} severity
        </span>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight pr-12">
          {challenge.title}
        </h2>
        <p className="text-base md:text-lg text-white/68 mt-2 leading-snug">{challenge.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div>
          <SectionLabel>Description</SectionLabel>
          <p className="text-base md:text-lg text-white/82 leading-relaxed">{challenge.description}</p>
        </div>

        <div
          className="p-5 md:p-6 rounded-2xl border"
          style={{
            backgroundColor: `${challenge.color}10`,
            borderColor: `${challenge.color}26`,
          }}
        >
          <SectionLabel>Impact</SectionLabel>
          <p className="text-base md:text-lg text-white/82 leading-relaxed">{challenge.impact}</p>
        </div>
      </div>
    </div>
  );
}

export function CharacterDetailContent({ character }: { character: Character }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-7">
        <div
          className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-3xl flex items-center justify-center text-5xl md:text-6xl flex-shrink-0"
          style={{ backgroundColor: `${character.color}18` }}
        >
          {character.avatar}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight pr-12">
            {character.name}
          </h2>
          <p className="text-base md:text-lg text-white/68 mt-1 leading-snug">{character.role}</p>
          <p className="text-base md:text-lg font-semibold mt-3" style={{ color: character.color }}>
            {character.archetype}
          </p>
          <p className="text-sm md:text-base text-white/58 mt-1">{character.traits}</p>
        </div>
      </div>

      <div>
        <SectionLabel>About</SectionLabel>
        <p className="text-base md:text-lg text-white/82 leading-relaxed">{character.description}</p>
      </div>

      <div>
        <SectionLabel>Arc</SectionLabel>
        <p className="text-base md:text-lg text-white/76 leading-relaxed">{character.arc}</p>
      </div>
    </div>
  );
}

export function QuoteDetailContent({ quote }: { quote: QuoteItem }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-7">
        <div
          className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-3xl flex items-center justify-center text-5xl md:text-6xl flex-shrink-0"
          style={{ backgroundColor: `${quote.color}18` }}
        >
          {quote.avatar}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight pr-12">
            {quote.characterName}
          </h2>
          <p className="text-base md:text-lg text-white/68 mt-1 leading-snug">{quote.characterRole}</p>
        </div>
      </div>

      <blockquote
        className="pl-5 py-4 border-l-[3px] italic text-xl md:text-2xl lg:text-3xl text-white/88 leading-relaxed"
        style={{ borderColor: quote.color }}
      >
        &ldquo;{quote.text}&rdquo;
      </blockquote>

      {quote.imagePath && (
        <figure className="space-y-3">
          <img
            src={resolveAssetPath(quote.imagePath)}
            alt={quote.imageAlt ?? `${quote.characterName} supporting image`}
            className="block w-full h-auto max-h-[500px] object-contain"
          />
          {quote.imageCaption && (
            <figcaption className="text-sm md:text-base text-white/58 leading-relaxed">
              {quote.imageCaption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}

export function ConceptDetailContent({
  concept,
  revealedIds,
}: {
  concept: ConceptItem | WayItem;
  revealedIds?: Set<string>;
}) {
  const color = concept.color;

  return (
    <div className="space-y-8">
      <div>
        <div
          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs md:text-sm font-medium mb-5"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {concept.subtitle}
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight pr-12">
          {concept.title}
        </h2>
      </div>

      <div>
        <SectionLabel>Description</SectionLabel>
        <p className="text-base md:text-lg text-white/82 leading-relaxed">{concept.description}</p>
      </div>

      {'examples' in concept && concept.examples && (
        <div>
          <SectionLabel>Examples</SectionLabel>
          <ul className="space-y-3">
            {concept.examples.map((example, index) => (
              <li key={index} className="flex items-start gap-3 text-base md:text-lg text-white/78 leading-relaxed">
                <span style={{ color }} className="mt-1 text-xs md:text-sm">●</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isWayItem(concept) && concept.principles && (
        <div>
          <SectionLabel>Principles</SectionLabel>
          <div className="space-y-4">
            {concept.principles.map((principle) => {
              return (
                <div
                  key={principle.id}
                  className="p-4 md:p-5 rounded-2xl border transition-all duration-500"
                  style={{
                    backgroundColor: `${color}12`,
                    borderColor: `${color}28`,
                  }}
                >
                  <h4 className="text-base md:text-lg font-semibold mb-2 text-white/96">
                    {principle.title}
                  </h4>
                  <p className="text-sm md:text-base leading-relaxed text-white/82">
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function EpicDetailContent({ epic }: { epic: Epic }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 md:gap-5">
        <span className="text-3xl md:text-4xl flex-shrink-0">{epic.icon}</span>
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight pr-12">
            {epic.title}
          </h2>
          <p className="text-base md:text-lg text-white/68 mt-2 leading-snug">{epic.subtitle}</p>
        </div>
      </div>

      <span
        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
        style={{ backgroundColor: `${epic.color}24`, color: epic.color }}
      >
        {epic.status}
      </span>

      <p className="text-base md:text-lg text-white/82 leading-relaxed">{epic.description}</p>
    </div>
  );
}